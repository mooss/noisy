type NoiseFun = (x: number, y: number) => number;

////////////////////
// Free functions //

/**
 * Creates a Linear Congruential Generator (LCG) that produces pseudorandom values between 0 and 1.
 * This provides a deterministic alternative to Math.random() since it can be seeded.
 *
 * @param seed The initial seed value for the generator.
 * @returns A function that returns a pseudorandom float (1 <= res < max).
 */
export function createLCG(seed: number): () => number {
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
 * @param seed The seed to initialize the pseudorandom number generator.
 * @returns A function that returns a float (min <= res < max).
 */
export function mkRng(seed: number): (min: number, max: number) => number {
    let generator = createLCG(seed);
    return (min, max) => generator() * (max - min) + min;
}

/**
 * Creates a function that transforms a noise signal into ridges.
 *
 * @param invert - Whether to invert the signal to create ridges instead of valleys.
 * @param square - Whether to square the signal to emphasize ridges/valleys.
 * @returns A function that transforms a noise signal.
 */
export function mkRidger(
    invert: boolean,
    square: boolean
): (signal: number) => number {
    return (signal: number) => {
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
            signal = 1 - signal;
        }

        return signal;
    }
}

export function highMix(
    bass: NoiseFun,
    treble: NoiseFun,
    low: number = .25,
    high: number = .75,
    mid: number = (low+high)/2,
): NoiseFun {
    const range = high - low;
    return (x: number, y: number) => {
        let highval = treble(x, y); // In [0, 1].
        if (highval > high) return highval; // In ]high, 1], fully the high range.
        // highval is in [0, high].

        let lowval = bass(x, y) * mid; // In [0, mid].
        if (highval < low) return lowval;

        // highval is in [low, high], between the high and low range, interpolation required.
        const factor = (highval - low) / range; // In [0, 1].
        highval = factor * high;
        lowval = (1 - factor) * lowval;

        return highval + lowval; // In [0, high].
    }
}
