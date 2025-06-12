import { Grid } from './terrain.js';

export class ChunkManager {
    /**
     * Stores Grid instances by their chunk ID (e.g., "0,0", "1,0").
     * @type {Map<string, Grid>}
     */
    #chunks;

    /**
     * Reference to the application configuration.
     * @type {object}
     */
    #config;

    /**
     * Creates an instance of ChunkManager.
     * @param {object} config - The application configuration object.
     */
    constructor(config) {
        this.#chunks = new Map();
        this.#config = config;
    }

    /**
     * Generates a new terrain chunk for the given chunk coordinates.
     * If a chunk already exists at these coordinates, it will be regenerated.
     *
     * @param {number} x - The X coordinate of the chunk.
     * @param {number} y - The Y coordinate of the chunk.
     * @returns {Grid} The newly generated or regenerated Grid instance for the chunk.
     */
    generateChunk(x, y) {
        const terrainGrid = new Grid(this.#config, x, y);
        terrainGrid.generate();
        this.#chunks.set(terrainGrid.id, terrainGrid);
        return terrainGrid;
    }

    /**
     * Retrieves an existing terrain chunk by its coordinates.
     *
     * @param {number} x - The X coordinate of the chunk.
     * @param {number} y - The Y coordinate of the chunk.
     * @returns {Grid|undefined} The Grid instance for the chunk, or undefined if not found.
     */
    get(x, y) {
        const chunkId = `${x},${y}`;
        return this.#chunks.get(chunkId);
    }

    /**
     * Returns the map of all currently loaded chunks.
     * @returns {Map<string, Grid>} An iterator over all Grid instances.
     */
    getAllChunks() {
        return this.#chunks;
    }
}
