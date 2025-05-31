import { interpolateColors } from './utils.js';

// Private helper for creating hexagon geometry.
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

// Creates the mesh for a continuous surface representation.
export function createSurfaceMesh(terrainGrid, palette) {
    const { size, cellSize, maxH, data } = terrainGrid;

    const geometry = new THREE.PlaneGeometry(
        size * cellSize,
        size * cellSize,
        size - 1,
        size - 1
    );

    const positionAttribute = geometry.getAttribute('position');
    const colors = [];

    // Set heights and colors.
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            // Height.
            const vertexIndex = i * size + j;
            const height = data[i][j];
            positionAttribute.setZ(vertexIndex, height);

            // Color.
            const color = interpolateColors(palette, height / maxH);
            colors.push(color.r, color.g, color.b);
        }
    }

    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
        vertexColors: true,
        side: THREE.DoubleSide
    });

    const surfaceMesh = new THREE.Mesh(geometry, material);
    surfaceMesh.rotation.z = Math.PI / 2;
    return surfaceMesh;
}

// Creates the mesh for the prism geometry (square or hexagon).
export function createPrismMeshes(type, terrainGrid, palette) {
    const { size, cellSize, maxH, data } = terrainGrid;

    const isHex = type === 'hexagon';
    const ySpacingFactor = isHex ? Math.sqrt(3) / 2 : 1;
    const hexRadius = cellSize / Math.sqrt(3);
    const hexWidth = cellSize;

    const totalGridWidth = (size - 1) * cellSize + (isHex ? hexWidth / 2 : 0);
    const totalGridHeight = (size - 1) * cellSize * ySpacingFactor;
    const startX = -totalGridWidth / 2;
    const startY = -totalGridHeight / 2;

    const positions = [], normals = [], colors = [], indices = [];
    let indexOffset = 0;

    const baseGeometry = isHex
          ? _createHexagonGeometry(hexRadius, 1).rotateZ(Math.PI / 2)
          : new THREE.BoxGeometry(cellSize, cellSize, 1).translate(0, 0, 0.5);

    const posAttr = baseGeometry.getAttribute('position');
    const normAttr = baseGeometry.getAttribute('normal');
    const idxAttr = baseGeometry.getIndex();

    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            const height = data[i][j];
            const xOffset = isHex && (j % 2 !== 0) ? hexWidth / 2 : 0;
            const xPos = startX + i * cellSize + xOffset;
            const yPos = startY + j * cellSize * ySpacingFactor;

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
