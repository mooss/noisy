import { Avatar } from './avatar.js';
import { createSurfaceMesh, createPrismMeshes } from './mesh.js';

export class TerrainRenderer {
    #scene;
    #camera;
    #renderer;
    #controls;
    #terrainMeshes;
    #avatar;
    #terrainGrid;
    #config;
    #palettes;

    constructor(terrainGrid, config, palettes) {
        this.#terrainGrid = terrainGrid;
        this.#config = config;
        this.#palettes = palettes;
        this.#setupScene();
        this.createGridMeshes();
        this.#createAvatarMesh();

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
        const center = (this.#terrainGrid.size * this.#terrainGrid.cellSize) / 2;
        this.#camera = new THREE.PerspectiveCamera(60, aspect, 0.1, camDist * 2);
        this.#camera.position.set(center, center - camDist * 0.7, camDist * 0.7);

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
        this.#controls.target.set(center, center, 0);
        this.#controls.addEventListener('change', () => {
            this.#config.needsRender = true; // Render when controls are changed (for instance on zoom).
        });

        // Meshes group.
        this.#terrainMeshes = new THREE.Group();
        this.#scene.add(this.#terrainMeshes);
    }

    #createAvatarMesh() {
        this.#avatar = new Avatar();
        this.#scene.add(this.#avatar.mesh);
        this.updateAvatarPosition();
        this.updateAvatarScale();
    }

    updateAvatarPosition() {
        const height = this.#terrainGrid.getHeightAt(this.#config.avatar.x, this.#config.avatar.y);
        const { cellSize } = this.#terrainGrid;
        const worldX = this.#config.avatar.x * cellSize;
        const worldY = this.#config.avatar.y * cellSize;
        const worldZ = height + this.#config.avatar.heightOffset * cellSize;

        this.#avatar.setPosition(worldX, worldY, worldZ);
        this.#config.needsRender = true;
    }

    updateAvatarScale() {
        this.#avatar.setScale(this.#config.avatar.size * this.#terrainGrid.cellSize);
        this.#config.needsRender = true;
    }

    // Clears existing terrain meshes from the scene and disposes their resources.
    clearTerrainMeshes() {
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

    // Creates or updates the terrain meshes based on current grid data and config.
    createGridMeshes() {
        this.clearTerrainMeshes();
		const palette = this.#palettes[this.#config.palette];
        let mesh;
        switch (this.#config.renderStyle) {
            case 'hexPrism':
                mesh = createPrismMeshes('hexagon', this.#terrainGrid, palette);
                break;
            case 'quadPrism':
                mesh = createPrismMeshes('square', this.#terrainGrid, palette);
                break;
            case 'surface':
                mesh = createSurfaceMesh(this.#terrainGrid, palette);
                break;
        }
        if (mesh) {
            this.#terrainMeshes.add(mesh);
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
