import { mapObject, mapRequired } from "../utils/objects.js";

////////////////
// Primitives //

export interface SelfEncoded {
    meta: { class: string };
    params: any;
}
export interface SelfEncoder {
    encode(): SelfEncoded;
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
    if (obj?.encode && typeof obj.encode === 'function')
        return obj.encode();
    const cls = classof(obj);
    if (typeof cls === 'string')
        return { params: { ...mapRequired(encrec, obj) }, meta: { class: cls } }
    if (obj && typeof obj === 'object')
        return mapRequired(encrec, obj);
    return obj;
}

//////////////
// Decoding //

export interface Creator<Type> {
    create(name: string, params: any): Type;
}

export function decrec<Type>(data: any, creator: Creator<Type>): any {
    if (typeof data?.meta?.class !== 'string' || data?.params === undefined)
        return mapObject((nested: any) => decrec(nested, creator), data);
    return creator.create(data.meta.class, decrec(data.params, creator));
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

    create(name: string, params: any): any {
        const ructor = this.classes.get(name);
        return ructor ? new ructor(params) : params;
    }

    registered(name: string): boolean { return this.classes.has(name) }
    decode(data: any): any { return decrec(data, this) }
}
