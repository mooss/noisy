import { NoiseFun } from "../../noise/foundations.js";
import { ReusableArray } from "./utils.js";

interface paddingSpec { up: number; down: number; left: number; right: number }

/**
 * Returns a padded height matrix by sampling a noise function over an extended grid.
 *
 * @param heightCache - Cache for storing resulting height values.
 * @param fun         - The noise function to sample height values from.
 * @param nblocks     - Number of cells in the grid.
 * @param padding     - Amount of up, down, left and right padding to add to the matrix.
 *
 * @returns the padded height matrix.
 */
export function heightMatrix(
    heightCache: ReusableArray, fun: NoiseFun,
    nblocks: number, padding: paddingSpec,
): Float32Array {
    const width = nblocks + padding.left + padding.right;
    const height = nblocks + padding.up + padding.down;
    const sampling = 1 / nblocks;
    const res = heightCache.asFloat32(width * height);

    for (let i = 0; i < width; i++) {
        for (let j = 0; j < height; j++) {
            const x = (i - padding.left); const y = (j - padding.down);
            res[i * width + j] = fun(x * sampling, y * sampling);
        }
    }

    return res;
}
