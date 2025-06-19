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
     * Retrieves a chunk by its coordinates, create it if it doesn't exist.
     *
     * @param {Coordinates} coords - The coordinates of the chunk.
     * @returns {Grid|undefined} The Grid instance for the chunk, or undefined if not found.
     */
    at(coords) {
        const chunkId = `${coords.x},${coords.y}`;
        if (this.#chunks.has(chunkId)) return this.#chunks.get(chunkId);
        return this.regen(coords);
    }

    /**
     * Returns the map of all currently loaded chunks.
     * @returns {Map<string, Grid>} An iterator over all Grid instances.
     */
    getAllChunks() {
        return this.#chunks;
    }

    /**
     * Generates a new terrain chunk for the given chunk coordinates.
     * If a chunk already exists at these coordinates, it will be regenerated.
     *
     * @param {Coordinates} coords - The coordinates of the chunk.
     * @returns {Grid} The newly generated or regenerated Grid instance for the chunk.
     */
    regen(coords) {
        const terrainGrid = new Grid(this.#config.gen, this.#config.grid, coords.x, coords.y);
        terrainGrid.generate();
        this.#chunks.set(terrainGrid.id, terrainGrid);
        return terrainGrid;
    }
}
