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

/**
 * Returns a padded height matrix.
 */
function heightMatrix(heights: HeightGenerator, paddedSize: number): Float32Array {
    const sampling = 1 / heights.nblocks;
    const res = new Float32Array(paddedSize * paddedSize);
    for (let i = 0; i < paddedSize; i++) {
        for (let j = 0; j < paddedSize; j++) {
            const x = (i - 1) * sampling; const y = (j - 1) * sampling;
            res[i * paddedSize + j] = heights.at(x, y);
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
    const paddedHeights = heightMatrix(heights, paddedSize);

    // Vertices.
    for (let i = 0; i < verticesPerSide; i++) {
        for (let j = 0; j < verticesPerSide; j++) {
            const height = paddedHeights[(i + 1) * paddedSize + j + 1];
            const idx = (i * verticesPerSide + j) * 3;
            vertices[idx] = i; vertices[idx + 1] = j; vertices[idx + 2] = height;
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

////////////////
// Prism mesh //

/**
 * Creates a box mesh from a height field.
 *
 * @param heights - Terrain data.
 * @param palette - Color palette for height-based interpolation
 * @returns the generated prism mesh.
 */
export function createBoxMesh(heights: HeightGenerator, palette: Palette): THREE.Mesh {
    const { nblocks } = heights;
    const sampling = 1 / nblocks; // Distance between each vertex.

    const positions = [], normals = [], colors = [], indices = [];
    let indexOffset = 0;

    const baseGeometry = new THREE.BoxGeometry().translate(0, 0, 0.5);

    const posAttr = baseGeometry.getAttribute('position');
    const normAttr = baseGeometry.getAttribute('normal');
    const idxAttr = baseGeometry.getIndex();

    for (let i = 0; i < nblocks; i++) {
        for (let j = 0; j < nblocks; j++) {
            const height = heights.at(i * sampling, j * sampling);
            const xPos = i;
            const yPos = j;

            const color = interpolateColors(palette.colors, height);
            const matrix = new THREE.Matrix4().makeScale(1, 1, height).setPosition(xPos, yPos, 0);

            for (let v = 0; v < posAttr.count; v++) {
                const vertex = new THREE.Vector3().fromBufferAttribute(posAttr, v).applyMatrix4(matrix);
                positions.push(vertex.x, vertex.y, vertex.z);
                normals.push(...normAttr.array.slice(v * 3, v * 3 + 3));
                colors.push(color.r, color.g, color.b);
            }

            if (idxAttr) { // Hexagons don't have an index.
                for (let idx = 0; idx < idxAttr.count; idx++) {
                    indices.push(idxAttr.array[idx] + indexOffset);
                }
            } else {
                for (let v = 0; v < posAttr.count; v++) {
                    indices.push(indexOffset + v);
                }
            }
            indexOffset += posAttr.count;
        }
    }

    const mergedGeometry = new THREE.BufferGeometry();
    mergedGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    mergedGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    mergedGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    mergedGeometry.setIndex(indices);

    return new THREE.Mesh(mergedGeometry, new THREE.MeshStandardMaterial({ vertexColors: true }));
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
