import * as THREE from 'three';
import type { HeightGenerator } from './height-generator.js';
import { Palette } from './palettes.js';
import { interpolateColors } from './utils/graphics.js';

//////////////////
// Surface mesh //

// Computes the surface indices for a square mesh.
function surfaceIndices(vertexSide: number): Uint16Array | Uint32Array {
    const indexSide = vertexSide - 1; // Length of the side of the indices matrix.
    const vertexCount = vertexSide * vertexSide;
    const quadCount = indexSide * indexSide;
    const length = quadCount * 6;
    const use32 = vertexCount > 65535;
    const indices = use32 ? new Uint32Array(length) : new Uint16Array(length);

    let k = 0; // Running index.
    for (let i = 0; i < indexSide; i++) {
        for (let j = 0; j < indexSide; j++) {
            const topLeft = i * vertexSide + j;
            const topRight = i * vertexSide + (j + 1);
            const bottomLeft = (i + 1) * vertexSide + j;
            const bottomRight = (i + 1) * vertexSide + (j + 1);

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
 * Creates a surface mesh from a height field.
 *
 * @param heights - Terrain data.
 * @param palette - Color palette for height-based interpolation.
 * @returns The generated surface mesh.
 */
export function createSurfaceMesh(heights: HeightGenerator, palette: Palette): THREE.Mesh {
    let { nblocks } = heights;
    const sampling = 1 / nblocks; // Distance between each vertex.
    nblocks += 1; // Create one additional row and column to overlap this mesh and the next one.
    const geometry = new THREE.BufferGeometry();

    const nVertices = 3 * nblocks * nblocks;
    const vertices = new Float32Array(nVertices);
    const colors = new Float32Array(nVertices);

    const paddedSize = (nblocks + 2);
    // A height buffer, with an additional cell on every side to allow for easy computation of
    // normal for vertices at the edge.
    const paddedHeights = new Float32Array(paddedSize * paddedSize);
    for (let i = 0; i < paddedSize; i++) {
        for (let j = 0; j < paddedSize; j++) {
            const x = (i - 1) * sampling; const y = (j - 1) * sampling;
            paddedHeights[i * paddedSize + j] = heights.at(x, y);
        }
    }

    // Vertices and colors.
    for (let i = 0; i < nblocks; i++) {
        for (let j = 0; j < nblocks; j++) {
            const height = paddedHeights[(i + 1) * paddedSize + j + 1];
            const color = interpolateColors(palette, height);
            const idx = (i * nblocks + j) * 3;

            vertices[idx] = i; vertices[idx + 1] = j; vertices[idx + 2] = height;
            colors[idx] = color.r; colors[idx + 1] = color.g; colors[idx + 2] = color.b;
        }
    }

    const posbuffer = new THREE.BufferAttribute(vertices, 3);
    geometry.setAttribute('position', posbuffer);
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setIndex(new THREE.BufferAttribute(surfaceIndices(nblocks), 1));
    geometry.setAttribute('normal', computeVertexNormals(paddedHeights, nblocks));

    const material = new THREE.MeshStandardMaterial({
        vertexColors: true,
        side: THREE.FrontSide,
    });

    return new THREE.Mesh(geometry, material);
}

/**
 * Computes vertex normals for the given height data.
 * Adapted from THREE.BufferGeometry.computeVertexNormals.
 *
 * The reason for all this complexity is that out-of-chunks vertices must be taken into account in
 * order to compute correct normals.
 * Without this, there are visible seams between the chunks.
 *
 * @param paddedHeights - The heights to work on (with 1 additional cell on every side).
 * @param side      - The number of vertices on one side of a square.
 * @returns the computed vertex normals.
 */
function computeVertexNormals(paddedHeights: Float32Array, side: number): THREE.BufferAttribute {
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
 * Creates a hexagonal extruded prism.
 * @param radius - The radius of the hexagon.
 * @param height - The height of the extrusion.
 * @returns The generated geometry.
 */
function _createHexagonGeometry(radius: number, height: number): THREE.ExtrudeGeometry {
    const shape = new THREE.Shape();
    const sides = 6;
    const angle = (2 * Math.PI) / sides;

    shape.moveTo(radius, 0); // The top point.

    // The five remaining points.
    for (let i = 1; i <= sides; i++) {
        const x = radius * Math.cos(angle * i);
        const y = radius * Math.sin(angle * i);
        shape.lineTo(x, y);
    }

    return new THREE.ExtrudeGeometry(shape, {
        steps: 1,
        depth: height,
        bevelEnabled: false
    });
}

/**
 * Creates prism meshes (hexagonal or square) from a height field.
 *
 * @param type    - Shape of the prism ('hexagon' or 'square').
 * @param heights - Terrain data.
 * @param palette - Color palette for height-based interpolation
 * @returns The generated prism mesh.
 */
function createPrismMeshes(type: 'hexagon' | 'square', heights: HeightGenerator, palette: Palette): THREE.Mesh {
    const { nblocks } = heights;
    const sampling = 1 / nblocks; // Distance between each vertex.
    const isHex = type === 'hexagon';
    const ySpacingFactor = isHex ? Math.sqrt(3) / 2 : 1;
    const hexRadius = Math.sqrt(1 / 3);

    const positions = [], normals = [], colors = [], indices = [];
    let indexOffset = 0;

    const baseGeometry = isHex
        ? _createHexagonGeometry(hexRadius, 1).rotateZ(Math.PI / 2)
        : new THREE.BoxGeometry().translate(0, 0, 0.5);

    const posAttr = baseGeometry.getAttribute('position');
    const normAttr = baseGeometry.getAttribute('normal');
    const idxAttr = baseGeometry.getIndex();

    for (let i = 0; i < nblocks; i++) {
        for (let j = 0; j < nblocks; j++) {
            const height = heights.at(i * sampling, j * sampling);
            const xOffset = isHex && (j % 2 !== 0) ? .5 : 0;
            const xPos = i + xOffset;
            const yPos = j * ySpacingFactor;

            const color = interpolateColors(palette, height);
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

export function createHexagonMesh(heights: HeightGenerator, palette: Palette): THREE.Mesh {
    return createPrismMeshes('hexagon', heights, palette);
}

export function createSquareMesh(heights: HeightGenerator, palette: Palette): THREE.Mesh {
    return createPrismMeshes('square', heights, palette);
}
