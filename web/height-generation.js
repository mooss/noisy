import { GenerationConfig } from './config/generation.js';
import { rangeMapper } from './utils.js';
import { RNG } from './rng.js';
import { Coordinates } from './coordinates.js';
import { CHUNK_UNIT, SIM_SHIFT } from './constants.js';

/**
 * Handles terrain data storage and height generation algorithms.
 * @class HeightGenerator
 */
export class HeightGenerator {
    /** @type {number} The number of cells along one dimension of the chunk. */
    #size = undefined;
    /** @type {RNG} The random number generator instance. */
    #rng;
    /** @type {number} The maximum height value for the terrain. */
    #maxH;
    /** @type {number[][]} The height field. */
    #heights;
    /** @type {ChunkConfig} The chunks configuration. */
    #chunksConfig;
    /** @type {GenerationConfig} The terrain generation configuration. */
    #generationConfig;
    /** @type {Coordinates} The offset of the chunk in world units. */
    #offset;

    /** @type {Coordinates} The coordinates of the chunk. */
    coords;

    /**
     * Initializes a new HeightGenerator instance.
     *
     * @param {GenerationConfig} generationConfig - The terrain generation configuration.
     * @param {number}           chunksConfig     - The chunks configuration.
     * @param {Coordinates}      [chunkCoords]    - The coordinates of the chunk containing the heights.
     */
    constructor(generationConfig, chunksConfig, chunkCoords = new Coordinates(0, 0)) {
        this.coords = chunkCoords;
        this.#generationConfig = generationConfig;
        this.#chunksConfig = chunksConfig;
        this.reset();
    }

    /**
     * Resets the height generator with new generation parameters.
     *
     * Updates the stored generation parameters and re-initializes the RNG.
     * Reallocates the heights container only if the chunk size changes.
     *
     * Takes no parameters because references to relevant config parameters are kept within the
     * object 😬
     */
    reset() {
        this.#maxH = (CHUNK_UNIT / 5) * this.#generationConfig.heightMultiplier;

        // Data layout, don't reallocate unless necessary.
        if (this.#size != this.#chunksConfig.size) {
            this.#size = this.#chunksConfig.size;
            this.#offset = new Coordinates(this.coords.x * this.#size, this.coords.y * this.#size);
            this.#heights = Array(this.#size).fill(0).map(() => new Array(this.#size).fill(0));
        }

        const noi = this.#generationConfig.noise;
        this.#rng = new RNG({
            seed:  this.seed,
            warp:  noi.warpingStrength,
            shift: SIM_SHIFT,
            octaves: noi.octaves,
            fundamental: noi.fundamental / this.#size,
            persistence: noi.persistence,
            lacunarity:  noi.lacunarity,
            ridgeInvert: noi.ridge.invertSignal,
            ridgeSquare: noi.ridge.squareSignal,
        });
    }

    ///////////////
    // Accessors //

    /** @returns {number} The method name of the configured algorithm. */
    get algorithm() { return this.#generationConfig.terrainAlgo; }

    /** @returns {string} The chunk identifier in the format "x,y". */
    get id() { return `${this.coords.x},${this.coords.y}`; }

    /** @returns {number} Gets the maximum possible height value. */
    get maxH() { return this.#maxH; }

    /** @returns {number} The seed used for generation. */
    get seed() { return this.#generationConfig.seed; }

    /** @returns {number} The size of the chunk (number of cells per side). */
    get size() { return this.#size; }

    ///////////////
    // Utilities //

    /**
     * Applies fun to every coordinates of the height field.
     * @param {function(number, number): number} fun - The function to apply, taking (x, y) and returning the new height.
     */
    apply(fun) {
        this.range((x, y) => this.#heights[x][y] = fun(x, y));
    }

    /**
     * Applies fun to every coordinates of the height field, using the coordinates offset.
     * The offsets are added before calling fun, they essentially shift the raw height coordinates
     * to where the chunk is within the world.
     *
     * @param {function(number, number): number} fun - The function to apply, taking (x, y) and returning the new height.
     */
    offsetApply(fun) {
        this.range((x, y) => this.#heights[x][y] = fun(x + this.#offset.x, y + this.#offset.y));
    }

    /**
     * Calls a function over all the coordinates of the height field.
     * @param {function(number, number): void} fun - The function to execute for each coordinate pair, taking (x, y).
     */
    range(fun) {
        for (let x = 0; x < this.#size; x++) {
            for (let y = 0; y < this.#size; y++) {
                fun(x, y);
            }
        }
    }

    /**
     * Returns the height at a specific local coordinates.
     *
     * @param {Coordinates} local - The coordinates.
     * @returns {number|undefined} The height at the given coordinates, undefined if out of bounds.
     */
    at(x, y) {
        return this.#heights[x][y];
    }

    /**
     * Normalizes all height values to a range between 0.1 and maxH.
     * If min and max are not provided, they are computed from the current height field.
     *
     * @param {number} [min] - The minimum value of the current data range.
     * @param {number} [max] - The maximum value of the current data range.
     */
    normalize(min, max) {
        if (min === undefined) { // Compute min and max manually.
            min = Infinity, max = -Infinity;
            this.range((x, y) => {
                const h = this.#heights[x][y];
                if (h < min) min = h;
                if (h > max) max = h;
            });
        }

        if (min === max) { // Avoid potential division by zero.
            this.apply((x, y) => this.#heights[x][y] = this.maxH);
            return;
        }

        const norm = rangeMapper(min, max, .1, this.maxH);
        this.apply((x, y) => norm(this.#heights[x][y]));
    }

    ///////////////////////
    // Height generation //

    /** Generates terrain with the configured algorithm. */
    generate() { this[this.algorithm](); }

    /** Generates terrain using Simplex noise. */
    noise() {
        this.offsetApply((x, y) => this.#rng.simplex(x, y));
        this.normalize();
    }

    /** Fills the height data with random values. */
    rand() {
        this.#rng.reseed();
        this.apply(() => this.#rng.float(1, this.#maxH));
    }

    /**
     * Generates terrain using ridge noise, based on Simplex noise.
     * Can produce 'octavian' or 'melodic' style ridges based on configuration.
     */
    ridge() {
        let fun = 'octavianRidge';
        if (this.#generationConfig.noise.ridge.style === 'melodic') {
            fun = 'melodicRidge';
        }

        this.offsetApply((x, y) => this.#rng[fun](x, y));
        this.normalize();
    }
}
