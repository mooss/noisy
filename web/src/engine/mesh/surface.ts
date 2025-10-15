import { NoiseFun } from '../../noise/foundations.js';
import { heightMatrix } from './foundations.js';
import { CachedArray, CachedBuffer } from './utils.js';

//////////////////
// Surface mesh //

/**
 * Fills the position buffer and the height array with vertex positions for a surface mesh.
 *
 * @param positionCache - Cache for storing vertex positions.
 * @param heightCache   - Cache for storing height values.
 * @param fun           - The noise function to sample height values from.
 * @param nblocks       - Number of cells in the grid.
 */
export function fillSurfacePositions(
    positionCache: CachedBuffer,
    heightCache: CachedArray,
    fun: NoiseFun,
    nblocks: number,
): void {
    const verticesPerSide = nblocks + 1;
    const nVertices = verticesPerSide * verticesPerSide;
    const positions = positionCache.asFloat32(nVertices, 3);
    const paddedSize = (verticesPerSide + 2);

    const paddedHeights = heightMatrix(heightCache, fun, nblocks, {
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
            positions[posidx++] = i; positions[posidx++] = j; positions[posidx++] = height;
        }
    }
}

/**
 * Computes the indices for a surface mesh by generating two triangles per quad.
 *
 * @param indexCache - Cache for storing index data.
 * @param verticesPerSide - Number of vertices along one side of the grid.
 */
export function fillSurfaceIndices(indexCache: CachedBuffer, verticesPerSide: number): void {
    const indexSide = verticesPerSide - 1; // Length of the side of the indices matrix.
    const quadCount = indexSide * indexSide;
    const length = quadCount * 6;
    const indices = indexCache.asIndices(length, verticesPerSide * verticesPerSide)

    let k = 0; // Running index.
    for (let i = 0; i < indexSide; i++) {
        for (let j = 0; j < indexSide; j++) {
            const topLeft = i * verticesPerSide + j;
            const topRight = topLeft + 1;
            const bottomLeft = (i + 1) * verticesPerSide + j;
            const bottomRight = bottomLeft + 1;

            indices[k++] = topLeft;
            indices[k++] = bottomLeft;
            indices[k++] = topRight;
            indices[k++] = topRight;
            indices[k++] = bottomLeft;
            indices[k++] = bottomRight;
        }
    }
}

/**
 * Computes vertex normals for a surface mesh.
 * Adapted from THREE.BufferGeometry.computeVertexNormals.
 *
 * The reason for all this complexity is that out-of-chunks vertices must be taken into account in
 * order to compute correct normals.
 * Without this, there are visible seams between the chunks.
 *
 * Performance note: reducing function calls does not work at all.
 *
 * @param normalCache - Cache for storing normal data.
 * @param heights     - The heights to work on (with 1 additional cell on every side).
 * @param side        - Number of vertices along one side of the grid.
 */
export function fillSurfaceNormals(
    normalCache: CachedBuffer, heights: Float32Array, side: number,
): void {
    /////////////////////////
    // Setup and utilities //

    const paddedSide = side + 2;
    const count = side * side;
    const normals = normalCache.asFloat32(count, 3);

    // Get the index corresponding to the given coordinates (returns -1 if out-of-bounds).
    const indexOf = (x: number, y: number): number => {
        if (x >= 0 && x < side && y >= 0 && y < side) {
            return x * side + y;
        }
        return -1;
    };

    // Returns the height at the given grid coordinates, using cache if within bounds.
    const get = (gx: number, gy: number): number => {
        return heights[gx * paddedSide + gy];
    };

    // Accumulate normal values at a given index.
    const add = (i: number, nx: number, ny: number, nz: number) => {
        const k = i * 3;
        normals[k] += nx;
        normals[k + 1] += ny;
        normals[k + 2] += nz;
    };

    // Computes the normals for the given coordinates, pointing at the top-right corner of the quad
    // the normal must be computed on.
    // Takes advantage of the fact that all vertices are on a square grid to avoid cross products.
    const computeFromCoordinates = (x: number, y: number) => {
        const topLeft = indexOf(x, y);
        const topRight = indexOf(x, y + 1);
        const bottomLeft = indexOf(x + 1, y);
        const bottomRight = indexOf(x + 1, y + 1);

        const tlHeight = get(x + 1, y + 1);
        const trHeight = get(x + 1, y + 2);
        const blHeight = get(x + 2, y + 1);
        const brHeight = get(x + 2, y + 2);

        const normal1x = tlHeight - blHeight;
        const normal1y = tlHeight - trHeight;
        const normal2x = trHeight - brHeight;
        const normal2y = blHeight - brHeight;

        // The 1 and 2 constants here are present because of how cross-product works on a
        // regular grid.
        if (topLeft >= 0) add(topLeft, normal1x, normal1y, 1);
        if (topRight >= 0) add(topRight, normal1x + normal2x, normal1y + normal2y, 2);
        if (bottomLeft >= 0) add(bottomLeft, normal1x + normal2x, normal1y + normal2y, 2);
        if (bottomRight >= 0) add(bottomRight, normal2x, normal2y, 1);
    }

    ////////////////////////
    // Actual computation //

    for (let i = -1; i < side; i++)
        for (let j = -1; j < side; j++)
            computeFromCoordinates(i, j);

    // Normalization.
    for (let i = 0; i < count; i++) {
        const k = i * 3;
        const nx = normals[k];
        const ny = normals[k + 1];
        const nz = normals[k + 2];
        const len = Math.hypot(nx, ny, nz);
        normals[k] = nx / len;
        normals[k + 1] = ny / len;
        normals[k + 2] = nz / len;
    }
}
