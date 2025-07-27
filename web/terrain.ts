import * as THREE from 'three';
import type { ChunkConfig } from './config/chunk.js';
import type { RenderConfig } from './config/render.js';
import { CHUNK_UNIT } from "./constants.js";
import { Coordinates, Position } from "./coordinates.js";
import { NoiseMakerI } from './noise/foundations.js';

class Chunk {
    coords: Coordinates;
    mesh: THREE.Mesh;
    height: (x: number, y: number) => number;
    constructor(coords: Coordinates, mesh: THREE.Mesh, height: (x: number, y: number) => number) {
        this.coords = coords;
        this.mesh = mesh;
        this.height = height;
    }
}

/** Dynamically manages terrain as a collection of chunks. */
export class Terrain {
    /** References to the relevant configurations */
    private conf: {
        chunks: ChunkConfig;
        noise: NoiseMakerI,
        render: RenderConfig;
    };

    /**
     * Height generator normalised between .01 and 1.
     * The low bound is hard, the height cannot go below .01.
     * The high bound is soft, it can go above 1, but this is statistically rare.
     *
     * The unit is the chunk, i.e. the first chunk is within [0 <= x <= 1], [0 <= y <= 1].
     */
    height: (x: number, y: number) => number;

    constructor(
        chunks: ChunkConfig,
        noise: NoiseMakerI,
        render: RenderConfig
    ) {
        this.conf = { chunks, noise, render };
    }

    private get blockSize() { return this.conf.chunks.blockSize }
    private get verticalUnit() { return this.conf.render.verticalUnit }
    private get nblocks() { return this.conf.chunks.nblocks }
    private get loadRadius() { return this.conf.chunks.loadRadius }

    /**
     * Returns the height function of the given chunk.
     * The chunk is the height field between 0 and 1 (for both coordinates).
     */
    chunkHeightFun(chunkCoords: Coordinates): (x: number, y: number) => number {
        return (x, y) => this.height(x + chunkCoords.x, y + chunkCoords.y);
    }

    /** Regenerates the heights and updates the mesh of all active chunks. */
    regen(): void {
        this.height = this.conf.noise.normalised(.01, 1);
        this.rangeActive(this.updateMesh.bind(this));
    }

    ////////////
    // Meshes //

    /** The mesh group of every active chunk. */
    mesh = new THREE.Group();

    /** Creates a new mesh at the given coordinates, scales it and positions it in the world. */
    private newMesh(coords: Coordinates): THREE.Mesh {
        const res = this.conf.render.mesh({
            at: this.chunkHeightFun(coords),
            nblocks: this.nblocks,
        });
        res.scale.set(this.blockSize, this.blockSize, this.verticalUnit);
        res.translateX(coords.x * CHUNK_UNIT);
        res.translateY(coords.y * CHUNK_UNIT);
        res.matrixAutoUpdate = false;
        res.updateMatrix();
        return res;
    }

    /**
     * Updates the mesh of a single chunk.
     * @param chunk - The chunk whose mesh needs to be updated.
     */
    private updateMesh(chunk: Chunk): void {
        const oldMesh = chunk.mesh;
        chunk.mesh = this.newMesh(chunk.coords);
        this.mesh.add(chunk.mesh);
        this.removeMesh(oldMesh);
    }

    /**
     * Removes a mesh from the mesh group and disposes of its resources.
     * @param mesh - The mesh to remove.
     */
    private removeMesh(mesh: THREE.Mesh): void {
        this.mesh.remove(mesh);
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
    }

    ////////////
    // Chunks //

    /** Map of the chunks that are currently loaded and displayed. */
    private chunks: Map<string, Chunk> = new Map();

    private loadChunk(coords: Coordinates): Chunk {
        const chunk = new Chunk(coords, this.newMesh(coords), this.chunkHeightFun(coords));
        this.mesh.add(chunk.mesh);
        this.chunks.set(coords.string(), chunk);
        return chunk;
    }

    reload(): void {
        const oldChunks = this.chunks;
        this.chunks = new Map();
        this.within(this.loadRadius, (coords: Coordinates) => {
            const chunk = oldChunks.get(coords.string());
            if (chunk === undefined) return this.loadChunk(coords); // Load new chunk.
            // Transfer old chunk.
            this.chunks.set(coords.string(), chunk);
            oldChunks.delete(coords.string());
        });

        // The remaining old chunks can be thrown away.
        oldChunks.forEach((chunk) => this.removeMesh(chunk.mesh));
        oldChunks.clear(); // Don't wait for GC, there might be lots of memory in here.
    }

    /** Resets the scale of all loaded meshes. */
    rescaleMesh() {
        this.rangeActive((chk) => {
            chk.mesh.scale.set(this.blockSize, this.blockSize, this.verticalUnit);
            chk.mesh.updateMatrix();
        });
    }

    private center: Coordinates = undefined;

    /**
     * Loads the blocks within range of worldPosition and unloads the blocks outside its range.
     */
    centerOn(worldPosition: Position): void {
        const chunkCoords = worldPosition.toChunk();
        if (this.center != undefined && chunkCoords.equals(this.center)) return;
        this.center = chunkCoords;
        this.reload();
    }

    private within(...args: Parameters<Coordinates['withinSquare']>) {
        let res = Coordinates.prototype.withinSquare;
        if (this.conf.chunks.radiusType === 'circle')
            res = Coordinates.prototype.withinCircle;
        return res.bind(this.center)(...args);
    }

    /**
     * Calls a function on all active chunks.
     * @param fun - The function to apply to each chunk.
     */
    private rangeActive(fun: (chunk: Chunk) => void): void {
        for (const [_, chunk] of this.chunks) fun(chunk);
    }
}
