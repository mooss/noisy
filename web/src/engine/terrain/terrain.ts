import * as THREE from 'three';
import { Coordinates, Position } from '../../maths/coordinates.js';
import { vector2 } from '../../maths/maths.js';
import { NoiseMakerI } from '../../noise/foundations.js';
import { ChunkState } from '../../state/chunk.js';
import { RenderState } from '../../state/renderer.js';
import { race } from '../../utils/async.js';
import { rgbArrayToPngBlob } from '../../utils/img.js';
import { Chunk, ChunkPool } from './chunks.js';
import { TerrainProperties } from './properties.js';

/** Dynamically manages terrain as a collection of chunks. */
export class Terrain {
    private props: TerrainProperties;

    // Pool of reusable chunks.
    private chunkPool: ChunkPool;

    /**
     * Height generator normalised between .01 and 1.
     * The low bound is hard, the height cannot go below .01.
     * The high bound is soft, it can go above 1, but this is statistically rare.
     *
     * The unit is the chunk, i.e. the first chunk is within [0 <= x <= 1], [0 <= y <= 1].
     */
    get height() { return this.props.heightFun };

    heightAt(chunkCoords: vector2) { return this.props.heightAt(chunkCoords) }

    constructor(
        chunks: ChunkState,
        noise: NoiseMakerI,
        render: RenderState
    ) {
        this.props = new TerrainProperties(chunks, noise, render);
        this.chunkPool = new ChunkPool(this.props);
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
        chunk.rebuild(version);
        this.meshGroup.add(chunk.mesh);
    }

    /**
     * Removes a mesh from the mesh group.
     * @param mesh - The mesh to remove.
     */
    private removeMesh(mesh: THREE.Mesh) {
        this.meshGroup.remove(mesh);
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

    /**
     * Recomputes the height function and updates the mesh of all active chunks.
     */
    async update() {
        // Register that all chunks must be reloaded.
        // This is important in case this update gets interrupted by a the avatar moving to a new
        // chunk.
        this.version++;

        this.props.recomputeNoise();
        this.updateAllChunks();
    }

    /** Loads all the chunks in the load radius that are not yet loaded. */
    async ensureLoaded() {
        const inactive = this.chunks; // Chunks that must be freed.
        const missing = new Set<Coordinates>(); // Chunks that must be created.
        this.chunks = new Map<string, Chunk>();

        this.within(this.props.loadRadius, (coords: Coordinates) => {
            const id = coords.string();
            const chunk = inactive.get(id);

            if (chunk === undefined) {
                missing.add(coords);
                return;
            }

            this.chunks.set(id, chunk);
            inactive.delete(id);
        });

        // Release out-of-radius chunks back into the pool so that they can be used for the new
        // chunks.
        inactive.forEach(chunk => {
            this.removeMesh(chunk.mesh);
            this.chunkPool.release(chunk);
        });
        inactive.clear();

        // Acquire missing chunks.
        // The are stored empty, the incoming async update operation (or another that will interrupt
        // it) will take care of properly creating them.
        for (const coords of missing)
            this.chunks.set(coords.string(), this.chunkPool.acquire(coords));

        // (Re)load missing or outdated chunks.
        this.updateAllChunks();
    }

    // Update all the outdated chunks (those having an anterior version).
    private async updateAllChunks() {
        const signal = this.lockUpdate();
        for (const [_, chunk] of this.chunks) {
            race(signal, () => this.updateMesh(chunk, this.version));
        }

        // Free up leftover chunks once everything has been updated.
        // This will only do something when reducing the load radius, and there is no point keeping
        // chunks around for this niche usecase.
        if (!signal.aborted)
            this.chunkPool.flush();
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
            chunk.rescale();
    }

    private within(...args: Parameters<Coordinates['spiralSquare']>) {
        let res = Coordinates.prototype.spiralSquare;
        if (this.props.radiusType === 'circle')
            res = Coordinates.prototype.spiralCircle;
        return res.bind(this.center)(...args);
    }

    ////////////
    // Export //

    async asTexture(): Promise<Blob> {
        return rgbArrayToPngBlob(
            this.props.renderToRGB(this.center),
            this.props.width,
            this.props.height,
        );
    }

    /////////////
    // Shaders //

    get uniforms(): Object {
        const shader = this.props.material.userData.shader;
        if (!shader || !shader.uniforms) {
            console.warn('Attempt to access terrain uniform but no shader can be found.');
            return {};
        }
        return shader.uniforms;
    }

    get texture(): THREE.Texture | null {
        const map = this.props.material.map;
        if (!map) {
            console.warn('Attempt to access terrain texture but no texture can be found.');
        }
        return map;
    }
}
