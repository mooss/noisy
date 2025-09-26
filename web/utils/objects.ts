/**
 * Deep clones a value, does not clone private fields.
 * Don't really expect it to return fully correct objects, it only works somewhat for basic stuff.
 */
export function clone<T>(obj: T): T {
    // Primitive types.
    if (!isObject(obj)) return obj;

    // Arrays.
    if (Array.isArray(obj)) return obj.map(item => clone(item)) as T;

    // Objects.
    const data = structuredClone(obj);
    const empty = Object.create(Object.getPrototypeOf(obj));
    return Object.assign(empty, data);
}

export function isObject(obj: any) {
    return typeof obj === 'object' && obj !== null;
}

export function isEmptyObject(value: unknown): value is {} {
    return value != null &&
        value.constructor === Object &&
        Object.getPrototypeOf(value) === Object.prototype &&
        Object.keys(value).length === 0;
}

/** Maps fun to each value of obj, creating a new object. */
export function mapRequired<T extends object>(
    fun: (x: any) => any, obj: Required<T>,
): Required<T> {
    if (obj == null) return null;
    const res = {};
    for (const [prop, value] of Object.entries(obj))
        res[prop] = fun(value);
    return res as Required<T>;
}

/**
 * Maps fun to each value of obj, creating a new object when the object has entries, otherwise the
 * object is returned as-is.
 */
export function mapObject(fun: (x: any) => any, obj: Object): any {
    if (!isObject(obj)) return obj;
    return mapRequired(fun, obj);
}

/**
 * Applies fun to every element of obj.
 * When it is an array, its values are mapped and an array is returned.
 * When it is another object, its values are mapped and an object is returned.
 * When it is a primitive, it is returned as-is.
 */
export function mapObjectOrArray(fun: (x: any) => any, obj: any): any {
    if (!isObject(obj)) return obj;
    if (Array.isArray(obj)) return obj.map(fun);
    return mapRequired(fun, obj);
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
