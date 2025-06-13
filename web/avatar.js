/**
 * The player avatar.
 */
export class Avatar {
    /**
     * @private
     * @type {THREE.Mesh}
     */
    #mesh;

    constructor() {
        const geometry = new THREE.SphereGeometry(1, 32, 32);
        const material = new THREE.MeshStandardMaterial({ color: 0xff0000 }); // Red sphere.
        this.#mesh = new THREE.Mesh(geometry, material);
    }

    /**
     * Gets the underlying Three.js Mesh object of the avatar.
     * @returns {THREE.Mesh} The Three.js Mesh object.
     */
    get mesh() {
        return this.#mesh;
    }

    setPosition(x, y, z) {
        this.#mesh.position.set(x, y, z);
    }

    setScale(scale) {
        this.#mesh.scale.set(scale, scale, scale);
    }
}
