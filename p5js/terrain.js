import { createNoise2D } from 'https://unpkg.com/simplex-noise@4.0.1/dist/esm/simplex-noise.js';
import { createLCG, rangeMapper, mkRng } from './utils.js';

// Handles terrain data storage and generation algorithms.
export class Grid {
    constructor(size, seed) {
        // Grid layout.
        this.size = size;
        this.cellSize = 256 / this.size;
        this.data = [];

        for (let i = 0; i < this.size; i++) {
            this.data[i] = new Array(this.size).fill(0);
        }

        // Generation.
        this.seed = seed;
        this.reseed();
        this.noiseScale = 1 / this.size;
        this.noiseGen = createNoise2D(createLCG(this.seed));
        this.maxH = this.size * this.cellSize / 5;
    }

    ///////////////
    // Utilities //

    // Returns the simplex value at the given coordinates.
    simplex(x, y) {
        return ((this.noiseGen(x * this.noiseScale, y * this.noiseScale) + 1) / 2) * this.maxH;
    }

    // Resets the random number generator.
    reseed() {
        this.rng = mkRng(this.seed);
    }

    // Apply the given function on every cell.
    apply(fun) {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                this.data[i][j] = fun(i, j);
            }
        }
    }

    ///////////////////////
    // Height generation //

    // Random heights.
    rand() {
        this.reseed();
        this.apply(() => this.rng(1, this.maxH));
    }

    // Simplex noise.
    noise() {
        // Bind is required because of some insane JS schenanigan.
        this.apply(this.simplex.bind(this));
    }

    // Midpoint displacement (diamond-square).
    midpoint() {
        this.reseed();
        midpointDisplacement(this.data, this.maxH, this.rng);
    }

    // Average of midpoint displacement and simplex noise.
    midnoise() {
        this.reseed();
        this.midpoint();
        this.apply((x, y) => this.data[x][y] * .8 + this.simplex(x, y) * .2);
    }
}

export function midpointDisplacement(grid, maxH, rng) {
    const roughness = 0.6; // Scaling factor for each additional subdivision.
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
    const minmax = (val) => {
        if (val > max_) max_ = val;
        if (val < min_) min_ = val;
    };
    minmax(grid[0][0]);
    minmax(grid[0][size - 1]);
    minmax(grid[size - 1][0]);
    minmax(grid[size - 1][size - 1]);

    // Diamond-square proper.
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

    // Normalize all values between 1 and maxH.
    let normalize = rangeMapper(min_, max_, 1, maxH);
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            grid[i][j] = normalize(grid[i][j]);
        }
    }
}
