import { NoiseFun } from '../../noise/foundations.js';
import { heightMatrix } from './foundations.js';
import { ReusableArray, ReusableBuffer } from './utils.js';

//////////////////
// Surface mesh //

/**
 * Fills the position buffer and the height array with vertex positions for a surface mesh.
 *
 * @param positionCache - Cache for storing vertex positions.
 * @param heightCache   - Cache for storing height values.
 * @param fun           - The noise function to sample height values from.
 * @param resolution    - Number of cells on one side of the grid.
 */
export function fillSurfacePositions(
    positionCache: ReusableBuffer,
    heightCache: ReusableArray,
    fun: NoiseFun,
    resolution: number,
): void {
    const verticesPerSide = resolution + 1;
    const nVertices = verticesPerSide * verticesPerSide;
    const positions = positionCache.asFloat32(nVertices, 3);
    const paddedSize = (verticesPerSide + 2);

    const paddedHeights = heightMatrix(heightCache, fun, resolution, {
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
 * Fills the positions, normals and UVs corresponding to a plane.
 *
 * @param positionCache - Cache for storing vertex positions.
 * @param normalCache   - Cache for storing vertex normals.
 * @param uvCache       - Cache for storing texture coordinates.
 * @param resolution    - Number of cells on one side of the plane.
 */
export function fillPlaneVertices(
    positionCache: ReusableBuffer,
    normalCache: ReusableBuffer,
    uvCache: ReusableBuffer,
    resolution: number,
): void {
    const verticesPerSide = resolution + 1;
    const nVertices = verticesPerSide * verticesPerSide;
    const positions = positionCache.asFloat32(nVertices, 3);
    const normals = normalCache.asFloat32(nVertices, 3);
    const uvs = uvCache.asFloat32(nVertices, 2);
    let uvf = 1 / resolution; // uv scaling factor to normalize them.

    let posidx = 0; let uvidx = 0;
    for (let i = 0; i < verticesPerSide; i++) {
        for (let j = 0; j < verticesPerSide; j++) {
            normals[posidx] = 0; positions[posidx++] = i;
            normals[posidx] = 0; positions[posidx++] = j;
            normals[posidx] = 1; positions[posidx++] = 0;

            // Not sure why, but x and y must be flipped in the UV.
            uvs[uvidx++] = uvf * j; uvs[uvidx++] = uvf * i;
        }
    }
}

/**
 * Computes the indices for a surface mesh by generating two triangles per quad.
 *
 * @param indexCache - Cache for storing index data.
 * @param resolution - Resolution of the chunk.
 */
export function fillSurfaceIndices(indexCache: ReusableBuffer, resolution: number): void {
    const verticesPerSide = resolution + 1;
    const length = resolution * resolution * 6; // 6 points per quad.
    const indices = indexCache.asIndices(length, verticesPerSide * verticesPerSide)

    let k = 0; // Running index.
    for (let i = 0; i < resolution; i++) {
        for (let j = 0; j < resolution; j++) {
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
 * @param normalCache  - Cache for storing normal data.
 * @param heights      - The heights to work on (with 1 additional cell on every side).
 * @param resolution   - Resolution of the chunk.
 * @param includeAlpha - Whether to include a fourth channel initialized to 0.
 */
export function fillSurfaceNormals(
    normalCache: ReusableArray, heights: Float32Array,
    resolution: number, includeAlpha = false,
): void {
    /////////////////////////
    // Setup and utilities //

    const side = resolution + 1;
    const paddedSide = side + 2;
    const count = side * side;
    const stride = includeAlpha ? 4 : 3;
    const normals = normalCache.asFloat32(count * stride);

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
        const k = i * stride;
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
        const k = i * stride;
        const nx = normals[k];
        const ny = normals[k + 1];
        const nz = normals[k + 2];
        const fac = 1 / Math.hypot(nx, ny, nz);
        normals[k] = nx * fac;
        normals[k + 1] = ny * fac;
        normals[k + 2] = nz * fac;
        if (includeAlpha) normals[k + 3] = 1;
        // console.log(':XYZ', normals[k], normals[k+1], normals[k+2]);
    }
}

// For gently rolling terrain the Z-component of a real surface normal is almost 1:

// n = (–dh/dx, –dh/dy, 1) / √(1 + (dh/dx)² + (dh/dy)²).

// With a height-scale of one unit the derivatives are usually < 0.1, so after normalizing you get Z ≈ 1.

// That is exactly what you are printing. Nothing in the code is wrong.

// Two common ways to get rid of the “almost-one” channel:

// 1. **Store X and Y, derive Z at run time**  
//    Texture: X,Y (RG, L16, BC4, …)  
//    Shader:  
//    ```glsl
//    vec2 xy = tex.normal.xy;
//    float z = sqrt(max(0.0, 1.0 - dot(xy,xy)));   // reconstruct Z
//    vec3 N  = vec3(xy, z);
//    ```

// 2. **Octahedron encoding**  
//    Two 8-bit channels encode every normal, loss of accuracy is about the same, Z is never stored.

// Pick whichever fits your texture/memory budget; both completely eliminate the constant “.999 Z” channel.

/**
 * Same as fillSurfaceNormals but packs the normals into an Uint8Array in [0…255]
 * so the result can be fed straight into a THREE.DataTexture with format=THREE.RGBAFormat,
 * type=THREE.UnsignedByteType and used as a normal map (standard tangent-space encoding).
 *
 * The alpha channel is always filled with 255 and the normal components are
 * remapped from [-1…1] to [0…255].
 */
export function fillSurfaceNormalMap(
    normalMapCache: ReusableArray,
    heights: Float32Array,
    resolution: number,
): void {
    const side = resolution + 1;
    const count = side * side;
    const map = normalMapCache.asUint16(count * 4); // RGBA always

    // Re-use the exact same math as fillSurfaceNormals
    const stride = 4;
    const normals = new Float32Array(count * stride);
    normals.fill(0);

    const paddedSide = side + 2;

    const indexOf = (x: number, y: number): number =>
        (x >= 0 && x < side && y >= 0 && y < side) ? x * side + y : -1;

    const get = (gx: number, gy: number): number => heights[gx * paddedSide + gy];

    const add = (i: number, nx: number, ny: number, nz: number) => {
        const k = i * stride;
        normals[k] += nx;
        normals[k + 1] += ny;
        normals[k + 2] += nz;
    };

    const computeFromCoordinates = (x: number, y: number) => {
        const topLeft = indexOf(x, y);
        const topRight = indexOf(x, y + 1);
        const bottomLeft = indexOf(x + 1, y);
        const bottomRight = indexOf(x + 1, y + 1);

        const tl = get(x + 1, y + 1);
        const tr = get(x + 1, y + 2);
        const bl = get(x + 2, y + 1);
        const br = get(x + 2, y + 2);

        const n1x = tl - bl;
        const n1y = tl - tr;
        const n2x = tr - br;
        const n2y = bl - br;

        if (topLeft >= 0) add(topLeft, n1x, n1y, 1);
        if (topRight >= 0) add(topRight, n1x + n2x, n1y + n2y, 2);
        if (bottomLeft >= 0) add(bottomLeft, n1x + n2x, n1y + n2y, 2);
        if (bottomRight >= 0) add(bottomRight, n2x, n2y, 1);
    };

    for (let i = -1; i < side; ++i)
        for (let j = -1; j < side; ++j)
            computeFromCoordinates(i, j);

    // Normalize and pack
    for (let i = 0; i < count; ++i) {
        const k = i * stride;
        const nx = normals[k];
        const ny = normals[k + 1];
        const nz = normals[k + 2];
        const inv = 1 / Math.hypot(nx, ny, nz);
        // console.log(':XYZ', nx, ny, nz);

        // [-1…1]  ->  [0…255]
        // map[k] = Math.round((nx * inv + 1) * 127.5);
        // map[k + 1] = Math.round((ny * inv + 1) * 127.5);
        // map[k + 2] = Math.round((nz * inv + 1) * 127.5);
        map[k] = Math.round((nx * inv + 1) * 127.5);
        map[k + 1] = Math.round((ny * inv + 1) * 127.5);
        map[k + 2] = Math.round((nz * inv + 1) * 127.5);
        // console.log(':XYZ', map[k], map[k+1], map[k+2]);
        map[k + 3] = 255; // full opacity
    }
}
