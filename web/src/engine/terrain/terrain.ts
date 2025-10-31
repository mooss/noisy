import * as THREE from 'three';
import { Coordinates, Position } from '../../maths/coordinates.js';
import { vector2 } from '../../maths/maths.js';
import { NoiseMakerI } from '../../noise/foundations.js';
import { ChunkState } from '../../state/chunk.js';
import { RenderState } from '../../state/renderer.js';
import { race } from '../../utils/async.js';
import { TerrainProperties } from './properties.js';
import { Chunk } from './chunks.js';

/** Dynamically manages terrain as a collection of chunks. */
export class Terrain {
    private props: TerrainProperties;

    /**
     * Height generator normalised between .01 and 1.
     * The low bound is hard, the height cannot go below .01.
     * The high bound is soft, it can go above 1, but this is statistically rare.
     *
     * The unit is the chunk, i.e. the first chunk is within [0 <= x <= 1], [0 <= y <= 1].
     */
    get height() { return this.props.height };

    heightAt(chunkCoords: vector2) { return this.props.heightAt(chunkCoords) }

    constructor(
        chunks: ChunkState,
        noise: NoiseMakerI,
        render: RenderState
    ) {
        this.props = new TerrainProperties(chunks, noise, render);
    }

    ////////////
    // Meshes //

    /** The mesh group of every active chunk. */
    meshGroup = new THREE.Group();

    /**
     * Updates the mesh of a single chunk.
     * @param chunk - The chunk whose mesh needs to be updated.
     */
    private updateMesh(chunk: Chunk, version: number) {
        const replaced = chunk.rebuild(this.props, version);
        // Removing the old mesh before adding the new one seems a bit smoother.
        this.removeMesh(replaced);
        this.meshGroup.add(chunk.mesh);
    }

    /**
     * Removes a mesh from the mesh group and disposes of its resources.
     * @param mesh - The mesh to remove.
     */
    private removeMesh(mesh?: THREE.Mesh) {
        if (!mesh) return;
        this.meshGroup.remove(mesh);
        mesh.geometry?.dispose();
        (mesh.material as any).dispose();
    }

    ///////////////////
    // Chunk updates //

    private updateController = new AbortController();

    // Version to which the chunks must be updated.
    private version = 0;

    // Map of the chunks that are currently loaded and displayed.
    private chunks: Map<string, Chunk> = new Map();

    /**
     * Recomputes the height function and updates the mesh of all active chunks.
     */
    async update() {
        // Register that all chunks must be reloaded.
        // This is pertinent in case this update gets interrupted by a recenter.
        this.version++;

        this.props.recomputeNoise();
        this.updateController.abort();
        this.updateController = new AbortController();
        const signal = this.updateController.signal;

        for (const [_, chunk] of this.chunks) {
            // Launch updates in the background.
            race(signal, () => this.updateMesh(chunk, this.version));
        }
    }

    /** Loads all the chunks in the load radius that are not yet loaded. */
    async ensureLoaded() {
        const inactive = this.chunks;
        this.chunks = new Map<string, Chunk>();

        this.within(this.props.loadRadius, (coords: Coordinates) => {
            const id = coords.string();
            const chunk = inactive.get(id) || new Chunk(coords, 0);
            this.chunks.set(id, chunk);
            inactive.delete(id);
        });

        // Remove out-of-radius chunks.
        inactive.forEach(chunk => this.removeMesh(chunk.mesh));
        inactive.clear();

        this.updateController.abort();
        this.updateController = new AbortController();
        const signal = this.updateController.signal;

        // (Re)load missing chunks.
        // The pre-existing chunks will only be reloaded if they have an anterior version.
        for (const [_, chk] of this.chunks) {
            race(signal, () => this.updateMesh(chk, this.version));
        }
    }

    private center: Coordinates = undefined;

    /**
     * Loads the blocks within range of worldPosition and unloads the blocks outside its range.
     */
    centerOn(worldPosition: Position) {
        const chunkCoords = worldPosition.toChunk();
        if (this.center != undefined && chunkCoords.equals(this.center)) return;
        this.center = chunkCoords;
        this.ensureLoaded();
    }

    /////////////////////////
    // Iteration utilities //

    /** Resets the scale of all loaded meshes. */
    rescaleMeshes() {
        for (const [_, chunk] of this.chunks)
            chunk.rescale(this.props);
    }

    private within(...args: Parameters<Coordinates['spiralSquare']>) {
        let res = Coordinates.prototype.spiralSquare;
        if (this.props.radiusType === 'circle')
            res = Coordinates.prototype.spiralCircle;
        return res.bind(this.center)(...args);
    }
}
