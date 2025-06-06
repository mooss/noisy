import { createNoise2D } from 'https://unpkg.com/simplex-noise@4.0.1/dist/esm/simplex-noise.js';
import { createLCG, mkRng } from './utils.js';

/**
 * Creates a warped simplex noise function.
 *
 * Domain warping displaces the input coordinates using another noise function, hiding linear
 * artifacts.
 * The x-y-frequency calling signature is necessary to accommodate the shift parameter.
 *
 * @param {function(number, number): number} noise    - The base noise function.
 * @param {function(number, number): number} warpx    - Noise function for warping the x-coordinate.
 * @param {function(number, number): number} warpy    - Noise function for warping the y-coordinate.
 * @param {number}                           strength - The magnitude of the warp effect.
 * @param {number}                           simshift - A constant offset applied to all coordinates.
 *
 * @returns {function(number, number, number): number} The warped noise function.
 */
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

/**
 * A seeded random number and noise generator class.
 *
 * Provides methods for generating pseudo-random numbers, simplex noise, and variations like ridge
 * noise, all derived from a single initial seed.
 */
export class RNG {
    /** @private @type {function(number, number, number): number} */
    #noise;
    /** @private @type {function(number, number): number} */
    #rng;

    /**
     * Creates an instance of RNG.
     *
     * @constructor
     * @param {object}  options             - Configuration options for the generator.
     * @param {number}  options.seed        - The master seed for all random generation.
     * @param {number}  options.warp        - The strength of the domain warping effect on the noise.
     * @param {number}  options.shift       - A constant offset applied to all noise coordinates.
     * @param {number}  options.octaves     - The number of noise layers to combine for fractal noise.
     * @param {number}  options.fundamental - The base frequency for the first octave of noise.
     * @param {number}  options.persistence - The factor by which amplitude changes for each successive octave.
     * @param {number}  options.lacunarity  - The factor by which frequency changes for each successive octave.
     * @param {boolean} options.ridgeInvert - If true, inverts the signal for ridge noise, turning valleys into ridges.
     * @param {boolean} options.ridgeSquare - If true, squares the signal for ridge noise, sharpening peaks.
     */
    constructor({
        seed, warp, shift,
        octaves, fundamental,
        persistence, lacunarity,
        ridgeInvert, ridgeSquare,
    }) {
        this.warp = warp;
        this.shift = shift;
        this.octaves = octaves;
        this.fundamental = fundamental;
        this.persistence = persistence;
        this.lacunarity = lacunarity;
        this.ridge = {
            invert: ridgeInvert,
            square: ridgeSquare,
        };

	    this.reseed(seed);
    }

    /**
     * Reseeds the internal pseudo-random number generator (`#rng`).
     *
     * @param {number} [seed=this.seed] - The new seed (defaulting to the current).
     */
    reseed(seed = this.seed) {
        if (seed !== this.seed) {
            this.seed = seed;
            const noise = createNoise2D(createLCG(seed));
	        const warpx = createNoise2D(createLCG(seed + 1));
	        const warpy = createNoise2D(createLCG(seed + 2));
            this.#noise = warpedNoise(noise, warpx, warpy, this.warp, this.shift);
        }

        this.#rng = mkRng(seed);
    }

    ////////////
    // Random //

    /**
     * Returns a pseudo-random floating-point number within the specified range.
     *
     * @param {number} min - The inclusive lower bound of the range.
     * @param {number} max - The exclusive upper bound of the range.
     *
     * @returns {number} A random number such that `min <= result < max`.
     */
    float(min, max) {
        return this.#rng(min, max);
    }

    ///////////
    // Noise //

    /**
     * Calculates fractal noise by summing multiple layers (octaves) of a base noise function.
     *
     * @private
     * @param {number}                                   x                   - The x-coordinate.
     * @param {number}                                   y                   - The y-coordinate.
     * @param {function(number, number, number): number} [noise=this.#noise] - The noise function to layer.
     *
     * @returns {number} The total combined noise value.
     */
    #layeredNoise(x, y, noise = this.#noise) {
        let total = 0;
        let frequency = this.fundamental;
        let amplitude = 1;

        for (let i = 0; i < this.octaves; i++) {
            let octave = noise(x, y, frequency);
            total += octave * amplitude;

            // Update amplitude and frequency for the next octave.
            amplitude *= this.persistence;
            frequency *= this.lacunarity;
        }

        return total;
    }

    /**
     * Returns a fractal simplex noise value for the given coordinates.
     *
     * @param {number} x - The x-coordinate.
     * @param {number} y - The y-coordinate.
     *
     * @returns {number} The simplex noise value.
     */
    simplex(x, y) {
        return this.#layeredNoise(x, y);
    }

    /**
     * Generates "octavian" ridge noise.
     *
     * The ridge transformation is applied to each octave individually before they are summed
     * together.
     * This repeats the ridge patterns at all scales, producing a very "folded" and sharp look.
     * Produces good mountains with discontinuous ridges and distinct peaks but the lower parts look
     * off.
     *
     * @param {number} x - The x-coordinate.
     * @param {number} y - The y-coordinate.
     *
     * @returns {number} The octavian ridge noise value.
     */
    octavianRidge(x, y) {
        return this.#layeredNoise(
            x, y,
            (x, y, frequency) => this.#ridger(this.#noise(x, y, frequency)),
        );
    }

    /**
     * Generates "melodic" ridge noise.
     *
     * The ridge transformation is applied to the final noise signal after the octaves have been
     * layered.
     * Produces sinuous, smooth and continuous ridges but the details are lacking.
     *
     * @param {number} x - The x-coordinate.
     * @param {number} y - The y-coordinate.
     *
     * @returns {number} The melodic ridge noise value.
     */
    melodicRidge(x, y) {
        return this.#ridger(this.simplex(x, y));
    }

    /////////////////////
    // Other utilities //

    /**
     * Applies a ridge transformation to a noise signal.
     *
     * This involves taking the absolute value to create sharp "V" shapes (valleys) and optionally
     * inverting them to create ridges and/or squaring them for more dramatic features.
     *
     * @private
     * @param {number} signal - The input noise signal, typically in the range [-1, 1] but anything will do.
     *
     * @returns {number} The transformed signal.
     */
    #ridger(signal) {
        // Taking the absolute value maps [-1, 1] -> [0, 1] and makes the negative values positive,
        // thus transforming the smooth transition from positive to negative values into a sharp
        // "rebound".
        signal = Math.abs(signal);

        // Inverting the elevation with `1 - signal` makes the rebound occur at the top, creating
        // ridges instead of valleys.
        if (this.ridge.invert) {
            signal = 1.0 - signal;
        }

        // Squaring the signal will emphasize ridges and valleys.
        if (this.ridge.square) {
            signal *= signal;
        }

        return signal;
    }
}
