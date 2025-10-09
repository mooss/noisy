import * as THREE from 'three';

/////////////
// Storage //

type ArrayTag = 'Int8Array' | 'Uint16Array' | 'Uint32Array' | 'Float32Array';

export class CachedArray {
    tag: ArrayTag;
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
}
