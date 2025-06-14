export class Scene {
    #scene;
    #camera;
    #renderer;
    #controls;
    #onRenderCallback;

    constructor(cameraConfig, controlsTarget = new THREE.Vector3(0, 0, 0)) {
        this.#setupScene();
        this.#setupCamera(cameraConfig);
        this.#setupRenderer();
        this.#setupLighting();
        this.#setupControls(controlsTarget);

        window.addEventListener('resize', this.#onWindowResize.bind(this), false);
    }

    #setupScene() {
        this.#scene = new THREE.Scene();
        this.#scene.background = new THREE.Color(0, 0, 0);
    }

    #setupCamera({fov, aspect, near, far, position}) {
        this.#camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this.#camera.position.copy(position);
    }

    #setupRenderer() {
        this.#renderer = new THREE.WebGLRenderer({ antialias: true });
        this.#renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.#renderer.domElement);
    }

    #setupLighting() {
        const ambientLight = new THREE.AmbientLight(0x808080);
        this.#scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, .8);
        directionalLight.position.set(1, 1, 1).normalize();
        this.#scene.add(directionalLight);
    }

    #setupControls(target) {
        this.#controls = new THREE.OrbitControls(this.#camera, this.#renderer.domElement);
        this.#controls.enableDamping = true;
        this.#controls.dampingFactor = 0.1;
        this.#controls.target.copy(target);
        this.#controls.addEventListener('change', () => this.#onRenderCallback?.());
    }

    #onWindowResize() {
        this.#camera.aspect = window.innerWidth / window.innerHeight;
        this.#camera.updateProjectionMatrix();
        this.#renderer.setSize(window.innerWidth, window.innerHeight);
        this.#onRenderCallback?.();
    }

    // Public methods
    setRenderCallback(callback) {
        this.#onRenderCallback = callback;
    }

    get scene() { return this.#scene; }
    get camera() { return this.#camera; }
    get renderer() { return this.#renderer; }
    get controls() { return this.#controls; }
}
