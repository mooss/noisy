import { AutoAssign, mapObjectOrArray, mapRequired } from "../utils/objects.js";

////////////////
// Primitives //

export type SelfEncoded<T> = T & {
    '#meta': { class: string };
}

export interface SelfEncoder<T> {
    encode(): SelfEncoded<T>;
}

export abstract class AutoEncoder<T> extends AutoAssign<T> {
    abstract class(): string;
}

//////////////
// Encoding //

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

export interface Creator<Type> {
    create(data: SelfEncoded<Type>): Type;
}

export function decrec<Type>(data: any, creator: Creator<Type>): any {
    const res = mapObjectOrArray((nested: any) => decrec(nested, creator), data);
    if (typeof res?.['#meta']?.class === 'string')
        return creator.create(res);
    return res;
}

export type Ctor<Type, Params = any> = new (params: Params) => Type;

export class Registry<Type> {
    private classes = new Map<string, Ctor<Type>>;

    /**
     * Try to register the a constructor, returns true when the registration is successful and false
     * when a constructor is already registered under this name.
     */
    register(name: string, constructor: Ctor<Type>): boolean {
        if (this.classes.has(name)) return false;
        this.classes.set(name, constructor);
        return true;
    }

    create(data: SelfEncoded<Type>): any {
        const ructor = this.classes.get(data['#meta'].class);
        // Keeping the metadata will corrupt the encoding with nested #meta fields when re-encoding.
        delete data['#meta'];
        return ructor ? new ructor(data) : data;
    }

    registered(name: string): boolean { return this.classes.has(name) }
    decode(data: any): any { return decrec(data, this) }
}
