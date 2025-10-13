import * as THREE from 'three';

import { NoiseFun } from '../../noise/foundations.js';
import { Palette } from '../palettes.js';
import { fillBoxData, fillSurfaceIndices, fillSurfaceNormals, fillSurfacePositions, paletteShader } from './fillers.js';
import { CachedArray, CachedBuffer, FluentGeometry } from './utils.js';

export type MeshStyle = 'Surface' | 'Box';

/** Mesh generator that reuses allocated resources when possible. */
export class CachedMesher {
    _mesher: ChunkMesher;

    private allocate(style: MeshStyle): ChunkMesher {
        switch (style) {
            case 'Surface':
                return new SurfaceMesher();
            case 'Box':
                return new BoxMesher();
        }
    }

    private ensure(style: MeshStyle): ChunkMesher {
        if(this._mesher?.style !== style) this._mesher = this.allocate(style);
        return this._mesher;
    }

    weave(shape: MeshStyle, fun: NoiseFun, ncells: number, palette: Palette): THREE.Mesh {
        return this.ensure(shape).weave(fun, ncells, palette);
    }
}

/**
 * Object generating a mesh from a noise function and a color palette.
 */
export interface ChunkMesher {
    /**
     * Generates a mesh from the given noise function and palette.
     * @param fun     - The noise function to sample height values from.
     * @param palette - The color palette used for shading the mesh.
     *
     * @returns a mesh representing the chunk.
     */
    weave(fun: NoiseFun, ncells: number, palette: Palette): THREE.Mesh;

    readonly style: MeshStyle;
    //TODO: dispose(): void;
}

/**
 * Mesher that creates a continuous surface mesh.
 */
class SurfaceMesher implements ChunkMesher {
    _geometry = new FluentGeometry();
    _position = new CachedBuffer();
    _normal = new CachedBuffer();
    _index = new CachedBuffer();
    _height = new CachedArray();
    readonly style = 'Surface';

    constructor() { }

    weave(fun: NoiseFun, ncells: number, palette: Palette): THREE.Mesh {
        // Number of vertices on one side of the grid.
        // Each cell is a quad made of four vertices, which requires one complementary row and column.
        const verticesPerSide = ncells + 1;

        fillSurfacePositions(this._position, this._height, fun, ncells);
        fillSurfaceNormals(this._normal, this._height.array as Float32Array, verticesPerSide);
        // Index computation could be avoided by storing info about last mesh produced.
        fillSurfaceIndices(this._index, verticesPerSide);

        this._geometry
            .position(this._position)
            .normal(this._normal)
            .index(this._index);

        return new THREE.Mesh(this._geometry.buffer, paletteShader(palette));
    }

    //TODO: must be careful about geometry disposal.
}

/**
 * Mesher that creates a box-based, voxel-like mesh.
 */
class BoxMesher implements ChunkMesher {
    _geometry = new FluentGeometry();
    _position = new CachedBuffer();
    _normal = new CachedBuffer();
    _height = new CachedArray();
    readonly style = 'Box';

    constructor() { }

    weave(fun: NoiseFun, ncells: number, palette: Palette): THREE.Mesh {
        fillBoxData(this._position, this._normal, this._height, fun, ncells);
        this._geometry
            .position(this._position)
            .normal(this._normal);

        return new THREE.Mesh(this._geometry.buffer, paletteShader(palette));
    }
}
