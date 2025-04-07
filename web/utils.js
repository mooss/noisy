// Linear congruential generator that generates pseudorandom values between 0 and 1.
// This is a hack to get deterministic PRNG since Math.random cannot be seeded.
export function createLCG(seed) {
    const a = 1664525;
    const c = 1013904223;
    const m = Math.pow(2, 32);
    let currentSeed = seed;

    return () => {
        currentSeed = (a * currentSeed + c) % m;
        return currentSeed / m;
    };
}

// Returns a function that will return a random number between given minimum and maximum values.
export function mkRng(seed) {
    let generator = createLCG(seed);
    return (min, max) => generator() * (max - min) + min;
}

// Creates a function mapping between number ranges.
export function rangeMapper(fromMin, fromMax, toMin, toMax) {
    return x => toMin + ((x - fromMin) / (fromMax - fromMin)) * (toMax - toMin);
}

export function clamp(x, min, max) {
    return Math.min(Math.max(x, min), max);
}

// Interpolates between colors in a palette (0-1 normalized value).
export function interpolateColors(colors, value) {
    if (colors.length === 0) return new THREE.Color(1, 1, 1);
    if (colors.length === 1) return colors[0].clone();

    value = THREE.MathUtils.clamp(value, 0, 1);

    const nsegments = colors.length - 1;
    const segment = Math.min(Math.floor(value * nsegments), nsegments - 1);
    const color1 = colors[segment];
    const color2 = colors[segment + 1];
    const ratio = value * nsegments - segment;

    return color1.clone().lerp(color2, ratio);
}
