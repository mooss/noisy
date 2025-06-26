import { CHUNK_UNIT } from './constants.js';
import { interpolateColors } from './utils.js';

/**
 * Creates a hexagonal extruded prism.
 * @param {number} radius - The radius of the hexagon.
 * @param {number} height - The height of the extrusion.
 * @returns {THREE.ExtrudeGeometry} The generated geometry.
 */
function _createHexagonGeometry(radius, height) {
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

// Computes the surface indices of for a square mesh.
function surfaceIndices(size) {
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
 * @param {HeightGenerator}  heights  - Terrain data.
 * @param {Array}            palette  - Color palette for height-based interpolation.
 * @returns {THREE.Mesh} The generated surface mesh.
 */
export function createSurfaceMesh(heights, palette) {
    let { nblocks } = heights;
    const sampling = 1 / nblocks; // Distance between each vertex.
    nblocks+=1; // Create one additional row and column to overlap this mesh and the next one.
    const geometry = new THREE.BufferGeometry();

    const vertices = [];
    const colors = [];

    // Vertices and colors.
    for (let i = 0; i < nblocks; i++) {
        for (let j = 0; j < nblocks; j++) {
            const height = heights.at(i * sampling, j * sampling);
            const color = interpolateColors(palette, height);

            vertices.push(i, j, height);
            colors.push(color.r, color.g, color.b);
        }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3));
    geometry.setIndex(surfaceIndices(nblocks));
    geometry.computeVertexNormals();

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
 * @param {string}          type    - Shape of the prism ('hexagon' or 'square').
 * @param {HeightGenerator} heights - Terrain data.
 * @param {Array}           palette - Color palette for height-based interpolation
 * @returns {THREE.Mesh} The generated prism mesh.
 */
function createPrismMeshes(type, heights, palette) {
    const { nblocks } = heights;
    const sampling = 1 / nblocks; // Distance between each vertex.
    const isHex = type === 'hexagon';
    const ySpacingFactor = isHex ? Math.sqrt(3) / 2 : 1;
    const hexRadius = Math.sqrt(1/3);

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

export function createHexagonMesh(heights, palette) {
    return createPrismMeshes('hexagon', heights, palette);
}

export function createSquareMesh(heights, palette) {
    return createPrismMeshes('square', heights, palette);
}
