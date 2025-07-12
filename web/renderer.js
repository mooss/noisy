import * as THREE from 'three';
import { MapControls } from 'three/examples/jsm/controls/MapControls.js';
import { CHUNK_UNIT } from "./constants.js";

export class Renderer {
    #scene;
    #camera;
    #renderer;
    #controls;

    constructor() {
        this.#scene = new THREE.Scene();
        this.#scene.background = new THREE.Color(0, 0, 0);

        const camDist = CHUNK_UNIT * 1.2 + 50;
        const center = CHUNK_UNIT / 2;
        this.#camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, .1, 10000);
        this.#camera.position.set(center, center - camDist * 0.7, camDist * 0.7);
        this.#camera.up.set(0, 0, 1);

        this.#renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: "high-performance",
        });
        this.#renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.#renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0x808080);
        this.#scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 4);
        directionalLight.position.set(1, 1, 1).normalize();
        this.#scene.add(directionalLight);

        this.#controls = new MapControls(this.#camera, this.#renderer.domElement);
        this.#controls.enableDamping = true;
        this.#controls.dampingFactor = 0.1;
        this.#controls.target = new THREE.Vector3(center, center, 0);

        window.addEventListener('resize', this.resizeWindow.bind(this), false);
    }

    addMesh(mesh) {
        this.#scene.add(mesh);
    }

    resizeWindow() {
        this.#camera.aspect = window.innerWidth / window.innerHeight;
        this.#camera.updateProjectionMatrix();
        this.#renderer.setSize(window.innerWidth, window.innerHeight);
    }

    render() {
        this.#controls.update();
        this.#renderer.render(this.#scene, this.#camera);
    }
}
