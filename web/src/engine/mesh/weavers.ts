import * as THREE from 'three';

import { NoiseFun } from '../../noise/foundations.js';
import { Recycler } from '../../utils/reuse.js';
import { fillBoxData } from './box.js';
import { fillSurfaceIndices, fillSurfaceNormals, fillSurfacePositions } from './surface.js';
import { FluentGeometry, ReusableArray, ReusableBuffer } from './utils.js';

export type GeometryStyle = 'Surface' | 'Box';

/** Geometry generator that reuses allocated resources when possible. */
export class ReusableWeaver {
    cache = new Recycler<GeometryStyle, ChunkWeaver, []>({
        Surface: () => new SurfaceWeaver(),
        Box: () => new BoxWeaver(),
    });

    /**
     * Builds a geometry from the given noise function.
     * @param shape      - The type of geometry to build.
     * @param fun        - The noise function to sample height values from.
     * @param resolution - The resolution of one side of the geometry.
     *
     * @returns a geometry representing the chunk.
     */
    weave(shape: GeometryStyle, fun: NoiseFun, resolution: number): THREE.BufferGeometry {
        return this.cache.ensure(shape).weave(fun, resolution);
    }
}

/**
 * Object building a geometry from a noise function.
 */
export interface ChunkWeaver {
    weave(fun: NoiseFun, resolution: number): THREE.BufferGeometry;
    //TODO: dispose(): void;
}

/**
 * Continuous surface weaver.
 */
class SurfaceWeaver implements ChunkWeaver {
    _geometry = new FluentGeometry();
    _position = new ReusableBuffer();
    _normal = new ReusableBuffer();
    _index = new ReusableBuffer();
    _height = new ReusableArray();

    weave(fun: NoiseFun, resolution: number): THREE.BufferGeometry {
        fillSurfacePositions(this._position, this._height, fun, resolution);
        fillSurfaceNormals(this._normal, this._height.array as Float32Array, resolution);

        // Indices will be the same for a given resolution and do not need to be always be
        // recomputed.
        const indexCount = resolution * resolution * 6;
        if (indexCount != this._index?.buffer?.count)
            fillSurfaceIndices(this._index, resolution);

        this._geometry
            .position(this._position)
            .normal(this._normal)
            .index(this._index);

        return this._geometry.buffer;
    }
}

/**
 * Box-based, voxel-like veaver.
 */
class BoxWeaver implements ChunkWeaver {
    _geometry = new FluentGeometry();
    _position = new ReusableBuffer();
    _normal = new ReusableBuffer();
    _height = new ReusableArray();

    weave(fun: NoiseFun, resolution: number): THREE.BufferGeometry {
        fillBoxData(this._position, this._normal, this._height, fun, resolution);
        this._geometry
            .position(this._position)
            .normal(this._normal);

        return this._geometry.buffer;
    }
}
