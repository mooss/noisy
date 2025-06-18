import { Avatar } from './avatar.js';
import { TerrainMesh } from './mesh.js';
import { BlockCoordinates } from './coordinates.js';

export class TerrainRenderer {
    #scene;
    #camera;
    #renderer;
    #controls;

    #terrainMesh;
    #avatar;
    #terrainGrid;
    #renderConfig;
    #avatarConfig;
    #palettes;

    constructor(terrainGrid, renderConfig, avatarConfig, palettes) {
        this.#terrainGrid = terrainGrid;
        this.#renderConfig = renderConfig;
        this.#avatarConfig = avatarConfig;
        this.#palettes = palettes;

        this.#scene = new THREE.Scene();
        this.#scene.background = new THREE.Color(0, 0, 0);

        const camDist = this.#terrainGrid.size * this.#terrainGrid.cellSize * 1.2 + 50;
        const center = (this.#terrainGrid.size * this.#terrainGrid.cellSize) / 2;
        this.#camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, .1, camDist * 2);
        this.#camera.position.set(center, center - camDist * 0.7, camDist * 0.7);

        this.#renderer = new THREE.WebGLRenderer({ antialias: true });
        this.#renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.#renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0x808080);
        this.#scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, .8);
        directionalLight.position.set(1, 1, 1).normalize();
        this.#scene.add(directionalLight);

        this.#controls = new THREE.OrbitControls(this.#camera, this.#renderer.domElement);
        this.#controls.enableDamping = true;
        this.#controls.dampingFactor = 0.1;
        this.#controls.target = new THREE.Vector3(center, center, 0); // TODO: just addign
        this.#controls.addEventListener('change', () => { this.#renderConfig.needsRender = true; });
        window.addEventListener('resize', this.#onWindowResize.bind(this), false);

        this.#terrainMesh = new TerrainMesh(
            this.#terrainGrid,
            this.#palettes[this.#renderConfig.palette],
            this.#renderConfig.style
        );
        this.#scene.add(this.#terrainMesh.mesh);

        this.createGridMeshes();
        this.#createAvatarMesh();
    }

    #onWindowResize() {
        this.#camera.aspect = window.innerWidth / window.innerHeight;
        this.#camera.updateProjectionMatrix();
        this.#renderer.setSize(window.innerWidth, window.innerHeight);
        this.#renderConfig.needsRender = true;
    }

    #createAvatarMesh() {
        this.#avatar = new Avatar();
        this.#scene.add(this.#avatar.mesh);
        this.updateAvatarPosition();
        this.updateAvatarScale();
    }

    updateAvatarPosition() {
        const height = this.#terrainGrid.getHeightAt(this.#avatarConfig.x, this.#avatarConfig.y);
        const { cellSize } = this.#terrainGrid;
        const pos = new BlockCoordinates(this.#avatarConfig.x, this.#avatarConfig.y).
              toWorld(cellSize);
        pos.z = height + this.#avatarConfig.heightOffset * cellSize;
        this.#avatar.setPosition(pos.x, pos.y, pos.z);
        this.#renderConfig.needsRender = true;
    }

    updateAvatarScale() {
        this.#avatar.setScale(this.#avatarConfig.size * this.#terrainGrid.cellSize);
        this.#renderConfig.needsRender = true;
    }

    // Creates or updates the terrain meshes based on current grid data and config.
    createGridMeshes() {
        this.#terrainMesh.recreate(
            this.#terrainGrid,
            this.#palettes[this.#renderConfig.palette],
            this.#renderConfig.style
        );
        this.#renderConfig.needsRender = true;
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
