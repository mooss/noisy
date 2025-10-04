import { isObject } from "./objects.js";

/////////////////////////
// Low-level utilities //

/** Recursively maps fun to every leaf of obj, creating a new object in the process */
export function mapLeaves<T>(fun: (leaf: any) => T, obj: any): T | Object {
    if (!isObject(obj)) return fun(obj);
    const res = {};
    for (const [prop, value] of Object.entries(obj))
        res[prop] = mapLeaves(fun, value);
    return res;
}

/**
 * Recurses through an object or array, calling node on each intermediate node and leaf on each
 * terminal node.
 * Note: terminal nodes will be called twice: once as the second argument of `node` and `once` as
 * the argument of `leaf`.
 */
export function climbTree(
    node: (stem: any, branch: any) => void,
    leaf: (leaf: any) => void,
    tree: any,
): void {
    if (!isObject(tree)) return leaf(tree);
    if (Array.isArray(tree))
        return tree.forEach((value) => climbTree(node, leaf, value));
    for (const [prop, value] of Object.entries(tree)) {
        climbTree(node, leaf, value);
        node(prop, value);
    }
}

/**
 * Recurses through an object or array and constructs a new one by calling node on each intermediate
 * node and leaf on each terminal node.
 */
export function cultivateTree(
    branch: (stem: any, branch: any) => any,
    leaf: (leaf: any) => any,
    seed: any,
): any {
    if (!isObject(seed)) return leaf(seed);
    const res = {};
    if (Array.isArray(seed))
        return seed.map((value) => cultivateTree(branch, leaf, value));
    for (const [prop, value] of Object.entries(seed)) {
        res[branch(prop, value)] = cultivateTree(branch, leaf, value);
    }
    return res;
}

//////////////////////////
// High-level utilities //

export function countNodes(obj: any): Map<any, number> {
    const res = new Map<any, number>();
    const incr = (x: any) => {
        const n = res.get(x) || 0;
        res.set(x, n + 1);
    }

    climbTree(incr, incr, obj);
    return res;
}
