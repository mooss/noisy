import { AutoAssign, mapObjectOrArray, mapRequired } from "../utils/objects.js";

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

//////////////
// Encoding //

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
// Decoding //

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
 * Recursively decodes data by instantiating objects where possible using a Creator.
 *
 * @param data    - The data to decode.
 * @param creator - The Creator instance used to instantiate objects.
 * @returns The decoded data with instantiated objects where applicable.
 */
export function decrec<Type>(data: any, creator: Creator<Type>): any {
    const res = mapObjectOrArray((nested: any) => decrec(nested, creator), data);
    if (typeof res?.['#meta']?.class === 'string')
        return creator.create(res);
    return res;
}

/**
 * Type alias for a constructor function that creates instances of Type with exactly one parameter.
 */
export type Ctor<Type, Params = any> = new (params: Params) => Type;

/**
 * Registry of self-encoded classes, allowing to instantiate objects from the class annotations of
 * self-encoded data (#meta.class).
 */
export class Registry<Type> {
    /** Internal map from registered metadata class names to their constructors. */
    private classes = new Map<string, Ctor<Type>>;

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

    /**
     * Decodes self-encoded data by recursively instantiating objects where possible.
     * @param data - The data to decode.
     * @returns The decoded data.
     */
    decode(data: any): any { return decrec(data, this) }
}
