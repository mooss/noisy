import { RNG } from './rng.js';
import { rangeMapper } from './utils.js';

// Base dimension of a grid.
const GRID_UNIT = 256;

// x and y coordinates shift to hide simplex artifact at the origin.
const SIM_SHIFT = 1024;

// Handles terrain data storage and generation algorithms.
export class Grid {
    #size;
    #cellSize;
    #rng;
    #maxH;
    #data;
    #config;

    constructor(config) {
        this.reset(config);
    }

    // Updates the stored generation parameters.
    reset(config) {
        this.#config = config;
        this.#maxH = (GRID_UNIT / 5) * this.#config.heightMultiplier;

        // Grid layout, don't reallocate unless necessary.
        if (this.#size != config.gridSize) {
            this.#size = config.gridSize;
            this.#cellSize = GRID_UNIT / this.#size;
            this.#data = Array(this.#size).fill(0).map(() => new Array(this.#size).fill(0));
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

    get cellSize() {
        return this.#cellSize;
    }

    get data() {
        return this.#data;
    }

    get maxH() {
        return this.#maxH;
    }

    get seed() {
        return this.#config.gen.seed;
    }

    get size() {
        return this.#size;
    }

    ///////////////
    // Utilities //

    // Apply the given function on every cell.
    apply(fun) {
        this.range((x, y) => this.#data[x][y] = fun(x, y));
    }

    range(fun) {
        for (let x = 0; x < this.#size; x++) {
            for (let y = 0; y < this.#size; y++) {
                fun(x, y);
            }
        }
    }

    // Returns the height at a specific grid coordinate.
    getHeightAt(x, y) {
        if (x >= 0 && x < this.#size && y >= 0 && y < this.#size) {
            return this.#data[x][y];
        }
        return undefined;
    }

    // Normalize all heights between 0.1 and maxH.
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

    // Simplex noise.
    noise() {
        this.apply((x, y) => this.#rng.simplex(x, y));
        this.normalize();
    }

    // Normalized midpoint displacement.
    midpoint() {
        this.#rng.reseed();
        this.normalize(...midpointDisplacement(
            this.#data, (min, max) => this.#rng.float(min, max), this.#config.gen.midpointRoughness,
        ));
    }

    // Random heights.
    rand() {
        this.#rng.reseed();
        this.apply(() => this.#rng.float(1, this.#maxH));
    }

    // Ridge noise using simplex noise as a base.
    ridge() {
        let fun = 'octavianRidge';
        if (this.#config.gen.noise.ridge.style === 'melodic') {
            fun = 'melodicRidge';
        }

        this.apply((x, y) => this.#rng[fun](x, y));
        this.normalize();
    }
}

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

                // Points in this step can be on the edge of the grid and therefore only have three
                // valid neighbours so the coordinates must be carefully checked.
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
