import { HeightGenerator } from './height-generation.js';

/**
 * Handles terrain generation and terrain mesh by managing multiple chunks.
 */
export class Terrain {
    /** @type {Map<string, HeightGenerator>} Map id (e.g., "0,0", "1,0") => Chunk instances. */
    #chunks = new Map();;
    /** @type {function(Coordinates): HeightGenerator} Builds a height generator for the given coordinates */
    #heightGen;

    /**
     * Creates an instance of Terrain.
     * @param {function(Coordinates): HeightGenerator} heightGen - The height generator builder.
     */
    constructor(heightGen) {
        this.#heightGen = heightGen;
    }

    /**
     * Retrieves a chunk by its coordinates, create it if it doesn't exist.
     *
     * @param {Coordinates} coords - The coordinates of the chunk.
     * @returns {HeightGenerator} The Chunk.
     */
    at(coords) {
        const chunkId = `${coords.x},${coords.y}`;
        if (this.#chunks.has(chunkId)) return this.#chunks.get(chunkId);
        return this.regen(coords);
    }

    /**
     * Generates a new terrain chunk for the given chunk coordinates.
     * If a chunk already exists at these coordinates, it will be regenerated.
     *
     * @param {Coordinates} coords - The coordinates of the chunk.
     * @returns {HeightGenerator} The newly generated or regenerated Chunk.
     */
    regen(coords) {
        const chunk = this.#heightGen(coords);
        chunk.generate();
        this.#chunks.set(chunk.id, chunk);
        return chunk;
    }
}
