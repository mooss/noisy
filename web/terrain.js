import { Chunk } from './chunk.js';

/**
 * Handles terrain generation and terrain mesh by managing multiple chunks.
 */
export class Terrain {
    /**
     * Stores Chunk instances by their ID (e.g., "0,0", "1,0").
     * @type {Map<string, Chunk>}
     */
    #chunks;

    /**
     * Reference to the application configuration.
     * @type {object}
     */
    #config;

    /**
     * Creates an instance of Terrain.
     * @param {object} config - The application configuration object.
     */
    constructor(config) {
        this.#chunks = new Map();
        this.#config = config;
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
        return this.regen(coords);
    }

    /**
     * Returns the map of all currently loaded chunks.
     * @returns {Map<string, Chunk>} All the loaded chunks.
     */
    getAllChunks() {
        return this.#chunks;
    }

    /**
     * Generates a new terrain chunk for the given chunk coordinates.
     * If a chunk already exists at these coordinates, it will be regenerated.
     *
     * @param {Coordinates} coords - The coordinates of the chunk.
     * @returns {Chunk} The newly generated or regenerated Chunk.
     */
    regen(coords) {
        const chunk = new Chunk(this.#config.gen, this.#config.chunks.size, coords);
        chunk.generate();
        this.#chunks.set(chunk.id, chunk);
        return chunk;
    }
}
