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
    geometry.setAttribute('normal', computeSquareNormals(posbuffer, nblocks));

    const material = new THREE.MeshStandardMaterial({
        vertexColors: true,
        side: THREE.FrontSide,
        // Shading is clunky because the vertices at the edge of a mesh don't take into account
        // vertices from the neighboring chunk and therefore have incorrect normal data which makes
        // the seams very visible.
        //
        // Using flat shading has a pretty interesting old-school effect, so it can stay like that
        // for now.
        // The seams are still visible, but much less.
        //
        // Should shading be desirable in the future, it shouldn't be too hard to compute normals
        // manually by taking inspiration from `computeVertexNormals` at https://github.com/mrdoob/three.js/blob/64b50b0910427c1bbeae01888ddc5be896dae227/src/core/BufferGeometry.js#L975.
        flatShading: true,
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
 * Adapted from THREE.BufferGeometry.computeVertexNormals
 *
 * @param positions - The vertices to work on.
 * @param side      - The number of vertices on one side of a square.
 * @returns the computed vertex normals.
 */
function computeSquareNormals(positions: THREE.BufferAttribute, side: number): THREE.BufferAttribute {
    const normals = new THREE.BufferAttribute(new Float32Array(positions.count * 3), 3);
    const pA = new THREE.Vector3(), pB = new THREE.Vector3(), pC = new THREE.Vector3();
    const nA = new THREE.Vector3(), nB = new THREE.Vector3(), nC = new THREE.Vector3();
    const cb = new THREE.Vector3(), ab = new THREE.Vector3();

    const setFromIndex = (dest: THREE.Vector3, idx: number) => {
        dest.fromBufferAttribute(positions, idx);
    }

    // Compute the normals for the triangle vertices at index a, b, and c.
    const compute = (a: number, b: number, c: number) => {
        setFromIndex(pA, a);
        setFromIndex(pB, b);
        setFromIndex(pC, c);

        cb.subVectors(pC, pB);
        ab.subVectors(pA, pB);
        cb.cross(ab);

        nA.fromBufferAttribute(normals, a);
        nB.fromBufferAttribute(normals, b);
        nC.fromBufferAttribute(normals, c);

        nA.add(cb);
        nB.add(cb);
        nC.add(cb);

        normals.setXYZ(a, nA.x, nA.y, nA.z);
        normals.setXYZ(b, nB.x, nB.y, nB.z);
        normals.setXYZ(c, nC.x, nC.y, nC.z);
    }

    for (let i = 0; i < side - 1; i++) {
        for (let j = 0; j < side - 1; j++) {
            const topLeft = i * side + j;
            const topRight = i * side + (j + 1);
            const bottomLeft = (i + 1) * side + j;
            const bottomRight = (i + 1) * side + (j + 1);

            compute(topLeft, bottomLeft, topRight);
            compute(topRight, bottomLeft, bottomRight);
        }
    }

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
