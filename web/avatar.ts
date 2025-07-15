import { Position } from "./coordinates";
import * as THREE from 'three';
import { Keyboard } from './ui';

export class Avatar {
    /** @type {Position} World position of the avatar. */
    coords = new Position();
    /** @type {THREE.Mesh} */
    mesh;
    speed = .5; // Units per second.

    constructor() {
        const geometry = new THREE.SphereGeometry(1, 32, 32);
        const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        this.mesh = new THREE.Mesh(geometry, material);
    }

    // Change avatar position on a new frame.
    // Returns true when the avatar position changed.
    update(dt: number, keyboard: Keyboard): boolean {
        let dx = 0, dy = 0;
        if (keyboard.isPressed('KeyW')) dy += this.speed;
        if (keyboard.isPressed('KeyS')) dy -= this.speed;
        if (keyboard.isPressed('KeyA')) dx -= this.speed;
        if (keyboard.isPressed('KeyD')) dx += this.speed;
        if (dx == 0 && dy == 0) return false;

        this.x += dx * dt;
        this.y += dy * dt;
        return true;
    }

    reposition(hscale: number, vscale: number): void {
        this.mesh.position.set(this.x * hscale, this.y * hscale, this.z * vscale);
    }

    setScale(scale: number): void {
        this.mesh.scale.set(scale, scale, scale);
    }

    get x() { return this.coords.x; }
    get y() { return this.coords.y; }
    get z() { return this.coords.z; }
    set x(value) { this.coords.x = value; }
    set y(value) { this.coords.y = value; }
    set z(value) { this.coords.z = value; }
}
