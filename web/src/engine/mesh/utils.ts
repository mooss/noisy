import * as THREE from 'three';

interface BufferContainer { buffer: THREE.BufferAttribute }

/** Fluent interface for buffer geometry manipulation. */
export class FluentGeometry {
    buffer = new THREE.BufferGeometry();

    set(name: string, cache: BufferContainer): this {
        cache.buffer.needsUpdate = true;
        this.buffer.setAttribute(name, cache.buffer);
        return this;
    }

    position(cache: BufferContainer): this { return this.set('position', cache) }
    normal(cache: BufferContainer): this { return this.set('normal', cache) }
    uv(cache: BufferContainer): this { return this.set('uv', cache) }

    index(cache: BufferContainer): this {
        cache.buffer.needsUpdate = true;
        this.buffer.setIndex(cache.buffer);
        return this;
    }
}

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

export class KeyCache<Key, Cached> {
    private last: Key; private cached: Cached;
    constructor(private build: () => Cached) { }
    value(key: Key): Cached {
        if (key !== this.last) {
            this.last = key;
            this.cached = this.build();
        }
        return this.cached;
    }
}

/////////////
// Storage //

type ArrayTag = 'Int8Array' | 'Uint8Array' | 'Uint16Array' | 'Uint32Array' | 'Float32Array';
function tag2bytes(tag: ArrayTag): number {
    return { 'Int8Array': 1, 'Uint16Array': 2, 'Uint32Array': 4, 'Float32Array': 4 }[tag] || 0;
}

export class ReusableArray extends Reusable<ArrayTag, THREE.TypedArray, [number]> {
    reusable(size: number): boolean { return this.value.length === size }
    allocators = {
        Int8Array: (size: number) => new Int8Array(size),
        Uint8Array: (size: number) => new Uint8Array(size),
        Uint16Array: (size: number) => new Uint16Array(size),
        Uint32Array: (size: number) => new Uint32Array(size),
        Float32Array: (size: number) => new Float32Array(size),
    }

    asFloat32(size: number): Float32Array {
        return this.ensure('Float32Array', size) as Float32Array;
    }

    asIndices(nindices: number, nvertices: number | null = null): IdxArray {
        const use32 = nvertices === null || nvertices > 65535;
        return this.ensure(use32 ? 'Uint32Array' : 'Uint16Array', nindices) as IdxArray;
    }

    asInt8(size: number): Int8Array { return this.ensure('Int8Array', size) as Int8Array }
    asUint8(size: number): Uint8Array { return this.ensure('Uint8Array', size) as Uint8Array }
    get array(): THREE.TypedArray { return this.value }

    bytes(): number {
        if (this.value === null) return 0;
        return tag2bytes(this.tag) * (this.value as any).length;
    }
}

type IdxArray = Uint16Array | Uint32Array;

export class ReusableBuffer {
    storage: ReusableArray = new ReusableArray();
    bytes(): number { return this.storage === null ? 0 : this.storage.bytes() }
    buffer: THREE.BufferAttribute;

    asFloat32(count: number, stride: number): Float32Array {
        return this.ensure('Float32Array', count, stride) as Float32Array;
    }

    asIndices(nindices: number, nvertices: number = null): IdxArray {
        const use32 = nvertices === null || nvertices > 65535;
        return this.ensure(use32 ? 'Uint32Array' : 'Uint16Array', nindices, 1) as IdxArray;
    }

    asInt8(count: number, stride: number): Int8Array {
        return this.ensure('Int8Array', count, stride) as Int8Array;
    }

    ensure(tag: ArrayTag, count: number, stride: number): THREE.TypedArray {
        const res = this.storage.ensure(tag, count * stride);
        if (res !== this.buffer?.array) {
            // The specializations of BufferAttribute are not supposed to be used here, the raw
            // BufferAttribute must remain.
            this.buffer = new THREE.BufferAttribute(res, stride);
        }
        return res;
    }
}
