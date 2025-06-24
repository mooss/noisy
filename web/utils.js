/**
 * Clamps a number between a minimum and maximum value.
 *
 * @param {number} x   - The number to clamp.
 * @param {number} min - The minimum allowed value.
 * @param {number} max - The maximum allowed value.
 *
 * @returns {number} The clamped number.
 */
export function clamp(x, min, max) {
    return Math.min(Math.max(x, min), max);
}

/**
 * Interpolates between colors in a palette based on a normalized value.
 *
 * @param {THREE.Color[]} colors - The color palette.
 * @param {number}        value  - A normalized value (0-1) indicating the interpolation position.
 *
 * @returns {THREE.Color} The interpolated color.
 */
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

/**
 * Creates a function linearly mapping between number ranges.
 *
 * @param {number} fromMin - The minimum value of the input range.
 * @param {number} fromMax - The maximum value of the input range.
 * @param {number} toMin   - The minimum value of the output range.
 * @param {number} toMax   - The maximum value of the output range.
 *
 * @returns {function(number): number} A function that maps a number from the input range to the output range.
 */
export function rangeMapper(fromMin, fromMax, toMin, toMax) {
    const fromSub = fromMax - fromMin, toSub = toMax - toMin;
    return x => toMin + ((x - fromMin) / fromSub) * toSub;
}

/** Deep clones an instance, does not clone private fields. */
export function clone(instance) {
    const data = structuredClone(instance);
    const empty = Object.create(instance.constructor.prototype);
    return Object.assign(empty, data);
}
