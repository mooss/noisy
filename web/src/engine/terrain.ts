import * as THREE from 'three';
import { CHUNK_UNIT } from '../../config/constants.js';
import { Coordinates, Position } from '../maths/coordinates.js';
import { vector2 } from '../maths/maths.js';
import { NoiseFun, NoiseMakerI } from '../noise/foundations.js';
import { ChunkState } from '../state/chunk.js';
import { RenderState } from '../state/renderer.js';
import { race } from '../utils/async.js';
import { ReusablePainter } from './mesh/painters.js';
import { ReusableWeaver } from './mesh/weavers.js';

class TerrainProperties {
    private _height: NoiseFun;
    private painter: ReusablePainter;

    constructor(
        private chunks: ChunkState,
        private noise: NoiseMakerI,
        public render: RenderState,
    ) {
        this.recomputeNoise();
        this.painter = new ReusablePainter(this.render);
    }

    get height(): NoiseFun { return this._height }
    get blockSize() { return this.chunks.blockSize }
    get nblocks() { return this.chunks.nblocks }
    get loadRadius() { return this.chunks.loadRadius }
    get radiusType() { return this.chunks.radiusType }
    get geometryStyle() { return this.render.geometryStyle }

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

    mesh(coords: Coordinates, weaver: ReusableWeaver): THREE.Mesh {
        const fun = this.heightAt(coords);
        const geometry = weaver.weave(this.geometryStyle, fun, this.nblocks);
        return new THREE.Mesh(geometry, this.painter.paint(fun, this.nblocks));
    }
}

class Chunk {
    mesh?: THREE.Mesh;
    private weaver = new ReusableWeaver();

    constructor(
        private coords: Coordinates,
        private version: number,
        private props: TerrainProperties,
    ) { }

    rebuild(version: number): THREE.Mesh | null {
        if (version === this.version) return null;
        this.version = version;
        const old = this.mesh;

        this.mesh = this.props.mesh(this.coords, this.weaver);
        this.mesh.translateX(this.coords.x * CHUNK_UNIT);
        this.mesh.translateY(this.coords.y * CHUNK_UNIT);
        this.mesh.matrixAutoUpdate = false;
        this.rescale();

        return old;
    }

    rescale() {
        this.mesh.scale.set(this.props.blockSize, this.props.blockSize, this.props.verticalUnit);
        this.mesh.updateMatrix();
    }
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
        const replaced = chunk.rebuild(version);
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
            const chunk = inactive.get(id) || new Chunk(coords, 0, this.props);
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
            chunk.rescale();
    }

    private within(...args: Parameters<Coordinates['spiralSquare']>) {
        let res = Coordinates.prototype.spiralSquare;
        if (this.props.radiusType === 'circle')
            res = Coordinates.prototype.spiralCircle;
        return res.bind(this.center)(...args);
    }
}
