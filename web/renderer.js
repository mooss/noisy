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

        // Meshes group.
        this.#terrainMeshes = new THREE.Group();
        this.#scene.add(this.#terrainMeshes);
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

    // Creates or updates the terrain meshes based on current grid data and config.
    createGridMeshes() {
        // Clear previous meshes.
        while (this.#terrainMeshes.children.length > 0) {
            this.#terrainMeshes.remove(this.#terrainMeshes.children[0]);
        }

        const { useSurface, useHexagons, palette: currentPalette } = this.#config;
        const { size, cellSize, maxH, data } = this.#terrainGrid;

        if (useSurface) {
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
            return;
        }

        const ySpacingFactor = useHexagons ? Math.sqrt(3) / 2 : 1;
        const hexRadius = cellSize / Math.sqrt(3);
        const hexWidth = cellSize; // Distance between parallel sides.

        // Calculate total grid dimensions for centering.
        let totalGridWidth = (size - 1) * cellSize + (useHexagons ? hexWidth / 2 : 0);
        let totalGridHeight = (size - 1) * cellSize * ySpacingFactor;

        const startX = -totalGridWidth / 2;
        const startY = -totalGridHeight / 2;
        const material = new THREE.MeshStandardMaterial({ vertexColors: false });

        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                const height = data[i][j];

                let geometry;
                let mesh;
                const cellColor = interpolateColors(this.#palettes[currentPalette], height / maxH);

                const xOffset = (useHexagons && j % 2 !== 0) ? hexWidth / 2 : 0;
                const xPos = startX + i * cellSize + xOffset;
                const yPos = startY + j * cellSize * ySpacingFactor;
                let zPos = height / 2; // Center squares vertically.

                if (useHexagons) {
                    geometry = this.#createHexagonGeometry(hexRadius, height);
                    mesh = new THREE.Mesh(geometry, material.clone());
                    mesh.material.color.set(cellColor);
                    mesh.rotation.z = Math.PI / 2; // Rotate for a flat top orientation.
                    zPos = 0; // Hexagon prisms are already centered vertically.
                } else {
                    geometry = new THREE.BoxGeometry(cellSize, cellSize, height);
                    mesh = new THREE.Mesh(geometry, material.clone());
                    mesh.material.color.set(cellColor);
                }

                mesh.position.set(xPos, yPos, zPos);
                this.#terrainMeshes.add(mesh);
            }
        }
    }

    // Handles window resize events.
    #onWindowResize() {
        this.#camera.aspect = window.innerWidth / window.innerHeight;
        this.#camera.updateProjectionMatrix();
        this.#renderer.setSize(window.innerWidth, window.innerHeight);
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
