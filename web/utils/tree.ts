import { isObject } from "./objects.js";

///////////////
// Recursers //

/** Recursively maps fun to every leaf of obj, creating a new object in the process */
export function recurseObject<T>(fun: (x: any) => T, obj: any): T | Object {
    if (!isObject(obj)) return fun(obj);
    const res = {};
    for (const [prop, value] of Object.entries(obj))
        res[prop] = recurseObject(fun, value);
    return res;
}

//////////////
// Climbers //

/**
 * Recurses through an object, calling node on each intermediate node and leaf on each terminal
 * node.
 */
export function climbObject(
    node: (stem: any, branch: any) => void,
    leaf: (leaf: any) => void,
    tree: any,
): void {
    if (!isObject(tree)) return leaf(tree);
    for (const [prop, value] of Object.entries(tree)) {
        climbObject(node, leaf, value);
        node(prop, value);
    }
}
/**
 * Recurses through an object or array, calling node on each intermediate node and leaf on each
 * terminal node.
 */
export function climbObjectOrArray(
    node: (stem: any, branch: any) => void,
    leaf: (leaf: any) => void,
    tree: any,
): void {
    if (!isObject(tree)) return leaf(tree);
    if (Array.isArray(tree))
        return tree.forEach((value) => climbObjectOrArray(node, leaf, value));
    for (const [prop, value] of Object.entries(tree)) {
        climbObjectOrArray(node, leaf, value);
        node(prop, value);
    }
}

/////////////////
// Cultivaters //

/**
 * Recurses through an object and constructs a new one by calling node on each intermediate node and
 * leaf on each terminal node.
 */
export function cultivateObject(
    branch: (stem: any, branch: any) => any,
    leaf: (leaf: any) => any,
    seed: any,
): any {
    if (!isObject(seed)) return leaf(seed);
    const res = {};
    for (const [prop, value] of Object.entries(seed)) {
        res[branch(prop, value)] = cultivateObject(branch, leaf, value);
    }
    return res;
}

/**
 * Recurses through an object or array and constructs a new one by calling node on each intermediate
 * node and leaf on each terminal node.
 */
export function cultivateObjectOrArray(
    branch: (stem: any, branch: any) => any,
    leaf: (leaf: any) => any,
    seed: any,
): any {
    if (!isObject(seed)) return leaf(seed);
    const res = {};
    if (Array.isArray(seed))
        return seed.map((value) => cultivateObjectOrArray(branch, leaf, value));
    for (const [prop, value] of Object.entries(seed)) {
        res[branch(prop, value)] = cultivateObjectOrArray(branch, leaf, value);
    }
    return res;
}

////////////
// Others //

export function countNodes(obj: any): Map<any, number> {
    const res = new Map<any, number>();
    const incr = (x: any) => {
        const n = res.get(x) || 0;
        res.set(x, n + 1);
    }

    climbObjectOrArray(incr, incr, obj);
    return res;
}
