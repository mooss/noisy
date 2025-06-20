import { GenerationConfig } from './config/generation.js';
import { GridConfig } from './config/grid.js';
import { rangeMapper } from './utils.js';
import { RNG } from './rng.js';
import { Coordinates, Position } from './coordinates.js';

// Base dimension of a chunk in 3d space.
const CHUNK_UNIT = 256;

// x and y coordinates shift to hide simplex artifact at the origin.
const SIM_SHIFT = 1024;

/**
 * Handles terrain data storage and generation algorithms.
 * @class Chunk
 */
export class Chunk {
    /** @private @type {number} The number of cells along one dimension of the chunk. */
    #size;
    /** @private @type {number} The size of a single cell in world units. */
    #cellSize;
    /** @private @type {RNG} The random number generator instance. */
    #rng;
    /** @private @type {number} The maximum height value for the terrain. */
    #maxH;
    /** @private @type {number[][]} The 2D array storing the height data. */
    #data;
    /** @private @type {GenerationConfig} The configuration object for generation parameters. */
    #generationConfig;
    /** @private @type {GridConfig} The configuration object for grid parameters. */
    #gridConfig;
    /** @private @type {Coordinates} The coordinates of the chunk. */
    #coord;
    /** @private @type {number} The x offset of the chunk. */
    #xOffset;
    /** @private @type {number} The y offset of the chunk. */
    #yOffset;

    /**
     * Initializes a new Chunk instance.
     *
     * @param {GenerationConfig} generationConfig - The configuration object for generation parameters.
     * @param {GridConfig}       gridConfig       - The configuration object for grid parameters.
     * @param {number}           [chunkX=0]       - The x-coordinate of the chunk.
     * @param {number}           [chunkY=0]       - The y-coordinate of the chunk.
     */
    constructor(generationConfig, gridConfig, chunkX = 0, chunkY = 0) {
        this.reset(generationConfig, gridConfig, chunkX, chunkY);
    }

    /**
     * Resets the chunk with new generation parameters.
     *
     * Updates the stored generation parameters and re-initializes the RNG.
     * Reallocates the chunk data array only if the chunk size changes.
     *
     * @param {GenerationConfig} generationConfig - The configuration object for generation parameters.
     * @param {GridConfig}       gridConfig       - The configuration object for grid parameters.
     * @param {number}           [chunkX=0]       - The x-coordinate of the chunk.
     * @param {number}           [chunkY=0]       - The y-coordinate of the chunk.
     */
    reset(generationConfig, gridConfig, chunkX = 0, chunkY = 0) {
        this.#generationConfig = generationConfig;
        this.#gridConfig = gridConfig;
        this.#maxH = (CHUNK_UNIT / 5) * this.#gridConfig.heightMultiplier;
        this.#coord = new Coordinates(chunkX, chunkY);

        // Data layout, don't reallocate unless necessary.
        if (this.#size != this.#gridConfig.size) {
            this.#size = this.#gridConfig.size;
            this.#cellSize = CHUNK_UNIT / this.#size;
            this.#data = Array(this.#size).fill(0).map(() => new Array(this.#size).fill(0));
        }

        this.#xOffset = chunkX * this.#size;
        this.#yOffset = chunkY * this.#size;

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

    /**
     * Gets the method name of the configured algorithm.
     * @returns {number}
     */
    get algorithm() {
        return this.#generationConfig.terrainAlgo;
    }

    /**
     * Gets the size of a single cell.
     * @returns {number}
     */
    get cellSize() {
        return this.#cellSize;
    }

    /**
     * Gets the chunk identifier.
     * @returns {string} The chunk identifier in the format "x,y".
     */
    get id() {
        return `${this.#coord.x},${this.#coord.y}`;
    }

    /**
     * Gets the chunk's height data.
     * @returns {number[][]} The 2D array representing block heights.
     */
    get data() {
        return this.#data;
    }

    /**
     * Gets the maximum possible height value.
     * @returns {number}
     */
    get maxH() {
        return this.#maxH;
    }

    /**
     * Gets the seed used for generation.
     * @returns {number}
     */
    get seed() {
        return this.#generationConfig.seed;
    }

    /**
     * Gets the size of the chunk (number of cells per side).
     * @returns {number}
     */
    get size() {
        return this.#size;
    }

    ///////////////
    // Utilities //

    /**
     * Applies a function to every cell in the chunk, updating its value.
     * @param {function(number, number): number} fun - The function to apply, taking (x, y) and returning a new height.
     */
    apply(fun) {
        this.range((x, y) => this.#data[x][y] = fun(x, y));
    }

    /**
     * Applies a function to every cell in the chunk using the x and y offsets, updating its value.
     * @param {function(number, number): number} fun - The function to apply, taking (x, y) and returning a new height.
     */
    offsetApply(fun) {
        this.range((x, y) => this.#data[x][y] = fun(x + this.#xOffset, y + this.#yOffset));
    }

    /**
     * Iterates over every cell in the chunk and executes a function.
     *
     * @param {function(number, number): void} fun - The function to execute for each cell, taking (x, y).
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
    heightOf(local) {
        if (local.x >= 0 && local.x < this.#size &&
            local.y >= 0 && local.y < this.#size) {
            return this.#data[local.x][local.y];
        }
        return undefined;
    }

    /**
     * Returns the world position of the given local coordinates.
     *
     * @param {Coordinates} local - The coordinates.
     * @returns {Position} The position corresponding to the coordinates.
     */
    positionOf(local) {
        const res = new Coordinates(local.x, local.y).toWorld(this.#cellSize);
        res.z = this.heightOf(local);
        return res;
    }

    /**
     * Normalizes all height values in the chunk to a range between 0.1 and maxH.
     *
     * If min and max are not provided, they are computed from the current chunk data.
     *
     * @param {number} [min] - The minimum value of the current data range.
     * @param {number} [max] - The maximum value of the current data range.
     */
    normalize(min, max) {
        if (min === undefined) { // Compute min and max manually.
            min = Infinity, max = -Infinity;
            this.range((x, y) => {
                const h = this.#data[x][y];
                if (h < min) min = h;
                if (h > max) max = h;
            });
        }

        if (min === max) { // Avoid potential division by zero.
            this.apply((x, y) => this.#data[x][y] = this.maxH);
            return;
        }

        const norm = rangeMapper(min, max, .1, this.maxH);
        this.apply((x, y) => norm(this.#data[x][y]));
    }

    ///////////////////////
    // Height generation //

    /**
     * Generates terrain with the configured algorithm.
     */
    generate() {
        this[this.algorithm]();
    }

    /**
     * Generates terrain using Simplex noise.
     */
    noise() {
        this.offsetApply((x, y) => this.#rng.simplex(x, y));
        this.normalize();
    }

    /**
     * Generates terrain using the midpoint displacement (diamond-square) algorithm.
     */
    midpoint() {
        this.#rng.reseed();
        this.normalize(...midpointDisplacement(
            this.#data, (min, max) => this.#rng.float(min, max), this.#generationConfig.midpointRoughness,
        ));
    }

    /**
     * Fills the height data with random values.
     */
    rand() {
        this.#rng.reseed();
        this.apply(() => this.#rng.float(1, this.#maxH));
    }

    /**
     * Generates terrain using ridge noise, based on Simplex noise.
     *
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

/**
 * Generates height data using the diamond-square algorithm.
 *
 * @param {number[][]}                       data      - The 2D array (must be square with side length 2^n + 1) to fill.
 * @param {function(number, number): number} rng       - A function that returns a random number within a given range `(min, max)`.
 * @param {number}                           roughness - Controls the magnitude of the random displacement. Higher values create rougher terrain.
 *
 * @returns {[number, number]} An array containing the minimum and maximum height values generated `[min, max]`.
 */
function midpointDisplacement(data, rng, roughness) {
    const size = data.length;
    let range = 1;

    // Offset used to iterate through the data.
    // Power of two. Starts big and is divided by two each iteration (adding level of details).
    let step = size - 1;

    // Initialize the four corners.
    data[0][0] = rng(0, range);
    data[0][size - 1] = rng(0, range);
    data[size - 1][0] = rng(0, range);
    data[size - 1][size - 1] = rng(0, range);

    // Keeping track of min and max heights to then normalize to the intended height range.
    let max_ = -Infinity, min_ = Infinity;
    const minmax = val => {
        if (val > max_) max_ = val;
        if (val < min_) min_ = val;
    };
    minmax(data[0][0]);
    minmax(data[0][size - 1]);
    minmax(data[size - 1][0]);
    minmax(data[size - 1][size - 1]);

    // Diamond-square proper.
    range *= roughness;
    while (step > 1) {
        let halfStep = step / 2;

        // Diamond step, average the four diagonal neighbours of a new point and nudge it a little
        // bit by a random value.
        for (let x = halfStep; x < size - 1; x += step) {
            for (let y = halfStep; y < size - 1; y += step) {
                let avg = (data[x - halfStep][y - halfStep] +
                           data[x - halfStep][y + halfStep] +
                           data[x + halfStep][y - halfStep] +
                           data[x + halfStep][y + halfStep]) / 4; // Average.

                data[x][y] = avg + rng(-range, range); // Nudge.
                minmax(data[x][y]);
            }
        }

        // Square step, average the four (or three) linear neighbours and nudge it a little bit by a
        // random value.
        for (let x = 0; x < size; x += halfStep) {
            for (let y = (x % step === 0) ? halfStep : 0; y < size; y += step) {
                let count = 0;
                let sum = 0;

                // Points in this step can be on the edge of the chunk and therefore only have two or
                // three valid neighbours, so the coordinates must be carefully checked.
                if (x >= halfStep) { sum += data[x - halfStep][y]; count++; }
                if (x + halfStep < size) { sum += data[x + halfStep][y]; count++; }
                if (y >= halfStep) { sum += data[x][y - halfStep]; count++; }
                if (y + halfStep < size) { sum += data[x][y + halfStep]; count++; }

                data[x][y] = sum / count + rng(-range, range); // Average and nudge.
                minmax(data[x][y]);
            }
        }

        // Reduce the random range for the next iteration.
        range *= roughness;
        step = halfStep;
    }

    return [min_, max_];
}
