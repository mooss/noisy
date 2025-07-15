import * as THREE from 'three';

/**
 * Clamps a number between a minimum and maximum value.
 *
 * @param x   - The number to clamp.
 * @param min - The minimum allowed value.
 * @param max - The maximum allowed value.
 *
 * @returns The clamped number.
 */
export function clamp(x: number, min: number, max: number): number {
    return Math.min(Math.max(x, min), max);
}

/**
 * Interpolates between colors in a palette based on a normalized value.
 *
 * @param colors - The color palette.
 * @param value  - A normalized value (0-1) indicating the interpolation position.
 *
 * @returns The interpolated color.
 */
export function interpolateColors(colors: THREE.Color[], value: number): THREE.Color {
    if (colors.length === 0) return new THREE.Color(1, 1, 1);
    if (colors.length === 1) return colors[0].clone();

    value = clamp(value, 0, 1);

    const nsegments = colors.length - 1;
    // ceil and round can be interesting here.
    const segment = Math.min(Math.floor(value * nsegments), nsegments - 1);
    const color1 = colors[segment];
    const color2 = colors[segment + 1];
    const ratio = value * nsegments - segment;

    return color1.clone().lerp(color2, ratio);
}

/**
 * Creates a function linearly mapping between number ranges.
 *
 * @param fromMin - The minimum value of the input range.
 * @param fromMax - The maximum value of the input range.
 * @param toMin   - The minimum value of the output range.
 * @param toMax   - The maximum value of the output range.
 *
 * @returns A function that maps a number from the input range to the output range.
 */
export function rangeMapper(
    fromMin: number,
    fromMax: number,
    toMin: number,
    toMax: number
): (x: number) => number {
    const fromSub = fromMax - fromMin, toSub = toMax - toMin;
    if (fromSub == 0) return () => toSub / 2;
    return x => toMin + ((x - fromMin) / fromSub) * toSub;
}

/** Deep clones an instance, does not clone private fields. */
export function clone(instance: any) {
    const data = structuredClone(instance);
    const empty = Object.create(instance.constructor.prototype);
    return Object.assign(empty, data);
}
