import { interpolateColors } from './utils.js';

export class TerrainRenderer {
    #scene;
    #camera;
    #renderer;
    #controls;
    #terrainMeshes;
    #terrainGrid;
    #config;
    #palettes;

    constructor(terrainGrid, config, palettes) {
        this.#terrainGrid = terrainGrid;
        this.#config = config;
        this.#palettes = palettes;
        this.#setupScene();
        this.createGridMeshes(); // Initial mesh creation.

        // Handle window resize.
        window.addEventListener('resize', this.#onWindowResize.bind(this), false);
    }

    // Private method for initial scene setup.
    #setupScene() {
        // Scene.
        this.#scene = new THREE.Scene();
        this.#scene.background = new THREE.Color(0, 0, 0);

        // Camera. Mediocre, needs to be improved.
        const aspect = window.innerWidth / window.innerHeight;
        const camDist = this.#terrainGrid.size * this.#terrainGrid.cellSize * 1.2 + 50;
        this.#camera = new THREE.PerspectiveCamera(60, aspect, 0.1, camDist * 2);
        this.#camera.position.set(0, -camDist * 0.7, camDist * 0.7);
        this.#camera.lookAt(this.#scene.position);

        // Renderer.
        this.#renderer = new THREE.WebGLRenderer({ antialias: true });
        this.#renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.#renderer.domElement);

        // Lighting.
        const ambientLight = new THREE.AmbientLight(0x808080); // Soft white light.
        this.#scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, .8);
        directionalLight.position.set(1, 1, 1).normalize();
        this.#scene.add(directionalLight);

        // Mouse controls.
        this.#controls = new THREE.OrbitControls(this.#camera, this.#renderer.domElement);
        this.#controls.enableDamping = true; // Smooths camera movement.
        this.#controls.dampingFactor = 0.1;
        this.#controls.addEventListener('change', () => {
            this.#config.needsRender = true; // Render when controls are changed (for instance on zoom).
        });

        // Meshes group.
        this.#terrainMeshes = new THREE.Group();
        this.#scene.add(this.#terrainMeshes);
    }

    // Clears existing terrain meshes from the scene and disposes their resources.
    #clearMeshes() {
        while (this.#terrainMeshes.children.length > 0) {
            const mesh = this.#terrainMeshes.children[0];
            this.#terrainMeshes.remove(mesh);

            // Dispose geometry and material to free memory.
            if (mesh.geometry) {
                mesh.geometry.dispose();
            }

            if (mesh.material) {
                mesh.material.dispose();
            }
        }
    }

    // Private helper for creating hexagon geometry.
    #createHexagonGeometry(radius, height) {
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
    #createSurfaceMesh() {
        const { palette: currentPalette } = this.#config;
        const { size, cellSize, maxH, data } = this.#terrainGrid;

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
                const color = interpolateColors(this.#palettes[currentPalette], height / maxH);
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
        this.#terrainMeshes.add(surfaceMesh);
    }

    // Creates the mesh for the box geometry (square prism).
    #createSquarePrismMeshes() {
        this.#createPrismMeshes('square');
    }

    // Creates the mesh for the hexagonal prism geometry
    #createHexagonPrismMeshes() {
        this.#createPrismMeshes('hexagon');
    }

    #createPrismMeshes(type) {
        const { palette: currentPalette } = this.#config;
        const { size, cellSize, maxH, data } = this.#terrainGrid;

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
              ? this.#createHexagonGeometry(hexRadius, 1).rotateZ(Math.PI / 2)
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

                const color = interpolateColors(this.#palettes[currentPalette], height / maxH);
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

        this.#terrainMeshes.add(new THREE.Mesh(mergedGeometry, new THREE.MeshStandardMaterial({ vertexColors: true })));
    }

    // Creates or updates the terrain meshes based on current grid data and config.
    createGridMeshes() {
        this.#clearMeshes();
        switch (this.#config.renderStyle) {
            case 'hexPrism':  this.#createHexagonPrismMeshes(); break;
            case 'quadPrism': this.#createSquarePrismMeshes(); break;
            case 'surface':   this.#createSurfaceMesh(); break;
        }
        this.#config.needsRender = true;
    }

    // Handles window resize events.
    #onWindowResize() {
        this.#camera.aspect = window.innerWidth / window.innerHeight;
        this.#camera.updateProjectionMatrix();
        this.#renderer.setSize(window.innerWidth, window.innerHeight);
        this.#config.needsRender = true;
    }

    // Public accessors for core components needed by the main loop.
    get scene() { return this.#scene; }
    get camera() { return this.#camera; }
    get renderer() { return this.#renderer; }
    get controls() { return this.#controls; }

    setTerrainGrid(newGrid) {
        this.#terrainGrid = newGrid;
    }
}
