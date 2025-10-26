import { NoiseFun } from "../../noise/foundations.js";
import { heightMatrix } from './foundations.js';
import { ReusableArray } from './utils.js';

export function fillSurfaceHeights(
    displacementHeightCache: ReusableArray,
    paddedHeightCache: ReusableArray,
    fun: NoiseFun,
    resolution: number,
): void {
    const verticesPerSide = resolution + 1;
    const nVertices = verticesPerSide * verticesPerSide;
    const displacementHeights = displacementHeightCache.asFloat32(nVertices * 3);
    const paddedSize = (verticesPerSide + 2);

    const paddedHeights = heightMatrix(paddedHeightCache, fun, resolution, {
        up: 1, // Edge vertex for normal computation.
        down: 2, // Edge vertex and complementary line.
        left: 1, // Edge vertex.
        right: 2, // Edge vertex and complementary column.
    });

    // Vertices.
    let posidx = 0;
    for (let i = 0; i < verticesPerSide; i++) {
        for (let j = 0; j < verticesPerSide; j++) {
            const height = paddedHeights[(i + 1) * paddedSize + j + 1];
            displacementHeights[posidx++] = height;
        }
    }
}
