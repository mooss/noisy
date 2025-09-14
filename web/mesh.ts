import * as THREE from 'three';
import type { HeightGenerator } from './height-generator.js';
import { Palette } from './palettes.js';
import { interpolateColors } from './utils/graphics.js';

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

// Computes the surface indices for a square mesh.
function surfaceIndices(size: number): number[] {
    const indices = [];
    for (let i = 0; i < size - 1; i++) {
        for (let j = 0; j < size - 1; j++) {
            const topLeft = i * size + j;
            const topRight = i * size + (j + 1);
            const bottomLeft = (i + 1) * size + j;
            const bottomRight = (i + 1) * size + (j + 1);

            indices.push(topLeft, bottomLeft, topRight);
            indices.push(topRight, bottomLeft, bottomRight);
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

    const vertices = [];
    const colors = [];

    // Vertices and colors.
    for (let i = 0; i < nblocks; i++) {
        for (let j = 0; j < nblocks; j++) {
            const x = i * sampling; const y = j * sampling;

            const height = heights.at(x, y);
            vertices.push(i, j, height);

            const color = interpolateColors(palette, height);
            colors.push(color.r, color.g, color.b);
        }
    }

    const posbuffer = new THREE.BufferAttribute(new Float32Array(vertices), 3);
    geometry.setAttribute('position', posbuffer);
    geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3));
    geometry.setIndex(surfaceIndices(nblocks));
    geometry.setAttribute('normal', computeSquareNormals(posbuffer, nblocks, heights));

    const material = new THREE.MeshStandardMaterial({
        vertexColors: true,
        side: THREE.FrontSide,
    });

    return new THREE.Mesh(geometry, material);
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

/**
 * Computes vertex normals for the given vertex data.
 * Adapted from THREE.BufferGeometry.computeVertexNormals.
 *
 * The reason for all this complexity is that out-of-chunks vertices must be taken into account in
 * order to compute correct normals.
 * Without this, there are visible seams between the chunks.
 *
 * @param positions - The vertices to work on (acting as the cache).
 * @param side      - The number of vertices on one side of a square.
 * @param height    - The height generator used for out-of-cache vertices.
 * @returns the computed vertex normals.
 */
function computeSquareNormals(
    positions: THREE.BufferAttribute, side: number, heights: HeightGenerator,
): THREE.BufferAttribute {
    /////////////////////////
    // Setup and utilities //

    const sampling = 1 / (side - 1); // -1 to compensate for the overlap increment.
    const normals = new THREE.BufferAttribute(new Float32Array(positions.count * 3), 3);
    const pA = new THREE.Vector3(), pB = new THREE.Vector3(), pC = new THREE.Vector3();
    const nA = new THREE.Vector3(), nB = new THREE.Vector3(), nC = new THREE.Vector3();
    const cb = new THREE.Vector3(), ab = new THREE.Vector3();

    // Get the index corresponding to the given coordinates (returns null if out-of-bounds).
    const indexOf = (x: number, y: number): number | null => {
        if (x >= 0 && x < side && y >= 0 && y < side) {
            return x * side + y;
        }
        return null;
    };

    // Returns the height at the given grid coordinates, using cache if within bounds.
    const get = (gx: number, gy: number): number => {
        if (gx >= 0 && gx < side && gy >= 0 && gy < side) {
            const idx = (gx * side + gy) * 3 + 2;
            return positions.array[idx];
        }
        return heights.at(gx * sampling, gy * sampling);
    };

    const setFromCoordinates = (dest: THREE.Vector3, x: number, y: number) => {
        dest.x = x;
        dest.y = y;
        dest.z = get(x, y);
    };

    // Computes the normals for the current pA, pB and pC, but only adds to valid indices.
    const compute = (a: number | null, b: number | null, c: number | null) => {
        // Compute face normal.
        cb.subVectors(pC, pB);
        ab.subVectors(pA, pB);
        cb.cross(ab);

        const count = normals.count;

        if (a !== null && a >= 0 && a < count) {
            nA.fromBufferAttribute(normals, a).add(cb);
            normals.setXYZ(a, nA.x, nA.y, nA.z);
        }
        if (b !== null && b >= 0 && b < count) {
            nB.fromBufferAttribute(normals, b).add(cb);
            normals.setXYZ(b, nB.x, nB.y, nB.z);
        }
        if (c !== null && c >= 0 && c < count) {
            nC.fromBufferAttribute(normals, c).add(cb);
            normals.setXYZ(c, nC.x, nC.y, nC.z);
        }
    };

    // Computes the normals for the given coordinates, pointing at the top-right corner of the quad
    // the normal must be computed on.
    const computeFromCoordinates = (x: number, y: number) => {
        // Get valid indices (null if out-of-bounds).
        const topLeft = indexOf(x, y);
        const topRight = indexOf(x, y + 1);
        const bottomLeft = indexOf(x + 1, y);
        const bottomRight = indexOf(x + 1, y + 1);

        // First triangle: topLeft, bottomLeft, topRight.
        setFromCoordinates(pA, x, y);        // Top left
        setFromCoordinates(pB, x + 1, y);    // Bottom left
        setFromCoordinates(pC, x, y + 1);    // Top right
        compute(topLeft, topRight, bottomLeft);

        // Second triangle: topRight, bottomRight, bottomLeft.
        setFromCoordinates(pA, x, y + 1);        // Top right
        setFromCoordinates(pC, x + 1, y + 1);    // Bottom right
        // pB remains bottom left.
        compute(topRight, bottomLeft, bottomRight);
    };

    ////////////////////////
    // Actual computation //

    for (let i = -1; i < side; i++)
        for (let j = -1; j < side; j++)
            computeFromCoordinates(i, j);

    normalizeBufferAttribute(normals);
    normals.needsUpdate = true;
    return normals;
}

function normalizeBufferAttribute(buffer: THREE.BufferAttribute) {
    const _vec = new THREE.Vector3();
    for (let i = 0, ilen = buffer.count; i < ilen; i++) {
        _vec.fromBufferAttribute(buffer, i);
        _vec.normalize();
        buffer.setXYZ(i, _vec.x, _vec.y, _vec.z);
    }
}
