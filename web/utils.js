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

// Attempts to fetch the value of a nested dot-separated key in dict.
export function nestedValue(dict, key) {
    const parts = key.split('.');
    for (let i = 0; i < parts.length - 1; i++) {
        if (dict === undefined || dict === null || typeof dict !== 'object' || Array.isArray(dict)) {
            throw new Error(`Cannot access property '${parts[i]}' of undefined, null, or non-object. Path: '${parts.slice(0, i).join('.')}'`);
        }
        dict = dict[parts[i]];
    }

    return {
        dict: dict,
        key: parts[parts.length-1],
        get() { return this.dict[this.key]; },
        set(value) { this.dict[this.key] = value; }
    };
}
