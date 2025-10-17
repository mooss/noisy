import * as THREE from 'three';

/** Fluent interface for buffer geometry manipulation. */
export class FluentGeometry {
    buffer = new THREE.BufferGeometry();

    set(name: string, cache: CachedBuffer): this {
        cache.buffer.needsUpdate = true;
        this.buffer.setAttribute(name, cache.buffer);
        return this;
    }

    position(cache: CachedBuffer): this { return this.set('position', cache) }
    normal(cache: CachedBuffer): this { return this.set('normal', cache) }

    index(cache: CachedBuffer): this {
        cache.buffer.needsUpdate = true;
        this.buffer.setIndex(cache.buffer);
        return this;
    }
}

/////////////
// Storage //

type ArrayTag = 'Int8Array' | 'Uint16Array' | 'Uint32Array' | 'Float32Array';
function tag2bytes(tag: ArrayTag): number {
    return {'Int8Array': 1, 'Uint16Array': 2, 'Uint32Array': 4, 'Float32Array': 4}[tag] || 0;
}

export class CachedArray {
    private tag: ArrayTag;
    array: THREE.TypedArray;

    asFloat32(size: number): Float32Array {
        return this.ensure('Float32Array', size) as Float32Array;
    }

    asIndices(nindices: number, nvertices: number = null): IdxArray {
        const use32 = nvertices === null || nvertices > 65535;
        return this.ensure(use32 ? 'Uint32Array' : 'Uint16Array', nindices) as IdxArray;
    }

    asInt8(size: number): Int8Array {
        return this.ensure('Int8Array', size) as Int8Array;
    }

    reusable(tag: ArrayTag, size: number): boolean {
        return this.tag === tag && this.array?.length === size;
    }

    ensure(tag: ArrayTag, size: number): THREE.TypedArray {
        if (!this.reusable(tag, size)) {
            this.array = this.allocate(tag, size);
            this.tag = tag;
        }

        return this.array;
    }

    allocate(tag: ArrayTag, size: number): THREE.TypedArray {
        switch (tag) {
            case 'Int8Array':
                return new Int8Array(size);
            case 'Uint16Array':
                return new Uint16Array(size);
            case 'Uint32Array':
                return new Uint32Array(size);
            default:
                return new Float32Array(size);
        }
    }

    bytes(): number {
        if (this.array === null) return 0;
        return tag2bytes(this.tag) * this.array.length;
    }
}

type IdxArray = Uint16Array | Uint32Array;

export class CachedBuffer {
    storage: CachedArray = new CachedArray();
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

    bytes(): number {
        if(this.storage === null) return 0;
        return this.storage.bytes();
    }
}
