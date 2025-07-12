import { createNoise2D } from 'simplex-noise';

////////////////////
// Free functions //

/**
 * Creates a Linear Congruential Generator (LCG) that produces pseudorandom values between 0 and 1.
 * This provides a deterministic alternative to Math.random() since it can be seeded.
 *
 * @param {number} seed The initial seed value for the generator.
 * @returns {() => number} A function that returns a pseudorandom float (1 <= res < max).
 */
function createLCG(seed) {
    const a = 1664525;
    const c = 1013904223;
    const m = Math.pow(2, 32);
    let currentSeed = seed;

    return () => {
        currentSeed = (a * currentSeed + c) % m;
        return currentSeed / m;
    };
}

/**
 * Returns a function that will generate a random number between given minimum and maximum values,
 * based on a provided seed.
 *
 * @param {number} seed The seed to initialize the pseudorandom number generator.
 * @returns {function(min: number, max: number): number} A function that returns a float (min <= res < max).
 */
export function mkRng(seed) {
    let generator = createLCG(seed);
    return (min, max) => generator() * (max - min) + min;
}

/**
 * Creates a warped simplex noise function.
 *
 * Domain warping displaces the input coordinates using another noise function, hiding linear
 * artifacts.
 * The x-y-frequency calling signature is necessary to accommodate the shift parameter.
 *
 * @param {function(number, number): number} noise    - The base noise function.
 * @param {function(number, number): number} warp     - Noise function for warping.
 * @param {number}                           strength - The magnitude of the warp effect.
 * @returns {function(number, number, number): number} The warped noise function.
 */
function mkWarped(noise, warp, strength) {
	return (x, y) => {
        const wp = warp(x, y);
		return noise(
			x + wp * strength,
			y + wp * strength + 10,
		)
	}
}

/**
 * Creates a simplex noise function with domain warping.
 *
 * @param {number} seed         - The seed to initialize the pseudorandom number generator.
 * @param {number} warpStrength - The magnitude of the warp effect.
 * @returns {function(number, number): number} A function that returns simplex noise at (x,y).
 */
export function mkSimplex(seed, warpStrength) {
    const noise = createNoise2D(createLCG(seed));
	const warpx = createNoise2D(createLCG(seed + 1));
    return mkWarped(noise, warpx, warpStrength);
}

/**
 * Creates a function that transforms a noise signal into ridges.
 *
 * @param {boolean} invert - Whether to invert the signal to create ridges instead of valleys.
 * @param {boolean} square - Whether to square the signal to emphasize ridges/valleys.
 * @returns {function(number): number} A function that transforms a noise signal.
 */
export function mkRidger(invert, square) {
    return (signal) => {
        // Taking the absolute value maps [-1, 1] -> [0, 1] and makes the negative values positive,
        // thus transforming the smooth transition from positive to negative values into a sharp
        // "rebound".
        signal = Math.abs(signal);

        // Squaring the signal will emphasize ridges and valleys.
        if (square) {
            signal *= signal;
        }

        // Inverting the elevation makes the rebound occur at the top, creating ridges instead of
        // valleys.
        if (invert) {
            signal = - signal;
        }

        return signal;
    }
}

/**
 * Creates a function that layers multiple octaves of noise.
 *
 * @param {function(number, number): number} noise       - The base noise function.
 * @param {number}                           octaves     - Number of octaves to layer.
 * @param {number}                           fundamental - Base frequency for noise.
 * @param {number}                           persistence - Amplitude reduction per octave.
 * @param {number}                           lacunarity  - Frequency increase per octave.
 * @returns {function(number, number): number} A function that returns layered noise at (x,y).
 */
export function mkLayering(noise, octaves, fundamental, persistence, lacunarity) {
    return (x, y) => {
        let total = 0;
        let frequency = fundamental;
        let amplitude = 1;

        for (let oct = 0; oct < octaves; oct++) {
            // The noise is shifted with the octave index to avoid the artifact that occurs at the
            // origin when layering noise.
            // This artifact is probably due to the fact that the same base noise value is
            // accumulated at the origin, thus reinforcing the directionality that can occur in raw
            // noise.
            // I don't know where this idea that simplex has no directional artifacts because they
            // are very much visible in this project.
            let octave = noise(x * frequency + oct, y * frequency + oct + 10);
            total += octave * amplitude;

            // Update amplitude and frequency for the next octave.
            amplitude *= persistence;
            frequency *= lacunarity;
        }

        return total;
    }
}

export function highMix(lowgen, highgen, low=.25, high=.75, mid=(low+high)/2) {
    const range = high - low;
    return (x, y) => {
        let highval = highgen(x, y); // In [0, 1].
        if (highval > high) return highval; // In ]high, 1], fully the high range.
        // highval is in [0, high].

        let lowval = lowgen(x, y) * mid; // In [0, mid].
        if (highval < low) return lowval;

        // highval is in [low, high], between the high and low range, interpolation required.
        const factor = (highval - low) / range; // In [0, 1].
        highval = factor * high;
        lowval = (1 - factor) * lowval;

        return highval + lowval; // In [0, high].
    }
}
