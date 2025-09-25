import * as THREE from 'three';
import { CHUNK_UNIT } from "./constants.js";
import { Coordinates, Position } from "./coordinates.js";
import { NoiseFun, NoiseMakerI } from './noise/foundations.js';
import type { ChunkState } from './state/chunk.js';
import type { RenderState } from './state/render.js';
import { Operation, Syncope } from './utils/async.js';
import { vector2 } from './utils/maths.js';

class TerrainProperties {
    private _height: NoiseFun;

    constructor(
        private chunks: ChunkState,
        private noise: NoiseMakerI,
        private render: RenderState,
    ) {
        this.recomputeNoise();
    }

    get height(): NoiseFun { return this._height }
    get blockSize() { return this.chunks.blockSize }
    get nblocks() { return this.chunks.nblocks }
    get loadRadius() { return this.chunks.loadRadius }
    get radiusType() { return this.chunks.radiusType }

    get verticalUnit() {
        // Prevents the verticality to be exactly zero because it messes up with shading, basically
        // negating directional light.
        return Math.max(this.render.verticalUnit, .0000001);
    }

    heightAt(chunkCoords: vector2): (x: number, y: number) => number {
        return (x, y) => this.height(x + chunkCoords.x, y + chunkCoords.y);
    }

    recomputeNoise() {
        this.noise.recompute();
        this._height = this.noise.normalised(.01, 1);
    }

    mesh(coords: Coordinates): THREE.Mesh {
        return this.render.mesh({
            at: this.heightAt(coords),
            nblocks: this.nblocks,
        })
    }
}

class ChunkMesh {
    three: THREE.Mesh;
    constructor(coords: Coordinates, props: TerrainProperties) {
        this.three = props.mesh(coords);
        this.three.translateX(coords.x * CHUNK_UNIT);
        this.three.translateY(coords.y * CHUNK_UNIT);
        this.three.matrixAutoUpdate = false;
        this.rescale(props);
    }

    rescale(props: TerrainProperties) {
        this.three.scale.set(props.blockSize, props.blockSize, props.verticalUnit);
        this.three.updateMatrix();
    }

    /**
     * Frees the GPU resources allocated to the mesh.
     */
    dispose() {
        this.three.geometry.dispose();
        (this.three.material as any).dispose();
    }
}

class Chunk {
    _mesh?: ChunkMesh = null;
    constructor(private coords: Coordinates, props?: TerrainProperties) {
        if (props === undefined) return;
        this._mesh = new ChunkMesh(coords, props);
    }

    /**
     * Replaces the mesh with a new one computed from the given properties.
     * @param props - the properties used to compute the new mesh.
     * @returns the mesh that was replaced (must be disposed of if not needed anymore).
     */
    replace(props: TerrainProperties): ChunkMesh | null {
        const replaced = this._mesh;
        this._mesh = new ChunkMesh(this.coords, props);
        return replaced;
    }

    rescale(props: TerrainProperties) { this._mesh.rescale(props) }
}

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
    private updateMesh(chunk: Chunk) {
        const replaced = chunk.replace(this.props);
        // Removing the old mesh before adding the new one seems a bit smoother.
        this.removeMesh(replaced);
        this.meshGroup.add(chunk._mesh.three);
    }

    /**
     * Removes a mesh from the mesh group and disposes of its resources.
     * @param mesh - The mesh to remove.
     */
    private removeMesh(mesh?: ChunkMesh) {
        if (mesh === null) return;
        this.meshGroup.remove(mesh.three);
        mesh.dispose();
    }

    ////////////
    // Chunks //

    /** Map of the chunks that are currently loaded and displayed. */
    private chunks: Map<string, Chunk> = new Map();

    /** Loads all the chunks in the load radius that are not yet loaded. */
    async ensureLoaded() {
        const inactive = this.chunks;
        this.chunks = new Map<string, Chunk>();
        const missing = new Set<Chunk>();
        const untouched = new Set<Chunk>();

        this.within(this.props.loadRadius, (coords: Coordinates) => {
            const id = coords.string();
            const chunk = inactive.get(id);

            // New chunks that need to be loaded.
            if (chunk === undefined) {
                // Draft chunks (chunks without mesh) are immediately added to the active chunks so
                // that if the current loading operation is interrupted by another chunk update,
                // they will still be considered active in the new update.
                // Otherwise the chunks can stay missing for a while, creating gaps in the terrain.
                const draft = new Chunk(coords);
                missing.add(draft);
                this.chunks.set(id, draft);
                return;
            }

            // Chunks that are already loaded but might need to be reloaded.
            this.chunks.set(id, chunk);
            untouched.add(chunk);
            inactive.delete(id);
        });

        const updateOp = this.update.lock();

        // Remove out-of-radius chunks.
        inactive.forEach(chunk => this.removeMesh(chunk._mesh));
        inactive.clear();

        // Load missing chunks.
        for (const draft of missing) {
            if (updateOp.abort()) return updateOp.done();
            this.updateMesh(draft);
            await updateOp.yield();
        }

        // When the terrain was in the process of being updated, reloading lazily can result in
        // inconsistent chunks.
        // In this case, even the in-radius chunks that already existed must be (re)loaded.
        if (updateOp.interrupted) {
            for (const chunk of untouched) {
                if (updateOp.abort()) return updateOp.done();
                this.updateMesh(chunk);
                await updateOp.yield();
            }
        }

        updateOp.done();
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
        this.rangeActive(chunk => chunk.rescale(this.props));
    }

    private within(...args: Parameters<Coordinates['spiralSquare']>) {
        let res = Coordinates.prototype.spiralSquare;
        if (this.props.radiusType === 'circle')
            res = Coordinates.prototype.spiralCircle;
        return res.bind(this.center)(...args);
    }

    /**
     * Calls a function on all active chunks.
     * @param fun - The function to apply to each chunk.
     */
    private rangeActive(fun: (chunk: Chunk) => void) {
        for (const [_, chunk] of this.chunks) {
            fun(chunk);
        };
    }

    /////////////////////
    // Async functions //

    /**
     * Calls a function on all active chunks, cancellable at the loop level.
     * @param fun    - The function to apply to each chunk.
     * @param signal - Signal to cancel the computation mid-loop.
     */
    private async rangeActiveAsync(
        fun: (chunk: Chunk) => void,
        operation: Operation,
    ) {
        for (const [_, chunk] of this.chunks) {
            if (operation.abort()) return operation.done();
            fun(chunk);
            // Yield control after processing a chunk.
            await operation.yield();
        }
        operation.done();
    }

    private update = new Syncope();

    /**
     * Recomputes the height function and updates the mesh of all active chunks, cancelling
     * computation triggered by previous calls to this method.
     */
    async recomputeAsync() {
        const op = this.update.lock();
        this.props.recomputeNoise();
        await this.rangeActiveAsync(chunk => this.updateMesh(chunk), op);
    }
}
