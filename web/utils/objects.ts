/** Deep clones an instance, does not clone private fields. */
export function clone<T>(instance: T): T {
    const data = structuredClone(instance);
    const empty = Object.create(instance.constructor.prototype);
    return Object.assign(empty, data);
}

export function isObject(variable: any) {
    return typeof variable === 'object' && variable !== null;
}

/**
 * Maps fun to each value of obj, creating a new object when the object has entries, otherwise obj
 * is returned as-is.
 */
export function mapValues(fun: (x: any) => any, obj: any): any {
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
