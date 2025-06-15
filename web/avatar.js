/**
 * The player avatar.
 */
export class Avatar {
    /** @type {THREE.Mesh} */
    mesh;

    constructor() {
        const geometry = new THREE.SphereGeometry(1, 32, 32);
        const material = new THREE.MeshStandardMaterial({ color: 0xff0000 }); // Red sphere.
        this.mesh = new THREE.Mesh(geometry, material);
    }

    setPosition(x, y, z) {
        this.mesh.position.set(x, y, z);
    }

    setScale(scale) {
        this.mesh.scale.set(scale, scale, scale);
    }
}
