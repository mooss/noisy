export class TerrainRenderer {
    #scene;
    #camera;
    #renderer;
    #controls;

    #terrainGrid;

    constructor(terrainGrid) {
        this.#terrainGrid = terrainGrid;
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
    }

    addMesh(mesh) {
        this.#scene.add(mesh);
    }

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
