export type Keys = keyof any;
export type Mappable<K extends Keys = any, V = any> = Map<K, V> | Record<K, V>;

export function sortedMap<K, V>(
    map: Map<K, V>,
    compareFn: (a: [K, V], b: [K, V]) => number
): Map<K, V> {
    const sortedEntries = Array.from(map.entries()).sort(compareFn);
    return new Map(sortedEntries);
}

export function ensureMap<K extends Keys, V>(source: Mappable<K, V>): Map<K, V> {
    if (source instanceof Map) return source;
    return new Map(Object.entries(source)) as Map<K, V>;
}

export function ensureRecord<K extends Keys, V>(source: Mappable<K, V>): Record<K, V> {
    if (!(source instanceof Map)) return source;

    const result: Partial<Record<K, V>> = {};
    for (const [key, value] of source.entries()) {
        result[key as K] = value;
    }
    return result as Record<K, V>;
}

/** Adds all the items to map in-place and returns it. */
export function mapAdd<K, V>(map :Map<K, V>, items: Iterable<[K, V]>): Map<K, V> {
    for (const [k, v] of items)
        map.set(k, v);
    return map;
}
