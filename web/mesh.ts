import * as THREE from 'three';
import type { HeightGenerator } from './height-generator.js';
import { Palette } from './palettes.js';
import { interpolateColors } from './utils/graphics.js';

function allocateIndexArray(nindices: number, nvertices: number = null): Uint16Array | Uint32Array {
    const use32 = nvertices === null || nvertices > 65535;
    return use32 ? new Uint32Array(nindices) : new Uint16Array(nindices);
}

//////////////////
// Surface mesh //

/* Computes the surface indices for a square mesh. */
function surfaceIndices(verticesPerSide: number): Uint16Array | Uint32Array {
    const indexSide = verticesPerSide - 1; // Length of the side of the indices matrix.
    const quadCount = indexSide * indexSide;
    const length = quadCount * 6;
    const indices = allocateIndexArray(length, verticesPerSide * verticesPerSide);

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

    return indices;
}

interface paddingSpec { up: number; down: number; left: number; right: number }

/**
 * Returns a padded height matrix.
 */
function heightMatrix(
    heights: HeightGenerator, coreSize: number, padding: paddingSpec,
): Float32Array {
    const width = coreSize + padding.left + padding.right;
    const height = coreSize + padding.up + padding.down;
    const sampling = 1 / heights.nblocks;
    const res = new Float32Array(width * height);
    for (let i = 0; i < width; i++) {
        for (let j = 0; j < height; j++) {
            const x = (i - padding.left); const y = (j - padding.down);
            res[i * width + j] = heights.at(x * sampling, y * sampling);
        }
    }

    return res;
}

/**
 * Creates a surface mesh from a height field.
 *
 * @param heights - Terrain data.
 * @param palette - Color palette for height-based interpolation.
 * @returns The surface mesh.
 */
export function createSurfaceMesh(heights: HeightGenerator, palette: Palette): THREE.Mesh {
    const verticesPerSide = heights.nblocks + 1; // Number of vertices on one side of the grid.
    const nVertices = 3 * verticesPerSide * verticesPerSide;
    const vertices = new Float32Array(nVertices);
    const paddedSize = (verticesPerSide + 2);

    // Height buffer with additional cells on every side for edge vertex normal computation.
    const paddedHeights = heightMatrix(heights, verticesPerSide, { up: 1, down: 1, left: 1, right: 1 });

    // Vertices.
    let vid = 0;
    for (let i = 0; i < verticesPerSide; i++) {
        for (let j = 0; j < verticesPerSide; j++) {
            const height = paddedHeights[(i + 1) * paddedSize + j + 1];
            vertices[vid++] = i; vertices[vid++] = j; vertices[vid++] = height;
        }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(new THREE.BufferAttribute(surfaceIndices(verticesPerSide), 1));
    geometry.setAttribute('normal', computeSurfaceNormals(paddedHeights, verticesPerSide));
    return new THREE.Mesh(geometry, paletteShader(palette));
}

/**
 * Computes vertex normals for the given height data.
 * Adapted from THREE.BufferGeometry.computeVertexNormals.
 *
 * The reason for all this complexity is that out-of-chunks vertices must be taken into account in
 * order to compute correct normals.
 * Without this, there are visible seams between the chunks.
 *
 * Performance note: reducing function calls does not work at all.
 *
 * @param paddedHeights - The heights to work on (with 1 additional cell on every side).
 * @param side          - The number of vertices on one side of a square.
 * @returns the computed vertex normals.
 */
function computeSurfaceNormals(paddedHeights: Float32Array, side: number): THREE.BufferAttribute {
    /////////////////////////
    // Setup and utilities //

    const paddedSide = side + 2;
    const count = side * side;
    const normals = new Float32Array(count * 3);

    // Get the index corresponding to the given coordinates (returns -1 if out-of-bounds).
    const indexOf = (x: number, y: number): number => {
        if (x >= 0 && x < side && y >= 0 && y < side) {
            return x * side + y;
        }
        return -1;
    };

    // Returns the height at the given grid coordinates, using cache if within bounds.
    const get = (gx: number, gy: number): number => {
        return paddedHeights[gx * paddedSide + gy];
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

    const res = new THREE.BufferAttribute(normals, 3);
    res.needsUpdate = true;
    return res;
}

//////////////
// Box mesh //

export function createBoxMesh(heights: HeightGenerator, palette: Palette): THREE.Mesh {
    // The mesh from one box requires only 3 faces:
    //  - F1, the top face (dcgh).
    //  - F2, the right face (efgc).
    //  - F3, the down face (abcd).
    //
    // It is necessary to get the heights from the adjacent boxes (the right and down boxes) for the
    // z value of a, b, e and f.
    //
    //        Top box
    //           v
    //        h------g
    //       /      /|
    //      /  F1  / |
    //     /      /  |
    //    /      /   |
    //   d------c    |
    //   |      | F3 f------*
    //   |  F2  |   /      /|
    //   a------b  /      / |
    //  /      /| /      /  ⋮
    // *------* |/      /
    // |      | e------*     < Right box
    // |      | |      |
    // ⋮      ⋮ |      |
    //     ^    ⋮      ⋮
    // Down box


    // Since each block needs the heights of the neighboring down and right blocks,
    //  - Each block needs the heights of 3 blocks to construct all its faces.
    //    So it's pertinent to store a height matrix since computing heights can be somewhat
    //    expensive.
    //  - Some out-of-chunk heights are needed (in the right column and in the down row).
    //    Which means that the height matrix needs an additional row and column.
    const heightCache = heightMatrix(heights, heights.nblocks, { up: 0, down: 1, left: 0, right: 1 });
    const heightSide = heights.nblocks + 1;

    // Each block has 3 faces made of 2 triangles with 3 vertices each.
    // This means 18 vertices per box and 18 * nblocks vertices per side.
    const verticesPerBox = 18;
    const stride = 3; // Number of components of one vertex (xyz for both positions and normals).
    const nvertices = heights.nblocks * heights.nblocks * verticesPerBox;
    const positions = new Float32Array(nvertices * stride);
    const normals = new Float32Array(nvertices * stride);

    let idver = 0, idnor = 0;
    for (let blockX = 0; blockX < heights.nblocks; ++blockX) {
        for (let blockY = 0; blockY < heights.nblocks; ++blockY) {
            const adhx = blockX;
            const bcefgx = blockX + 1;
            const abcdey = blockY;
            const fghy = blockY + 1;
            const topz = heightCache[blockX * heightSide + blockY + 1];
            const downz = heightCache[blockX * heightSide + blockY];
            const rightz = heightCache[(blockX + 1) * heightSide + blockY + 1];

            const position = (x: number, y: number, z: number) => {
                positions[idver++] = x; positions[idver++] = y; positions[idver++] = z;
            }
            const a = () => position(adhx, abcdey, downz);
            const b = () => position(bcefgx, abcdey, downz);
            const c = () => position(bcefgx, abcdey, topz);
            const d = () => position(adhx, abcdey, topz);
            const e = () => position(bcefgx, abcdey, rightz);
            const f = () => position(bcefgx, fghy, rightz);
            const g = () => position(bcefgx, fghy, topz);
            const h = () => position(adhx, fghy, topz);

            // Normals for a face (2 triangles * 3 vertices).
            const normal = (x: number, y: number, z: number) => {
                normals[idnor++] = x; normals[idnor++] = y; normals[idnor++] = z;
                normals[idnor++] = x; normals[idnor++] = y; normals[idnor++] = z;
                normals[idnor++] = x; normals[idnor++] = y; normals[idnor++] = z;
                normals[idnor++] = x; normals[idnor++] = y; normals[idnor++] = z;
                normals[idnor++] = x; normals[idnor++] = y; normals[idnor++] = z;
                normals[idnor++] = x; normals[idnor++] = y; normals[idnor++] = z;
            }
            // Normals are trivial to compute because everything is facing only one direction.
            const top = () => normal(0, 0, 1);
            const bottom = () => normal(0, 0, -1);
            const left = () => normal(-1, 0, 0);
            const right = () => normal(1, 0, 0);
            const up = () => normal(0, -1, 0);

            // Top face.
            c(); g(); h();
            c(); h(); d();
            top();

            // Right face.
            c(); e(); f();
            c(); f(); g();
            topz > rightz ? right() : left();

            // Down face.
            a(); b(); c();
            a(); c(); d();
            topz > downz ? bottom() : up();
        }
    }

    const posbuffer = new THREE.BufferAttribute(positions, stride);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', posbuffer);
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    return new THREE.Mesh(geometry, paletteShader(palette));
}

/////////////
// Shaders //

/**
 * Create a mesh material that interpolates colors from height in the shaders by storing the color
 * palette in a texture.
 */
function paletteShader(palette: Palette): THREE.MeshStandardMaterial {
    // The color palette is stored as a texture.
    const paletteTex = new THREE.DataTexture(
        palette.toArray(),
        palette.size, // Width.
        1,            // Height.
        THREE.RGBAFormat,
        THREE.FloatType,
    );
    paletteTex.needsUpdate = true;
    paletteTex.magFilter = THREE.LinearFilter;
    paletteTex.minFilter = THREE.LinearMipMapLinearFilter;
    paletteTex.wrapS = THREE.ClampToEdgeWrapping;

    // The shader created by THREE.js contains a lot of useful things so it is simpler for now to
    // inject additional instructions rather than to write a shader from scratch.
    const material = new THREE.MeshStandardMaterial();
    material.onBeforeCompile = shader => {
        // Vertex shader: forward the vertex height to the fragment shader.
        const vertexWithMeshPosition = shader.vertexShader.replace(
            `#include <begin_vertex>`,
            `#include <begin_vertex>
v_z = position.z;`
        );
        shader.vertexShader = `varying float v_z;
${vertexWithMeshPosition}`;

        // Fragment shader: smoothly interpolate the color from the height using the palette.
        // Without this, the transition between two colors is too fast, which is particularly
        // visible with a bicolor palette.
        const injectColor = `#include <color_fragment>
vec2 colorIdx = vec2(mix(0.5 / u_paletteWidth, 1.0 - 0.5 / u_paletteWidth, v_z), 0.5);
diffuseColor.rgb = texture2D(u_palette, colorIdx).rgb;`
        const fragmentWithColor = shader.fragmentShader.replace('#include <color_fragment>', injectColor);
        shader.uniforms.u_palette = { value: paletteTex };
        shader.uniforms.u_paletteWidth = { value: palette.size };
        shader.fragmentShader = `uniform sampler2D u_palette;

uniform float u_paletteWidth;
varying float v_z;
${fragmentWithColor}`;
    };

    return material;
}
