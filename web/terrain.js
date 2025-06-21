import { HeightGenerator } from './height-generation.js';
export class Chunk {
    constructor(heights, mesh) {
        this.heights = heights;
        this.mesh = mesh;
    }
}

/**
 * Handles terrain generation and terrain mesh by managing multiple chunks.
 */
export class Terrain {
    /** @private @type {Map<string, Chunk>} Map id (e.g., "0,0", "1,0") => Chunk instances. */
    #chunks = new Map();;
    /** @private @type {function(Coordinates): HeightGenerator} Returns the heights at the given chunk coordinates. */
    #mkHeights;
    /** @private @type {function(HeightGenerator): THREE.Mesh} Returns the mesh for the given heights. */
    #mkMesh;
    /** @type {THREE.Group} The mesh group of every active chunk. */
    mesh = new THREE.Group();

    /**
     * Creates an instance of Terrain.
     * @param {function(Coordinates): HeightGenerator} mkHeights - The heights builder.
     * @param {function(HeightGenerator): Three.Mesh}  mkMesh   - The mesh builder.
     */
    constructor(mkHeights, mkMesh) {
        this.#mkHeights = mkHeights;
        this.#mkMesh = mkMesh;
    }

    /**
     * Retrieves a chunk by its coordinates, create it if it doesn't exist.
     *
     * @param {Coordinates} coords - The coordinates of the chunk.
     * @returns {Chunk} The Chunk.
     */
    at(coords) {
        const chunkId = `${coords.x},${coords.y}`;
        if (this.#chunks.has(chunkId)) return this.#chunks.get(chunkId);
        return this.#generate(coords);
    }

    /**
     * Generates a new terrain chunk for the given chunk coordinates.
     * If a chunk already exists at these coordinates, it will be regenerated.
     *
     * @param {Coordinates} coords - The coordinates of the chunk.
     * @returns {Chunk} The newly generated or regenerated Chunk.
     */
    #generate(coords) {
        const heights = this.#mkHeights(coords);
        heights.generate();
        const chunk = new Chunk(heights, this.#mkMesh(heights));
        this.mesh.add(chunk.mesh);
        this.#chunks.set(heights.id, chunk);
        return chunk;
    }

    updateMesh() {
        for (const [_, chunk] of this.#chunks) {
            const oldMesh = chunk.mesh;
            chunk.mesh = this.#mkMesh(chunk.heights);
            this.mesh.add(chunk.mesh);
            this.mesh.remove(oldMesh);
            oldMesh.geometry.dispose();
            oldMesh.material.dispose();
        }
    }
}
