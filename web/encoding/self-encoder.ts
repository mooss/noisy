import { LATIN_ALPHABET } from "../constants.js";
import { combinations, mapit } from "../utils/iteration.js";
import { AutoAssign, isObject, mapObjectOrArray, mapRequired } from "../utils/objects.js";
import { CodecABC } from "./encoding.js";

////////////////
// Primitives //

/**
 * Represents a type that has been self-encoded, including metadata about its class.
 * This is used to preserve type information during encoding so that the class can be instantiated
 * when decoding.
 */
export type SelfEncoded<T> = T & {
    '#meta': { class: string };
}

/**
 * Interface for objects that can encode themselves into a SelfEncoded form.
 */
export interface SelfEncoder<T> {
    /**
     * Encodes the object into a SelfEncoded representation.
     * @returns the encoded object with class metadata.
     */
    encode(): SelfEncoded<T>;
}

/**
 * Abstract base class for objects that are constructed from a single object whose properties are
 * automatically mapped to the created instance.
 */
export abstract class AutoEncoder<T> extends AutoAssign<T> {
    /**
     * @returns the metadata class name used for encoding/decoding purposes.
     */
    abstract class(): string;
}

//////////////////////////////////////
// Recursive self encoding/decoding //

/**
 * Determines the class name of an object, obtained either from a string property or from a method
 * returning a string.
 *
 * @param obj - The object to inspect.
 * @returns the class name if found, undefined otherwise.
 */
function classof(obj: any): string | undefined {
    const cls = obj?.class;
    if (typeof cls === 'string') return cls;
    if (typeof cls == 'function') return obj.class();
    return undefined;
}

/** Recursively encodes a nested record of self-encoders. */
export function encrec(obj: any): any {
    // Encoding handled by the object itself.
    if (obj?.encode && typeof obj.encode === 'function')
        return obj.encode();

    // Self-encoded object through a string property or a method returning a string.
    const cls = classof(obj);
    if (typeof cls === 'string')
        return { ...mapRequired(encrec, obj), '#meta': { class: cls } };

    // A plain object, array or primitive that will be encoded as-is.
    return mapObjectOrArray(encrec, obj);
}

//////////////
// Registry //

/**
 * Interface for objects that can create instances of Type from SelfEncoded data.
 */
export interface Creator<Type> {
    /**
     * Creates an instance of Type from SelfEncoded data.
     *
     * @param data - The self-encoded data to create the instance from.
     * @returns the created instance.
     */
    create(data: SelfEncoded<Type>): Type;
}

/**
 * Type alias for a constructor function that creates instances of Type with exactly one parameter.
 */
export type Ctor<Type, Params = any> = new (params: Params) => Type;

/**
 * Registry of self-encoded classes, allowing to instantiate objects from the class annotations of
 * self-encoded data (#meta.class).
 */
export class Registry<Type> extends CodecABC<any, any> {
    /** Internal map from registered metadata class names to their constructors. */
    private classes = new Map<string, Ctor<Type>>;

    //////////////
    // Registry //

    /**
     * Tries to register the a constructor, returns true when the registration is successful and false
     * when a constructor is already registered under this name.
     */
    register(name: string, constructor: Ctor<Type>): boolean {
        if (this.classes.has(name)) return false;
        this.classes.set(name, constructor);
        return true;
    }

    /**
     * Instantiates an object from self-encoded data (returns the data as-is if it does not
     * correspond to a registered class).
     *
     * @param data - Self-encoded data to instantiate.
     * @returns the instantiated object when successful or the data itself.
     */
    create(data: SelfEncoded<Type>): any {
        const ructor = this.classes.get(data['#meta']?.class);
        // Keeping the metadata will corrupt the encoding with nested #meta fields when re-encoding.
        delete data['#meta'];
        return ructor ? new ructor(data) : data;
    }

    /**
     * Checks if a class is registered under the given name.
     * @param name - The name of the class to check.
     * @returns true if the class is registered, false otherwise.
     */
    registered(name: string): boolean { return this.classes.has(name) }

    ///////////
    // Codec //

    /**
     * Recursively encodes self-encodable objects.
     */
    encode(document: any): any { return encrec(document) }

    /**
     * Decodes self-encoded data by recursively instantiating registered objects where possible.
     * @param document - The data to decode.
     * @returns The decoded and instantiated data.
     */
    decode(document: any): any {
        const res = mapObjectOrArray((nested: any) => this.decode(nested), document);
        if (typeof res?.['#meta']?.class === 'string')
            return this.create(res);
        return res;
    }
}

class Aliaser {
    private seen = new Set();
    private gen = mapit((x) => x.join(''), combinations(LATIN_ALPHABET));
    aliases = new Map<any, string>();

    get(obj: any): string {
        if (!this.seen.has(obj)) { // First time?
            this.seen.add(obj);
            return null;
        }

        if (obj in this.aliases) return this.aliases[obj];

        const ali = this.gen.next().value;
        this.aliases.set(obj, ali);
        return ali;
    }
}

class AliasingEncoder {
    aliaser = new Aliaser();
    private raw2encoded = new Map();

    encode(document: any): any {
        const res = this.encodeAlias(document);
        if (this.aliaser.aliases.size == 0) return res;

        // Map encoded objects to their alias and aliases to their encoded object.
        const encoded2alias = new Map<any, string>();
        const alias2encoded = {};
        for (const [raw, alias] of this.aliaser.aliases) {
            const encd = this.raw2encoded.get(raw);
            encoded2alias.set(encd, '$' + alias);
            alias2encoded[alias] = encd;
        }

        // Make sure that aliased encoded objects are referenced through their alias.
        this.substitute(res, encoded2alias);

        // Add aliasing information.
        res['$'] = alias2encoded;

        return res;
    }

    private encodeAlias(document: any): any {
        if (!isObject(document)) return document;

        // Duplicated documents will not be encoded twice (also prevent cycles).
        const alias = this.aliaser.get(document);
        if (alias !== null) return '$' + alias;

        // Every encoded document is registered for alias switching purposes.
        const res = this.encodeImpl(document);
        this.raw2encoded.set(document, res);
        return res;
    }

    private encodeImpl(document: any): any {
        // Encoding handled by the object itself.
        if (document?.encode && typeof document.encode === 'function')
            return document.encode();

        // Self-encoded object through a string property or a method returning a string.
        const cls = classof(document);
        if (typeof cls === 'string')
            return {
                ...mapRequired(
                    this.encodeAlias.bind(this), document),
                '#meta': { class: cls },
            };

        // A plain object, array or primitive that will be encoded as-is.
        return mapObjectOrArray(this.encodeAlias.bind(this), document);
    }

    private substitute(encoded: any, aliases: Map<any, string>) {
        if (!isObject(encoded)) return encoded;
        for (const [prop, value] of Object.entries(encoded)) {
            const ali = aliases.get(value);
            if (ali === undefined) {
                this.substitute(value, aliases);
                continue;
            }

            encoded[prop] = ali;
        }
    }
}
