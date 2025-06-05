import { createNoise2D } from 'https://unpkg.com/simplex-noise@4.0.1/dist/esm/simplex-noise.js';
import { createLCG, mkRng, rangeMapper, clamp } from './utils.js';

function warpedNoise(noise, warpx, warpy, strength, simshift) {
	return (x, y, frequency) => {
		x = x * frequency + simshift;
		y = y * frequency + simshift;
		return noise(
			x + warpx(x, y) * strength,
			y + warpy(x, y) * strength,
		)
	}
}

// Base dimension of a grid.
const GRID_UNIT = 256;

// x and y coordinates shift to hide simplex artifact at the origin.
const SIM_SHIFT = 1024;

// Handles terrain data storage and generation algorithms.
export class Grid {
    // Private fields for internal state.
    #size;
    #cellSize;
    #seed;
    #rng;
    #noiseGen;
    #maxH;
    #data;
    #config;

    constructor(config) {
        this.reset(config);
    }

    // Updates the stored generation parameters.
    reset(config) {
        this.#config = config;
        this.seed = config.rngSeed;
        this.#maxH = (GRID_UNIT / 5) * this.#config.heightMultiplier;

        // Grid layout, don't reallocate unless necessary.
        if (this.#size != config.gridSize) {
            this.#size = config.gridSize;
            this.#cellSize = GRID_UNIT / this.#size;
            this.#data = Array(this.#size).fill(0).map(() => new Array(this.#size).fill(0));
        }
    }

    ///////////////
    // Accessors //

    get size() {
        return this.#size;
    }

    get cellSize() {
        return this.#cellSize;
    }

    get maxH() {
        return this.#maxH;
    }

    get data() {
        return this.#data;
    }

    set seed(newSeed) {
        this.#seed = newSeed;
        this.reseed();
		const noise = createNoise2D(createLCG(this.#seed));
		const warpx = createNoise2D(createLCG(this.#seed + 1));
		const warpy = createNoise2D(createLCG(this.#seed + 2));
        this.#noiseGen = warpedNoise(noise, warpx, warpy, this.#config.noiseWarpingStrength, SIM_SHIFT);
    }

    ///////////////
    // Utilities //

    // Returns the fractal simplex noise value at the given coordinates.
    simplex(x, y) {
        let total = 0;
        let frequency = this.#config.noiseFundamental / this.#size;
        let amplitude = 1;

        for (let i = 0; i < this.#config.noiseOctaves; i++) {
            let octave = this.#noiseGen(x, y, frequency);
            total += octave * amplitude;

            // Update amplitude and frequency for the next octave.
            amplitude *= this.#config.noisePersistence;
            frequency *= this.#config.noiseLacunarity;
        }

        return total;
    }

    // Resets the random number generator.
    reseed() {
        this.#rng = mkRng(this.#seed);
    }

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

    ///////////////////////
    // Height generation //

    // Random heights.
    rand() {
        this.reseed();
        this.apply(() => this.#rng(1, this.#maxH));
    }

    // Simplex noise.
    noise() {
        this.apply((x, y) => this.simplex(x, y));
        this.normalize();
    }

    // Normalized midpoint displacement.
    midpoint() {
        this.reseed();
        this.normalize(...midpointDisplacement(this.#data, this.#rng, this.#config.midpointRoughness));
    }


    // Ridge noise using simplex noise as a base.
    ridge() {
        if (this.#config.ridgeStyle === 'octavian') {
            this.octavianRidge();
        } else {
            this.melodicRidge();
        }
    }

    // Ridge noise where the ridge transformation is applied to each octave.
    octavianRidge() {
        this.apply((x, y) => {
            let total = 0;
            let frequency = this.#config.noiseFundamental / this.#size;
            let amplitude = 1;

            for (let i = 0; i < this.#config.noiseOctaves; i++) {
                let signal = this.toRidge(this.#noiseGen(x, y, frequency));

                // Add the contribution of this octave to the result.
                total += signal * amplitude;

                // Update amplitude and frequency for the next octave.
                amplitude *= this.#config.noisePersistence;
                frequency *= this.#config.noiseLacunarity;
            }
            return total;
        });
        this.normalize();
    }

    // Ridge noise where the ridge transformation is applied to the already layered octaves.
    melodicRidge() {
        this.apply((x, y) => this.toRidge(this.simplex(x, y)));
        this.normalize();
    }

    toRidge(signal) {
        // Taking the absolute value maps [-1, 1] -> [0, 1] and makes the negative values
        // positive, thus transforming the smooth transition from positive to negative
        // values into a sharp "rebound".
        signal = Math.abs(signal);

        // Inverting the elevation with `1 - signal` makes the rebound occur at the top,
        // creating ridges instead of valleys.
        if (this.#config.ridgeInvertSignal) {
            signal = 1.0 - signal;
        }

        // Squaring the signal will emphasize ridges/valleys.
        if (this.#config.ridgeSquareSignal) {
            signal *= signal;
        }

        return signal;
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
