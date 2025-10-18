import * as THREE from 'three';

import { NoiseFun } from '../../noise/foundations.js';
import { fillBoxData } from './box.js';
import { fillSurfaceIndices, fillSurfaceNormals, fillSurfacePositions } from './surface.js';
import { FluentGeometry, Reusable, ReusableArray, ReusableBuffer } from './utils.js';

export type GeometryStyle = 'Surface' | 'Box';

/** Geometry generator that reuses allocated resources when possible. */
export class ReusableWeaver extends Reusable<GeometryStyle, ChunkWeaver, []> {
    allocators = {
        Surface: () => new SurfaceWeaver(),
        Box: () => new BoxWeaver(),
    };

    /**
     * Builds a geometry from the given noise function.
     * @param shape       - The type of geometry to build.
     * @param fun         - The noise function to sample height values from.
     * @param resolution  - The resolution of one side of the geometry.
     *
     * @returns a geometry representing the chunk.
     */
    weave(shape: GeometryStyle, fun: NoiseFun, resolution: number): THREE.BufferGeometry {
        return this.ensure(shape).weave(fun, resolution);
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
 * Weaver building a continuous surface geometry.
 */
class SurfaceWeaver implements ChunkWeaver {
    _geometry = new FluentGeometry();
    _position = new ReusableBuffer();
    _normal = new ReusableBuffer();
    _index = new ReusableBuffer();
    _height = new ReusableArray();

    weave(fun: NoiseFun, resolution: number): THREE.BufferGeometry {
        // Number of vertices on one side of the grid.
        // Each cell is a quad made of four vertices, which requires one complementary row and column.
        const verticesPerSide = resolution + 1;

        fillSurfacePositions(this._position, this._height, fun, resolution);
        fillSurfaceNormals(this._normal, this._height.array as Float32Array, verticesPerSide);
        // Index computation could be avoided by storing info about the last geometry produced.
        fillSurfaceIndices(this._index, verticesPerSide);

        this._geometry
            .position(this._position)
            .normal(this._normal)
            .index(this._index);

        return this._geometry.buffer;
    }
}

/**
 * Weaver building a box-based, voxel-like geometry.
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
