import { Avatar } from './avatar.js';
import { TerrainMesh } from './mesh.js';
import { BlockCoordinates } from './coordinates.js';
import { Scene } from './scene.js';

export class TerrainRenderer {
    #scene;
    #terrainMesh;
    #avatar;
    #terrainGrid;
    #config;
    #palettes;

    constructor(terrainGrid, config, palettes) {
        this.#terrainGrid = terrainGrid;
        this.#config = config;
        this.#palettes = palettes;

        const camDist = this.#terrainGrid.size * this.#terrainGrid.cellSize * 1.2 + 50;
        const center = (this.#terrainGrid.size * this.#terrainGrid.cellSize) / 2;
        const cameraConfig = {
            fov: 60,
            aspect: window.innerWidth / window.innerHeight,
            near: 0.1,
            far: camDist * 2,
            position: new THREE.Vector3(center, center - camDist * 0.7, camDist * 0.7)
        };

        this.#scene = new Scene(
            cameraConfig,
            new THREE.Vector3(center, center, 0)
        );
        this.#scene.setRenderCallback(() => {
            this.#config.needsRender = true;
        });

        this.#terrainMesh = new TerrainMesh(
            this.#terrainGrid,
            this.#palettes[this.#config.palette],
            this.#config.renderStyle
        );
        this.#scene.scene.add(this.#terrainMesh.mesh);

        this.createGridMeshes();
        this.#createAvatarMesh();
    }

    #createAvatarMesh() {
        this.#avatar = new Avatar();
        this.#scene.scene.add(this.#avatar.mesh);
        this.updateAvatarPosition();
        this.updateAvatarScale();
    }

    updateAvatarPosition() {
        const height = this.#terrainGrid.getHeightAt(this.#config.avatar.x, this.#config.avatar.y);
        const { cellSize } = this.#terrainGrid;
        const pos = new BlockCoordinates(this.#config.avatar.x, this.#config.avatar.y).
              toWorld(cellSize);
        pos.z = height + this.#config.avatar.heightOffset * cellSize;
        this.#avatar.setPosition(pos.x, pos.y, pos.z);
        this.#config.needsRender = true;
    }

    updateAvatarScale() {
        this.#avatar.setScale(this.#config.avatar.size * this.#terrainGrid.cellSize);
        this.#config.needsRender = true;
    }

    // Creates or updates the terrain meshes based on current grid data and config.
    createGridMeshes() {
        this.#terrainMesh.recreate(
            this.#terrainGrid,
            this.#palettes[this.#config.palette],
            this.#config.renderStyle
        );
        this.#config.needsRender = true;
    }


    // Public accessors for core components needed by the main loop.
    get scene() { return this.#scene.scene; }
    get camera() { return this.#scene.camera; }
    get renderer() { return this.#scene.renderer; }
    get controls() { return this.#scene.controls; }

    setTerrainGrid(newGrid) {
        this.#terrainGrid = newGrid;
    }
}
