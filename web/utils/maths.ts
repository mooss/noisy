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
