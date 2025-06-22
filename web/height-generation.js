import { GenerationConfig } from './config/generation.js';
import { rangeMapper } from './utils.js';
import { RNG } from './rng.js';
import { Coordinates, Position } from './coordinates.js';

// Base dimension of a chunk in 3d space in world units.
export const CHUNK_UNIT = 256;

// x and y coordinates shift to hide simplex artifact at the origin.
const SIM_SHIFT = 1024;

/**
 * Handles terrain data storage and height generation algorithms.
 * @class HeightGenerator
 */
export class HeightGenerator {
    /** @type {number} The number of cells along one dimension of the chunk. */
    #size = undefined;
    /** @type {number} The size of a single cell in world units. */
    #cellSize;
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
            this.#cellSize = CHUNK_UNIT / this.#size;
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

    /** @returns {number} The size of a single cell. */
    get cellSize() { return this.#cellSize; }

    /** @returns {string} The chunk identifier in the format "x,y". */
    get id() { return `${this.coords.x},${this.coords.y}`; }

    /** @returns {number[][]} The height field. */
    get data() { return this.#heights; }

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
    heightOf(local) {
        if (local.x >= 0 && local.x < this.#size &&
            local.y >= 0 && local.y < this.#size) {
            return this.#heights[local.x][local.y];
        }
        return undefined;
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

    /** Generates terrain using the midpoint displacement (diamond-square) algorithm. */
    midpoint() {
        this.#rng.reseed();
        this.normalize(...midpointDisplacement(
            this.#heights, (min, max) => this.#rng.float(min, max), this.#generationConfig.midpointRoughness,
        ));
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

/**
 * Generates height data using the diamond-square algorithm.
 *
 * @param {number[][]}                       heights   - The 2D array to fill (must be square with side length 2^n + 1).
 * @param {function(number, number): number} rng       - A function that returns a random number within a given range `(min, max)`.
 * @param {number}                           roughness - Controls the magnitude of the random displacement. Higher values create rougher terrain.
 *
 * @returns {[number, number]} An array containing the minimum and maximum height values generated `[min, max]`.
 */
function midpointDisplacement(heights, rng, roughness) {
    const size = heights.length;
    let range = 1;

    // Offset used to iterate through the heights.
    // Power of two. Starts big and is divided by two each iteration (adding level of details).
    let step = size - 1;

    // Initialize the four corners.
    heights[0][0] = rng(0, range);
    heights[0][size - 1] = rng(0, range);
    heights[size - 1][0] = rng(0, range);
    heights[size - 1][size - 1] = rng(0, range);

    // Keeping track of min and max heights to then normalize to the intended height range.
    let max_ = -Infinity, min_ = Infinity;
    const minmax = val => {
        if (val > max_) max_ = val;
        if (val < min_) min_ = val;
    };
    minmax(heights[0][0]);
    minmax(heights[0][size - 1]);
    minmax(heights[size - 1][0]);
    minmax(heights[size - 1][size - 1]);

    // Diamond-square proper.
    range *= roughness;
    while (step > 1) {
        let halfStep = step / 2;

        // Diamond step, average the four diagonal neighbours of a new point and nudge it a little
        // bit by a random value.
        for (let x = halfStep; x < size - 1; x += step) {
            for (let y = halfStep; y < size - 1; y += step) {
                let avg = (heights[x - halfStep][y - halfStep] +
                           heights[x - halfStep][y + halfStep] +
                           heights[x + halfStep][y - halfStep] +
                           heights[x + halfStep][y + halfStep]) / 4; // Average.

                heights[x][y] = avg + rng(-range, range); // Nudge.
                minmax(heights[x][y]);
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
                if (x >= halfStep) { sum += heights[x - halfStep][y]; count++; }
                if (x + halfStep < size) { sum += heights[x + halfStep][y]; count++; }
                if (y >= halfStep) { sum += heights[x][y - halfStep]; count++; }
                if (y + halfStep < size) { sum += heights[x][y + halfStep]; count++; }

                heights[x][y] = sum / count + rng(-range, range); // Average and nudge.
                minmax(heights[x][y]);
            }
        }

        // Reduce the random range for the next iteration.
        range *= roughness;
        step = halfStep;
    }

    return [min_, max_];
}
