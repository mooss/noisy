/**
 * Deep clones a value, does not clone private fields.
 * Don't really expect it to return fully correct objects, it only works somewhat for basic stuff.
 */
export function clone<T>(instance: T): T {
    // Primitive types.
    if (instance === null || instance === undefined || typeof instance !== 'object') {
        return instance;
    }

    // Arrays.
    if (Array.isArray(instance)) {
        return instance.map(item => clone(item)) as T;
    }

    // Objects.
    const data = structuredClone(instance);
    const empty = Object.create(Object.getPrototypeOf(instance));
    return Object.assign(empty, data);
}

export function isObject(variable: any) {
    return typeof variable === 'object' && variable !== null;
}

/**
 * Maps fun to each value of obj, creating a new object when the object has entries, otherwise obj
 * is returned as-is.
 */
export function mapProperties(fun: (x: any) => any, obj: any): any {
    if (!isObject(obj)) return obj;
    const res = {};
    for (const [prop, value] of Object.entries(obj))
        res[prop] = fun(value);
    return res;
}

/** Calls fun on each entry of obj, does nothing when obj does not have any entry. */
export function foreachEntries(fun: (key: string, value: any) => void, obj: any): void {
    if (!isObject(obj)) return;
    for (const [prop, value] of Object.entries(obj))
        fun(prop, value);
}

type PropertiesOf<T> = {
    [K in keyof T]: T[K] extends Function ? never : K
}[keyof T];
type Properties<T> = Pick<T, PropertiesOf<T>>;

/**
 * A class whose constructor takes only one parameter of type T and assign all its fields to itself.
 * Meant to be used with a data class that contains only declarations and is itself extended by a
 * class that implements the logic and other potential addition fields.
 */
export class AutoAssign<T> {
    constructor(fields: Properties<T>) {
        if (!isObject(fields)) return;
        for (const [prop, value] of Object.entries(fields)) {
            (this as any)[prop] = value;
        }
    }
}
