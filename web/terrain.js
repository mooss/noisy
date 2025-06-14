import { RNG } from './rng.js';
import { rangeMapper } from './utils.js';

// Base dimension of a grid.
const GRID_UNIT = 256;

// x and y coordinates shift to hide simplex artifact at the origin.
const SIM_SHIFT = 1024;

/**
 * Handles terrain data storage and generation algorithms.
 * @class Grid
 */
export class Grid {
    /** @private @type {number} The number of cells along one dimension of the grid. */
    #size;
    /** @private @type {number} The size of a single cell in world units. */
    #cellSize;
    /** @private @type {RNG} The random number generator instance. */
    #rng;
    /** @private @type {number} The maximum height value for the terrain. */
    #maxH;
    /** @private @type {number[][]} The 2D array storing the height data. */
    #data;
    /** @private @type {object} The configuration object for generation parameters. */
    #config;
    /** @private @type {number} The x-coordinate of the chunk. */
    #x;
    /** @private @type {number} The y-coordinate of the chunk. */
    #y;
    /** @private @type {number} The x offset of the chunk. */
    #xOffset;
    /** @private @type {number} The y offset of the chunk. */
    #yOffset;

    /**
     * Initializes a new Grid instance.
     *
     * @param {object} config - The initial configuration object for the grid.
     * @param {number} [chunkX=0] - The x-coordinate of the chunk.
     * @param {number} [chunkY=0] - The y-coordinate of the chunk.
     */
    constructor(config, chunkX = 0, chunkY = 0) {
        this.reset(config, chunkX, chunkY);
    }

    /**
     * Resets the grid with new generation parameters.
     *
     * Updates the stored generation parameters and re-initializes the RNG.
     * Reallocates the grid data array only if the grid size changes.
     *
     * @param {object} config - The new configuration object.
     * @param {number} [chunkX=0] - The x-coordinate of the chunk.
     * @param {number} [chunkY=0] - The y-coordinate of the chunk.
     */
    reset(config, chunkX = 0, chunkY = 0) {
        this.#config = config;
        this.#maxH = (GRID_UNIT / 5) * this.#config.heightMultiplier;
        this.#x = chunkX;
        this.#y = chunkY;

        // Grid layout, don't reallocate unless necessary.
        if (this.#size != config.gridSize) {
            this.#size = config.gridSize;
            this.#cellSize = GRID_UNIT / this.#size;
            this.#data = Array(this.#size).fill(0).map(() => new Array(this.#size).fill(0));
            this.#xOffset = chunkX * this.#size;
            this.#yOffset = chunkY * this.#size;
        }

        const noi = this.#config.gen.noise;
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
        return this.#config.gen.terrainAlgo;
    }

    /**
     * Gets the size of a single cell.
     * @returns {number}
     */
    get cellSize() {
        return this.#cellSize;
    }

    /**
     * Gets the x-coordinate of the chunk.
     * @returns {number}
     */
    get x() {
        return this.#x;
    }

    /**
     * Gets the y-coordinate of the chunk.
     * @returns {number}
     */
    get y() {
        return this.#y;
    }

    /**
     * Gets the chunk identifier.
     * @returns {string} The chunk identifier in the format "x,y".
     */
    get id() {
        return `${this.#x},${this.#y}`;
    }

    /**
     * Gets the grid's height data.
     * @returns {number[][]} The 2D array representing grid heights.
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
        return this.#config.gen.seed;
    }

    /**
     * Gets the size of the grid (number of cells per side).
     * @returns {number}
     */
    get size() {
        return this.#size;
    }

    ///////////////
    // Utilities //

    /**
     * Applies a function to every cell in the grid, updating its value.
     * @param {function(number, number): number} fun - The function to apply, taking (x, y) and returning a new height.
     */
    apply(fun) {
        this.range((x, y) => this.#data[x][y] = fun(x, y));
    }

    /**
     * Applies a function to every cell in the grid using the x and y offsets, updating its value.
     * @param {function(number, number): number} fun - The function to apply, taking (x, y) and returning a new height.
     */
    offsetApply(fun) {
        this.range((x, y) => this.#data[x][y] = fun(x + this.#xOffset, y + this.#yOffset));
    }

    /**
     * Iterates over every cell in the grid and executes a function.
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
     * Returns the height at a specific grid coordinate.
     *
     * @param {number} x - The x-coordinate.
     * @param {number} y - The y-coordinate.
     *
     * @returns {number|undefined} The height at the given coordinates, or undefined if out of bounds.
     */
    getHeightAt(x, y) {
        if (x >= 0 && x < this.#size && y >= 0 && y < this.#size) {
            return this.#data[x][y];
        }
        return undefined;
    }

    /**
     * Normalizes all height values in the grid to a range between 0.1 and maxH.
     *
     * If min and max are not provided, they are computed from the current grid data.
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
            this.#data, (min, max) => this.#rng.float(min, max), this.#config.gen.midpointRoughness,
        ));
    }

    /**
     * Fills the grid with random height values.
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
        if (this.#config.gen.noise.ridge.style === 'melodic') {
            fun = 'melodicRidge';
        }

        this.offsetApply((x, y) => this.#rng[fun](x, y));
        this.normalize();
    }
}

/**
 * Generates height data using the diamond-square algorithm.
 *
 * @param {number[][]}                       grid      - The 2D array (must be square with side length 2^n + 1) to fill.
 * @param {function(number, number): number} rng       - A function that returns a random number within a given range `(min, max)`.
 * @param {number}                           roughness - Controls the magnitude of the random displacement. Higher values create rougher terrain.
 *
 * @returns {[number, number]} An array containing the minimum and maximum height values generated `[min, max]`.
 */
function midpointDisplacement(grid, rng, roughness) {
    const size = grid.length;
    let range = 1;

    // Offset used to iterate through the grid.
    // Power of two. Starts big and is divided by two each iteration (adding level of details).
    let step = size - 1;

    // Initialize the four corners.
    grid[0][0] = rng(0, range);
    grid[0][size - 1] = rng(0, range);
    grid[size - 1][0] = rng(0, range);
    grid[size - 1][size - 1] = rng(0, range);

    // Keeping track of min and max heights to then normalize to the intended height range.
    let max_ = -Infinity, min_ = Infinity;
    const minmax = val => {
        if (val > max_) max_ = val;
        if (val < min_) min_ = val;
    };
    minmax(grid[0][0]);
    minmax(grid[0][size - 1]);
    minmax(grid[size - 1][0]);
    minmax(grid[size - 1][size - 1]);

    // Diamond-square proper.
    range *= roughness;
    while (step > 1) {
        let halfStep = step / 2;

        // Diamond step, average the four diagonal neighbours of a new point and nudge it a little
        // bit by a random value.
        for (let x = halfStep; x < size - 1; x += step) {
            for (let y = halfStep; y < size - 1; y += step) {
                let avg = (grid[x - halfStep][y - halfStep] +
                           grid[x - halfStep][y + halfStep] +
                           grid[x + halfStep][y - halfStep] +
                           grid[x + halfStep][y + halfStep]) / 4; // Average.

                grid[x][y] = avg + rng(-range, range); // Nudge.
                minmax(grid[x][y]);
            }
        }

        // Square step, average the four (or three) linear neighbours and nudge it a little bit by a
        // random value.
        for (let x = 0; x < size; x += halfStep) {
            for (let y = (x % step === 0) ? halfStep : 0; y < size; y += step) {
                let count = 0;
                let sum = 0;

                // Points in this step can be on the edge of the grid and therefore only have two or
                // three valid neighbours, so the coordinates must be carefully checked.
                if (x >= halfStep) { sum += grid[x - halfStep][y]; count++; }
                if (x + halfStep < size) { sum += grid[x + halfStep][y]; count++; }
                if (y >= halfStep) { sum += grid[x][y - halfStep]; count++; }
                if (y + halfStep < size) { sum += grid[x][y + halfStep]; count++; }

                grid[x][y] = sum / count + rng(-range, range); // Average and nudge.
                minmax(grid[x][y]);
            }
        }

        // Reduce the random range for the next iteration.
        range *= roughness;
        step = halfStep;
    }

    return [min_, max_];
}
