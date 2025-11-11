export interface vector2 { x: number; y: number; }
export interface vector3 extends vector2 { z: number }

export class vec2 {
    x: number;
    y: number;
    static zero(): vec2 { return { x: 0, y: 0 } }
}

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
    if (x <= min) return min;
    if (x >= max) return max;
    return x;
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

/**
 * Performs linear interpolation between two numbers.
 *
 * @param left   - The start value.
 * @param right  - The end value.
 * @param factor - The interpolation factor, typically between 0 and 1.
 * @returns the value interpolated between a and b.
 */
export function lerp(left: number, right: number, factor: number): number {
    return left + factor * (right - left);
}

/**
 * Applies a smooth, S-shaped mapping to a value in the unit range [0, 1].
 * Equal to smoothstep, but without the clamping.
 *
 * @param unit - A number between 0 and 1 to be smoothed.
 * @returns a smoothly interpolated value between 0 and 1 that has zero derivative at the endpoints.
 */
export function smoothunit(unit: number): number {
    return unit * unit * (3 - 2 * unit);
}

/**
 * Extract the fractional part of the input number.
 * For example, -1.6 and 2.6 are mapped to 0.6.
 */
export function fracpart(input: number): number {
    input %= 1;
    if (input < 0) input += 1;
    return input;
}

/**
 * Round to the nearest multiple of a number.
 */
export function roundstep(input: number, step: number): number {
    return Math.round(input / step) * step;
}
