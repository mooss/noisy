import * as THREE from 'three';
import { GameCallbacks } from "./state/state.js";
import { Keyboard } from './ui/ui.js';
import { AvatarState } from './state/avatar.js';
import { vector3 } from './utils/maths.js';

export class Avatar {
    // World position of the avatar.
    get coords(): vector3 { return this.state.position }
    mesh: THREE.Mesh;
    speed: number = .5; // Units per second.

    constructor(private state: AvatarState) {
        const geometry = new THREE.SphereGeometry(1, 32, 32);
        const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        this.mesh = new THREE.Mesh(geometry, material);
    }

    // Change avatar position on a new frame.
    // Returns true when the avatar position changed.
    update(dt: number, keyboard: Keyboard, cb: GameCallbacks): boolean {
        let dx = 0, dy = 0;
        if (keyboard.isPressed('KeyW')) dy += this.speed;
        if (keyboard.isPressed('KeyS')) dy -= this.speed;
        if (keyboard.isPressed('KeyA')) dx -= this.speed;
        if (keyboard.isPressed('KeyD')) dx += this.speed;
        if (dx == 0 && dy == 0) return false;

        this.x += dx * dt;
        this.y += dy * dt;
        cb.camera.update();
        return true;
    }

    reposition(hscale: number, vscale: number): void {
        this.mesh.position.set(this.x * hscale, this.y * hscale, this.z * vscale);
    }

    setScale(scale: number): void {
        this.mesh.scale.set(scale, scale, scale);
    }

    get x(): number { return this.coords.x; }
    get y(): number { return this.coords.y; }
    get z(): number { return this.coords.z; }
    set x(value: number) { this.coords.x = value; }
    set y(value: number) { this.coords.y = value; }
    set z(value: number) { this.coords.z = value; }
}
