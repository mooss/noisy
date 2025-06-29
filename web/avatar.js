import { Coordinates } from "./coordinates.js";
import { rangeMapper } from "./utils.js";

export class Avatar {
    /** @type {Coordinates} */
    coords = new Coordinates();
    /** @type {THREE.Mesh} */
    mesh;
    speed = .005; // Units per second

    constructor() {
        const geometry = new THREE.SphereGeometry(1, 32, 32);
        const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        this.mesh = new THREE.Mesh(geometry, material);
    }

    // Change avatar position on a new frame.
    // Returns true when the avatar position changed.
    update(dt, keyboard) {
        let dx = 0, dy = 0;
        if (keyboard.isPressed('KeyW')) dy += 1;
        if (keyboard.isPressed('KeyS')) dy -= 1;
        if (keyboard.isPressed('KeyA')) dx -= 1;
        if (keyboard.isPressed('KeyD')) dx += 1;
        if (dx == 0 && dy == 0) return false;

        this.x += dx * this.speed * dt;
        this.y += dy * this.speed * dt;
        return true;
    }

    // Reposition the avatar when the chunk changes size.
    chunkResize(then, now) {
        const conv = rangeMapper(0, then, 0, now);
        this.x = Math.round(conv(this.x));
        this.y = Math.round(conv(this.y));
    }

    setPosition(pos) {
        this.mesh.position.set(pos.x, pos.y, pos.z);
    }

    setScale(scale) {
        this.mesh.scale.set(scale, scale, scale);
    }

    get x() { return this.coords.x; }
    get y() { return this.coords.y; }
    set x(value) { this.coords.x = value; }
    set y(value) { this.coords.y = value; }
}
