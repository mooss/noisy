// This file provides utilities related to resource reuse and caching.

///////////////////
// Reuse/recycle //

export abstract class Reusable<Tag extends PropertyKey, Value, Args extends any[]> {
    tag: Tag;
    value: Value;
    reusable(..._: Args): boolean { return true };
    abstract allocators: { [K in Tag]: (...args: Args) => Value };

    ensure(tag: Tag, ...args: Args): Value {
        if (this.tag !== tag || !this.reusable(...args)) {
            const alloc = this.allocators[tag];
            this.value = alloc ? alloc(...args) : undefined;
            this.tag = tag;
        }
        return this.value;
    }
}

export class Recycler<Tag extends PropertyKey, Value, Args extends any[]> extends Reusable<Tag, Value, Args> {
    constructor(
        public allocators: { [K in Tag]: (...args: Args) => Value },
        public reusable: (..._: Args) => boolean = () => true,
    ) { super() }
}

///////////
// Cache //

export class KeyCache<Key, Value> {
    private last: Key; private cached: Value;
    constructor(public refresh: () => Value) { }
    value(key: Key): Value {
        if (key !== this.last) {
            this.last = key;
            this.cached = this.refresh();
        }
        return this.cached;
    }
}

export function once<Value>(fun: () => Value): () => Value {
    let cache: Value;
    let called = false;
    return () => {
        if (!called) cache = fun();
        return cache;
    }
}
