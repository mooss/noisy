import * as THREE from 'three';
import { MapControls } from 'three/examples/jsm/controls/MapControls.js';
import type { RenderConfig } from './config/render.js';
import { CHUNK_UNIT } from "./constants.js";

export class Renderer {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private controls: MapControls;
    private ambientLight: THREE.AmbientLight;
    private directionalLight: THREE.DirectionalLight;
    private renderConf: RenderConfig;

    constructor(renderConf: RenderConfig) {
        this.renderConf = renderConf;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0, 0, 0);

        const camDist = CHUNK_UNIT * 1.2 + 50;
        const center = CHUNK_UNIT / 2;
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, .1, 10000);
        this.camera.position.set(center, center - camDist * 0.7, camDist * 0.7);
        this.camera.up.set(0, 0, 1);

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: "high-performance",
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        // The intensity of the lights will be set by updateLighting, who is meant to be called
        // as-needed in the game loop.
        this.ambientLight = new THREE.AmbientLight(0x808080);
        this.scene.add(this.ambientLight);
        this.directionalLight = new THREE.DirectionalLight(0xffffff);
        this.directionalLight.position.set(1, 1, 1).normalize();
        this.scene.add(this.directionalLight);

        this.controls = new MapControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.1;
        this.controls.target = new THREE.Vector3(center, center, 0);

        window.addEventListener('resize', this.resizeWindow.bind(this), false);
    }

    addMesh(mesh: THREE.Object3D): void {
        this.scene.add(mesh);
    }

    resizeWindow(): void {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    updateLighting(): void {
        this.ambientLight.intensity = this.renderConf.light.ambient.intensity;
        this.directionalLight.intensity = this.renderConf.light.directional.intensity;
    }

    // Point the camera towards target, maintaining the offset that existed between the previous
    // target and the previous camera position.
    lookAt(target: THREE.Vector3): void {
        this.camera.position.add(target).sub(this.controls.target);
        this.controls.target.copy(target);
    }

    render(): void {
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}
