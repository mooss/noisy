import { CHUNK_UNIT } from './height-generation.js';
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

/**
 * Creates a surface mesh from a height field.
 *
 * @param {HeightGenerator}  heights  - Terrain data.
 * @param {Array}            palette  - Color palette for height-based interpolation.
 * @returns {THREE.Mesh} The generated surface mesh.
 */
export function createSurfaceMesh(heights, palette) {
    const { size, maxH, data } = heights;

    const geometry = new THREE.BufferGeometry();

    const vertices = [];
    const indices = [];
    const colors = [];

    // Vertices and colors.
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            const height = data[i][j];
            const color = interpolateColors(palette, height / maxH);

            vertices.push(i, j, height);
            colors.push(color.r, color.g, color.b);
        }
    }

    // Indices.
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

    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
        vertexColors: true,
        side: THREE.DoubleSide
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
export function createPrismMeshes(type, heights, palette) {
    const { size, maxH, data } = heights;
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

    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            const height = data[i][j];
            const xOffset = isHex && (j % 2 !== 0) ? .5 : 0;
            const xPos = i + xOffset;
            const yPos = j * ySpacingFactor;

            const color = interpolateColors(palette, height / maxH);
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

/**
 * Creates a terrain mesh.
 *
 * @param {HeightGenerator} heights - Terrain data.
 * @param {Array}           palette - Color palette for height-based interpolation.
 * @param {string}          style   - Style of mesh to create ('hexPrism', 'quadPrism' or 'surface').
 * @returns {THREE.Mesh} The terrain mesh.
 */
export function createTerrainMesh(heights, palette, style) {
    let mesh;
    switch (style) {
    case 'hexPrism':
        mesh = createPrismMeshes('hexagon', heights, palette);
        break;
    case 'quadPrism':
        mesh = createPrismMeshes('square', heights, palette);
        break;
    case 'surface':
        mesh = createSurfaceMesh(heights, palette);
        break;
    default:
        throw new Error(`Unknown render style ${style}`);
    }

    mesh.translateX(heights.coords.x * CHUNK_UNIT);
    mesh.translateY(heights.coords.y * CHUNK_UNIT);
    return mesh;
}
