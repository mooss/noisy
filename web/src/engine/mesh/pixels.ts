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
 * @param resolution    - The resolution of the chunk.
 */
export function fillPixelData(
    positionCache: ReusableBuffer,
    normalCache: ReusableBuffer,
    heightCache: ReusableArray,
    fun: NoiseFun,
    resolution: number,
): void {
    // The height of a pixel is the height in its center so the height function must be shifted by
    // half a cell.
    const halfcell = .5 / resolution;
    const shiftedFun = (x: number, y: number) => fun(x + halfcell, y + halfcell);
    const heights = heightMatrix(
        heightCache, shiftedFun, resolution,
        { up: 0, down: 0, left: 0, right: 0 },
    );

    // Each block has 1 face made of 2 triangles with 3 vertices each (6 vertices total)
    const verticesPerBox = 6;
    const stride = 3;
    const nvertices = resolution * resolution * verticesPerBox;
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
    for (let blockX = 0; blockX < resolution; ++blockX) {
        for (let blockY = 0; blockY < resolution; ++blockY) {
            pixel(blockX, blockY, heights[blockX * resolution + blockY]);

            // All normals point straight up.
            for (const _ of range(6)) {
                normals[idnor++] = 0; normals[idnor++] = 0; normals[idnor++] = 1;
            }
        }
    }
}
