import * as THREE from 'three';
import { CHUNK_UNIT } from '../../config/constants.js';
import { Coordinates, Position } from '../maths/coordinates.js';
import { vector2 } from '../maths/maths.js';
import { NoiseFun, NoiseMakerI } from '../noise/foundations.js';
import { ChunkState } from '../state/chunk.js';
import { RenderState } from '../state/renderer.js';
import { race } from '../utils/async.js';

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
        });
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
    constructor(private coords: Coordinates, private version: number) { }

    update(props: TerrainProperties, version: number): ChunkMesh | null {
        if (version === this.version) return null;
        this.version = version;
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
    private updateMesh(chunk: Chunk, version: number) {
        const replaced = chunk.update(this.props, version);
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
        inactive.forEach(chunk => this.removeMesh(chunk._mesh));
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
