import * as THREE from 'three';
import { CHUNK_UNIT } from "./constants.js";
import { Coordinates } from "./coordinates.js";

class Chunk {
    constructor(coords, mesh, height) {
        this.coords = coords;
        this.mesh = mesh;
        this.height = height;
    }
}

/** Dynamically manages terrain as a collection of chunks. */
export class Terrain {
    /** References to the relevant configurations */
    #conf;

    /**
     * Height generator normalised between .01 and 1.
     * The low bound is hard, the height cannot go below .01.
     * The high bound is soft, it can go above 1, but this is statistically rare.
     *
     * The unit is the chunk, i.e. the first chunk is within [0 <= x <= 1], [0 <= y <= 1].
     */
    height;

    constructor(chunks, gen, render) {
        this.#conf = {chunks, gen, render };
        this.regen(); // Initialize the height function.
    }

    get #blockSize()    { return this.#conf.chunks.blockSize }
    get #verticalUnit() { return this.#conf.gen.verticalUnit }
    get #nblocks()      { return this.#conf.chunks.nblocks }
    get #loadRadius()   { return this.#conf.chunks.loadRadius }

    /**
     * Returns the height function of the given chunk.
     * The chunk is the height field between 0 and 1 (for both coordinates).
     */
    chunkHeightFun(chunkCoords) {
        return (x, y) => this.height(x + chunkCoords.x, y + chunkCoords.y);
    }

    /** Regenerates the heights and updates the mesh of all active chunks. */
    regen() {
        this.height = this.#conf.gen.heightField().mkNormalised(.01, 1);
        this.#rangeActive(this.#updateMesh.bind(this));
    }

    ////////////
    // Meshes //

    /** @type {THREE.Group} The mesh group of every active chunk. */
    mesh = new THREE.Group();

    /** Creates a new mesh at the given coordinates, scales it and positions it in the world. */
    #newMesh(coords) {
        const res = this.#conf.render.mesh({
            at: this.chunkHeightFun(coords),
            nblocks: this.#nblocks,
        });
        res.geometry.scale(this.#blockSize, this.#blockSize, this.#verticalUnit);
        res.translateX(coords.x * CHUNK_UNIT);
        res.translateY(coords.y * CHUNK_UNIT);
        res.matrixAutoUpdate = false;
        res.updateMatrix();
        return res;
    }

    /**
     * Updates the mesh of a single chunk.
     * @param {Chunk} chunk - The chunk whose mesh needs to be updated.
     */
    #updateMesh(chunk) {
        const oldMesh = chunk.mesh;
        chunk.mesh = this.#newMesh(chunk.coords);
        this.mesh.add(chunk.mesh);
        this.#removeMesh(oldMesh);
    }

    /**
     * Removes a mesh from the mesh group and disposes of its resources.
     * @param {THREE.Mesh} mesh - The mesh to remove.
     */
    #removeMesh(mesh) {
        this.mesh.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
    }

    ////////////
    // Chunks //

    /** @type {Map<Coordinates, Chunk>} Map id (e.g., "0,0", "1,0") => Chunk instances. */
    #chunks = new Map();

    #loadChunk(coords) {
        const chunk = new Chunk(coords, this.#newMesh(coords), this.chunkHeightFun(coords));
        this.mesh.add(chunk.mesh);
        this.#chunks.set(coords.string(), chunk);
        return chunk;
    }

    #center = undefined;

    /**
     * Loads the blocks within range of worldPosition and unloads the blocks outside its range.
     */
    centerOn(worldPosition) {
        const chunkCoords = worldPosition.toChunk();
        if (this.#center != undefined && chunkCoords.equals(this.#center)) return;
        this.#center = chunkCoords;
        this.reload();
    }

    reload() {
        const oldChunks = this.#chunks;
        this.#chunks = new Map();
        this.#center.within(this.#loadRadius, (coords) => {
            const chunk = oldChunks.get(coords.string());
            if (chunk === undefined) return this.#loadChunk(coords); // Load new chunk.
            // Transfer old chunk.
            this.#chunks.set(coords.string(), chunk);
            oldChunks.delete(coords.string());
        });

        // The remaining old chunks can be thrown away.
        oldChunks.forEach((chunk) => this.#removeMesh(chunk.mesh));
        oldChunks.clear(); // Don't wait for GC, there might be lots of memory in here.
    }

    /**
     * Calls a function on all active chunks.
     * @param {function(Chunk): void} fun - The function to apply to each chunk.
     */
    #rangeActive(fun) { for (const [_, chunk] of this.#chunks) fun(chunk); }
}
