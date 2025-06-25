import { CHUNK_UNIT } from "./constants.js";

class Chunk {
    constructor(coords, mesh, height) {
        this.coords = coords;
        this.mesh = mesh;
        this.height = height;
    }
}

/** Dynamically manages terrain as a collection of chunks. */
export class Terrain {
    /** @type {Map<string, Chunk>} Map id (e.g., "0,0", "1,0") => Chunk instances. */
    #chunks = new Map();;
    /** References to the relevant configurations */
    #conf;
    /**
     * Height generator normalised between .01 and 1.
     * The low bound is hard, the height cannot go below .01.
     * The high bound is soft, it can go above 1, but this is statistically rare.
     */
    #height;
    /** @type {THREE.Group} The mesh group of every active chunk. */
    mesh = new THREE.Group();

    constructor(chunks, gen, render) {
        this.#conf = {chunks, gen, render };
        this.regen(); // Initialize the height function.
    }

    get #blockSize()    { return this.#conf.chunks.blockSize }
    get #verticalUnit() { return this.#conf.gen.verticalUnit }
    get #nblocks()      { return this.#conf.chunks.nblocks }
    #shiftedHeight(coords) {
        return (x, y) => this.#height(x + coords.x, y + coords.y);
    }

    /** Creates a new mesh at the given coordinates, scales it and positions it in the world. */
    #newMesh(coords) {
        const res = this.#conf.render.mesh({
            at: this.#shiftedHeight(coords),
            nblocks: this.#nblocks,
        });
        res.geometry.scale(this.#blockSize, this.#blockSize, this.#verticalUnit);
        res.translateX(coords.x * CHUNK_UNIT);
        res.translateY(coords.y * CHUNK_UNIT);
        return res;
    }

    /**
     * Updates the mesh of a single chunk.
     * @param {Chunk} chunk - The chunk whose mesh needs to be updated.
     */
    #updateChunk(chunk) {
        const oldMesh = chunk.mesh;
        chunk.mesh = this.#newMesh(chunk.coords);
        this.mesh.add(chunk.mesh);
        this.mesh.remove(oldMesh);
        oldMesh.geometry.dispose();
        oldMesh.material.dispose();
    }

    /** Returns the chunk stored at the given coordinates, creating it if necessary. */
    getChunk(coords) {
        const id = `${coords.x},${coords.y}`;
        if (this.#chunks.has(id)) return this.#chunks.get(id);

        const chunk = new Chunk(coords, this.#newMesh(coords), this.#shiftedHeight(coords));
        this.mesh.add(chunk.mesh);
        this.#chunks.set(id, chunk);
        return chunk;
    }

    /**
     * Calls a function on all active chunks.
     * @param {function(Chunk): void} fun - The function to apply to each chunk.
     */
    #rangeActive(fun) { for (const [_, chunk] of this.#chunks) fun(chunk); }

    /** Regenerates the heights and updates the mesh of all active chunks. */
    regen() {
        this.#height = this.#conf.gen.heightField().mkNormalised(.01, 1);
        this.#rangeActive(this.#updateChunk.bind(this));
    }
}
