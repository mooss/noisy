import * as THREE from 'three';

import { NoiseFun } from '../../noise/foundations.js';
import { Palette } from '../palettes.js';
import { fillBoxData, fillSurfaceIndices, fillSurfaceNormals, fillSurfacePositions, paletteShader } from './fillers.js';
import { CachedArray, CachedBuffer, FluentGeometry } from './utils.js';

export type MeshStyle = 'Surface' | 'Box';

/** Mesh generator that reuses allocated resources when possible. */
export class CachedMesher {
    private style: MeshStyle;
    private mesher: ChunkMesher;
    private ncells: number;

    private allocate(tag: MeshStyle, ncells: number): ChunkMesher {
        this.ncells = ncells;
        switch (tag) {
            case 'Surface':
                return new SurfaceMesher(ncells);
            case 'Box':
                return new BoxMesher(ncells);
        }
    }

    private ensure(tag: MeshStyle, ncells: number): ChunkMesher {
        if (this.style === tag && this.ncells === ncells) return this.mesher;
        return this.allocate(tag, ncells);
    }

    weave(shape: MeshStyle, fun: NoiseFun, ncells: number, palette: Palette): THREE.Mesh {
        return this.ensure(shape, ncells).weave(fun, palette);
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
    weave(fun: NoiseFun, palette: Palette): THREE.Mesh;
    //TODO: dispose(): void;
}

/**
 * Mesher that creates a continuous surface mesh.
 */
export class SurfaceMesher implements ChunkMesher {
    private geometry = new FluentGeometry();
    private position = new CachedBuffer();
    private normal = new CachedBuffer();
    private index = new CachedBuffer();
    private height = new CachedArray();

    constructor(public readonly ncells: number) { }

    weave(fun: NoiseFun, palette: Palette): THREE.Mesh {
        // Number of vertices on one side of the grid.
        // Each cell is a quad made of four vertices, which requires one complementary row and column.
        const verticesPerSide = this.ncells + 1;

        fillSurfacePositions(this.position, this.height, fun, this.ncells);
        fillSurfaceNormals(this.normal, this.height.array as Float32Array, verticesPerSide);
        // Index computation could be avoided by storing info about last mesh produced.
        fillSurfaceIndices(this.index, verticesPerSide);

        this.geometry
            .position(this.position)
            .normal(this.normal)
            .index(this.index);

        return new THREE.Mesh(this.geometry.buffer, paletteShader(palette));
    }

    //TODO: must be careful about geometry disposal.
}

/**
 * Mesher that creates a box-based, voxel-like mesh.
 */
export class BoxMesher implements ChunkMesher {
    private geometry = new FluentGeometry();
    private position = new CachedBuffer();
    private normal = new CachedBuffer();
    private height = new CachedArray();

    constructor(public readonly ncells: number) { }

    weave(fun: NoiseFun, palette: Palette): THREE.Mesh {
        fillBoxData(this.position, this.normal, this.height, fun, this.ncells);
        this.geometry
            .position(this.position)
            .normal(this.normal);

        return new THREE.Mesh(this.geometry.buffer, paletteShader(palette));
    }
}
