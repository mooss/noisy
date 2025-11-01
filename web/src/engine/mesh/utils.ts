import * as THREE from 'three';
import { Reusable } from '../../utils/reuse.js';

/** Fluent interface for buffer geometry manipulation. */
export class FluentGeometry {
    buffer = new THREE.BufferGeometry();

    set(name: string, cache: ReusableBuffer): this {
        this.buffer.setAttribute(name, cache.buffer);
        cache.buffer.needsUpdate = true;
        return this;
    }

    position(cache: ReusableBuffer): this { return this.set('position', cache) }
    normal(cache: ReusableBuffer): this { return this.set('normal', cache) }

    index(cache: ReusableBuffer): this {
        this.buffer.setIndex(cache.buffer);
        cache.buffer.needsUpdate = true;
        return this;
    }
}

/////////////
// Storage //

type ArrayTag = 'Int8Array' | 'Uint16Array' | 'Uint32Array' | 'Float32Array';
function tag2bytes(tag: ArrayTag): number {
    return { 'Int8Array': 1, 'Uint16Array': 2, 'Uint32Array': 4, 'Float32Array': 4 }[tag] || 0;
}

export class ReusableArray extends Reusable<ArrayTag, THREE.TypedArray, [number]> {
    reusable(size: number): boolean { return this.value.length === size }
    allocators = {
        Int8Array: (size: number) => new Int8Array(size),
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
