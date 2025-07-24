import * as THREE from 'three';
import { clamp } from './maths.js';

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
