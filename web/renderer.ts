import * as THREE from 'three';
import { MapControls } from 'three/examples/jsm/controls/MapControls.js';
import { CameraState } from './state/camera.js';
import type { RenderState } from './state/render.js';
import { downloadURL } from './utils/utils.js';

export class Renderer {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private controls: MapControls;
    private ambientLight: THREE.AmbientLight;
    private directionalLight: THREE.DirectionalLight;

    constructor(private renderstate: RenderState, private camstate: CameraState) {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0, 0, 0);

        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, .1, 10000);
        this.camera.position.set(camstate.position.x, camstate.position.y, camstate.position.z);
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
        this.controls.target = new THREE.Vector3(camstate.focus.x, camstate.focus.y, camstate.focus.z);

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
        this.ambientLight.intensity = this.renderstate.light.ambient.intensity;
        this.directionalLight.intensity = this.renderstate.light.directional.intensity;
    }

    // Point the camera towards target, maintaining the offset that existed between the previous
    // target and the previous camera position.
    lookAt(target: THREE.Vector3): void {
        this.camera.position.add(target).sub(this.controls.target);
        this.controls.target.copy(target);
        this.updateState();
    }

    // Update the state to reflect the actual camera position and focus point.
    updateState(): void {
        const pos = this.camera.position;
        const target = this.controls.target;
        this.camstate.position = { x: pos.x, y: pos.y, z: pos.z };
        this.camstate.focus = { x: target.x, y: target.y, z: target.z };
    }

    render(): void {
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    // Take a screenshot of the scene and download it.
    screenshot(filename: string): void {
        this.renderer.render(this.scene, this.camera);
        const dataURL = this.renderer.domElement.toDataURL('image/jpeg');
        downloadURL(dataURL, filename);
    }
}
