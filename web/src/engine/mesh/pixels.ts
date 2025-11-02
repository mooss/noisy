import { NoiseFun } from "../../noise/foundations.js";
import { range } from "../../utils/iteration.js";
import { heightMatrix } from "./foundations.js";
import { ReusableArray, ReusableBuffer } from "./utils.js";

/**
 * Fills the position and normal buffers for a pixel-based mesh (flat squares without sides).
 *
 * @param positionCache - Cache for storing vertex positions.
 * @param normalCache   - Cache for storing vertex normals.
 * @param heightCache   - Cache for storing height values.
 * @param fun           - The noise function to sample height values from.
 * @param nblocks       - Number of cells in the grid.
 */
export function fillPixelData(
    positionCache: ReusableBuffer,
    normalCache: ReusableBuffer,
    heightCache: ReusableArray,
    fun: NoiseFun,
    nblocks: number,
): void {
    const heights = heightMatrix(
        heightCache, fun, nblocks,
        { up: 0, down: 0, left: 0, right: 0 },
    );

    // Each block has 1 face made of 2 triangles with 3 vertices each (6 vertices total)
    const verticesPerBox = 6;
    const stride = 3;
    const nvertices = nblocks * nblocks * verticesPerBox;
    const positions = positionCache.asFloat32(nvertices, stride);
    const normals = normalCache.asInt8(nvertices, stride);

    const vertex = (x: number, y: number, z: number) => {
        positions[idpos++] = x; positions[idpos++] = y; positions[idpos++] = z;
    }
    const pixel = (x: number, y: number, z: number) => {
        // ABC.
        vertex(x, y, z);
        vertex(x + 1, y, z);
        vertex(x + 1, y + 1, z);

        // ACD.
        vertex(x, y, z);
        vertex(x + 1, y + 1, z);
        vertex(x, y + 1, z);
    }

    let idpos = 0, idnor = 0;
    for (let blockX = 0; blockX < nblocks; ++blockX) {
        for (let blockY = 0; blockY < nblocks; ++blockY) {
            pixel(blockX, blockY, heights[blockX * nblocks + blockY]);

            // All normals point straight up.
            for (const _ of range(6)) {
                normals[idnor++] = 0; normals[idnor++] = 0; normals[idnor++] = 1;
            }
        }
    }
}
