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
 *
 * @template Type - The base type of objects that can be registered and instantiated.
 */
export class Registry<Type> extends CodecABC<any, any> {
    /** Internal map from registered metadata class names to their constructors. */
    private classes = new Map<string, Ctor<Type>>();

    //////////////
    // Registry //

    /**
     * Tries to register a constructor, returns true when the registration is successful and false
     * when a constructor is already registered under this name.
     *
     * @param name        - The unique name under which the constructor will be registered.
     * @param constructor - The constructor function to register.
     * @returns true if the registration succeeded, false if the name was already taken.
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
     * The method looks for a `#meta.class` property inside the provided data.
     * If a constructor bearing that name has been registered, a new instance is created by passing
     * the **remaining** properties (excluding `#meta`) to the constructor.
     * When there is no `#meta.class` or the class is unknown, the original data is returned as-is.
     *
     * @param data - Self-encoded data to instantiate.
     * @returns the instantiated object when successful or raw data when the class is unknown.
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
     *
     * The operation respects object-level `encode()` methods and injects `#meta.class` annotations
     * when required.
     * Circular references and duplicated references are preserved through an aliasing mechanism.
     *
     * @param document - The value to encode.
     * @returns the encoded representation ready for serialization.
     */
    encode(document: any): any {
        return new AliasingEncoder().encode(document);
    }

    /**
     * Decodes self-encoded data by recursively instantiating registered objects where possible.
     *
     * The method re-creates class instances based on `#meta.class` annotations and resolves
     * aliases generated during encoding.
     *
     * @param document - The data to decode.
     * @returns The decoded and instantiated data.
     */
    decode(document: any): any {
        return new AliasingDecoder(this).decode(document);
    }
}

/**
 * Helper that tracks previously seen values and assigns short unique aliases to them.
 * Used to detect and encode circular references / duplicated objects.
 */
class Aliaser {
    private seen = new Set();
    private gen = mapit((x) => x.join(''), combinations(LATIN_ALPHABET));
    aliases = new Map<any, string>();

    /**
     * Retrieves an alias for a previously seen value.
     * @param obj - The object to test.
     * @returns the alias string if the object was seen before, `undefined` on first encounter.
     */
    get(obj: any): string {
        if (!this.seen.has(obj)) { // First time?
            this.seen.add(obj);
            return undefined;
        }

        if (obj in this.aliases) return this.aliases[obj];

        const ali = this.gen.next().value;
        this.aliases.set(obj, ali);
        return ali;
    }
}

/**
 * Encoder that transparently handles aliasing for circular references and duplicated objects.
 */
class AliasingEncoder {
    aliaser = new Aliaser();
    private raw2encoded = new Map();

    /**
     * Encodes a document, injecting alias information when needed.
     * @param document - The value to encode.
     * @returns the encoded payload, potentially augmented with an alias dictionary under key `'$'`.
     */
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
        if (alias !== undefined) return '$' + alias;

        // Every encoded document is registered for alias switching purposes.
        const res = this.encodeImpl(document);
        this.raw2encoded.set(document, res);
        return res;
    }

    private encodeImpl(document: any): any {
        // Encoding handled by the object itself.
        if (document?.encode && typeof document.encode === 'function')
            // Use the custom encoding but request to use this encoder for recursion.
            return document.encode(this.encodeAlias.bind(this));

        // Self-encoded object through a string property or a method returning a string.
        const cls = classof(document);
        if (typeof cls === 'string')
            return {
                ...mapRequired(this.encodeAlias.bind(this), document),
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

/**
 * Decoder that re-creates original objects, resolving aliases and instantiating registered classes.
 */
class AliasingDecoder {
    constructor(private registry: Registry<any>) { }

    /**
     * Decodes a document, re-instantiating registered classes and resolving aliases.
     * @param document - The encoded payload.
     * @returns the decoded value graph.
     */
    decode(document: any): any {
        let aliases = document['$'];
        if (aliases === undefined) return this.rawDecode(document);

        aliases = this.rawDecode(aliases);
        delete document['$'];

        return this.aliasDecode(document, aliases);
    }

    private rawDecode(document: any): any {
        const res = mapObjectOrArray((nested: any) => this.rawDecode(nested), document);
        if (typeof res?.['#meta']?.class === 'string')
            return this.registry.create(res);
        return res;
    }

    private aliasDecode(document: any, aliases: Object) {
        if (typeof document === 'string' && document.startsWith('$'))
            return aliases[document.slice(1)];
        const res = mapObjectOrArray((nested: any) => this.aliasDecode(nested, aliases), document);
        if (typeof res?.['#meta']?.class === 'string')
            return this.registry.create(res);
        return res;
    }
}
