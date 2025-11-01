import * as THREE from 'three';
import { Coordinates, Position } from '../../maths/coordinates.js';
import { vector2 } from '../../maths/maths.js';
import { NoiseMakerI } from '../../noise/foundations.js';
import { ChunkState } from '../../state/chunk.js';
import { RenderState } from '../../state/renderer.js';
import { race } from '../../utils/async.js';
import { Chunk, ChunkPool } from './chunks.js';
import { TerrainProperties } from './properties.js';

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
    private lockUpdate(): AbortSignal {
        this.updateController.abort();
        this.updateController = new AbortController();
        return this.updateController.signal;
    }

    // Version to which the chunks must be updated.
    private version = 0;

    // Map of the chunks that are currently loaded and displayed.
    private chunks: Map<string, Chunk> = new Map();

    // Pool of reusable chunks.
    private chunkPool = new ChunkPool();

    /**
     * Recomputes the height function and updates the mesh of all active chunks.
     */
    async update() {
        // Register that all chunks must be reloaded.
        // This is important in case this update gets interrupted by a the avatar moving to a new
        // chunk.
        this.version++;

        this.props.recomputeNoise();
        this.updateAllChunks(this.lockUpdate());
    }

    /** Loads all the chunks in the load radius that are not yet loaded. */
    async ensureLoaded() {
        const inactive = this.chunks;
        const missing = new Set<Coordinates>();
        this.chunks = new Map<string, Chunk>();

        this.within(this.props.loadRadius, (coords: Coordinates) => {
            const id = coords.string();
            const chunk = inactive.get(id);
            if (chunk === undefined) { missing.add(coords); return; }
            this.chunks.set(id, chunk);
            inactive.delete(id);
        });

        // Release out-of-radius chunks.
        inactive.forEach(chunk => this.removeMesh(chunk.mesh));
        inactive.clear();

        // Acquire missing chunks.
        for (const coords of missing)
            this.chunks.set(coords.string(), this.chunkPool.acquire(coords));

        // (Re)load missing or outdated chunks.
        this.updateAllChunks(this.lockUpdate());
    }

    // Update all the outdated chunks (those having an anterior version).
    private async updateAllChunks(signal: AbortSignal) {
        // const signal = this.lockUpdate();
        for (const [_, chunk] of this.chunks) {
            race(signal, () => this.updateMesh(chunk, this.version));
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
