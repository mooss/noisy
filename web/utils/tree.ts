import { isObject } from "./objects.js";

/** Recursively maps fun to every leaf of obj, creating a new object in the process */
export function recurseLeaves<T>(fun: (x: any) => T, obj: any): T | Object {
    if (!isObject(obj)) return fun(obj);
    const res = {};
    for (const [prop, value] of Object.entries(obj))
        res[prop] = recurseLeaves(fun, value);
    return res;
}

/**
 * Recurses through an object, calling node on each intermediate node and leaf on each terminal node.
 */
export function climb(
    node: (stem: any, branch: any) => void,
    leaf: (leaf: any) => void,
    tree: any,
): void {
    if (!isObject(tree)) return leaf(tree);
    for (const [prop, value] of Object.entries(tree)) {
        climb(node, leaf, value);
        node(prop, value);
    }
}

/**
 * Recurses through an object and constructs a new one bu calling node on each intermediate node and
 * leaf on each terminal node.
 */
export function grow(
    branch: (stem: any, branch: any) => any,
    leaf: (leaf: any) => any,
    seed: any,
): any {
    if (!isObject(seed)) return leaf(seed);

    const res = {};
    for (const [prop, value] of Object.entries(seed)) {
        res[branch(prop, value)] = grow(branch, leaf, value);
    }
    return res;
}

export function countNodes(obj: any): Map<any, number> {
    const res = new Map<any, number>();
    const incr = (x: any) => {
        const n = res.get(x) || 0;
        res.set(x, n + 1);
    }

    climb(incr, incr, obj);
    return res;
}
