import { NoiseFun } from "../../noise/foundations.js";
import { ReusableArray } from "./utils.js";

interface paddingSpec { up?: number; down?: number; left?: number; right?: number }

/**
 * Returns a padded height matrix by sampling a noise function over an extended grid.
 *
 * @param heightCache - Cache for storing resulting height values.
 * @param fun         - The noise function to sample height values from.
 * @param resolution  - The base resolution of the height grid.
 * @param padding     - Amount of up, down, left and right padding to add to the matrix.
 *
 * @returns the padded height matrix.
 */
export function heightMatrix(
    heightCache: ReusableArray, fun: NoiseFun,
    resolution: number, padding?: paddingSpec,
): Float32Array {
    const left = padding?.left || 0;
    const right = padding?.right || 0;
    const up = padding?.up || 0;
    const down = padding?.down || 0;

    const width = resolution + left + right;
    const height = resolution + up + down;
    const sampling = 1 / resolution;
    const res = heightCache.asFloat32(width * height);

    for (let i = 0; i < width; i++) {
        for (let j = 0; j < height; j++) {
            const x = (i - left); const y = (j - down);
            res[i * width + j] = fun(x * sampling, y * sampling);
        }
    }

    return res;
}
