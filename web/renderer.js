import { Avatar } from './avatar.js';
import { TerrainMesh } from './mesh.js';
import { BlockCoordinates } from './coordinates.js';

export class TerrainRenderer {
    #scene;
    #camera;
    #renderer;
    #controls;

    #avatar;
    #terrainGrid;
    #avatarConfig;

    constructor(terrainGrid, avatarConfig, updateTerrainMesh) {
        this.#terrainGrid = terrainGrid;
        this.#avatarConfig = avatarConfig;

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
        this.#controls.target = new THREE.Vector3(center, center, 0);
        window.addEventListener('resize', this.#onWindowResize.bind(this), false);

        this.createGridMeshes = updateTerrainMesh;
        this.#createAvatarMesh();
    }

    #onWindowResize() {
        this.#camera.aspect = window.innerWidth / window.innerHeight;
        this.#camera.updateProjectionMatrix();
        this.#renderer.setSize(window.innerWidth, window.innerHeight);
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
    }

    updateAvatarScale() {
        this.#avatar.setScale(this.#avatarConfig.size * this.#terrainGrid.cellSize);
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
