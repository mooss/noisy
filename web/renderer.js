import { Avatar } from './avatar.js';
import { TerrainMesh } from './mesh.js';
import { BlockCoordinates } from './coordinates.js';
import { Scene } from './scene.js';

export class TerrainRenderer {
    #scene;
    #terrainMesh;
    #avatar;
    #terrainGrid;
    #renderConfig;
    #avatarConfig;
    #palettes;

    constructor(terrainGrid, renderConfig, avatarConfig, palettes) {
        this.#terrainGrid = terrainGrid;
        this.#renderConfig = renderConfig;
        this.#avatarConfig = avatarConfig;
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
            this.#renderConfig.needsRender = true;
        });

        this.#terrainMesh = new TerrainMesh(
            this.#terrainGrid,
            this.#palettes[this.#renderConfig.palette],
            this.#renderConfig.style
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
        const height = this.#terrainGrid.getHeightAt(this.#avatarConfig.x, this.#avatarConfig.y);
        const { cellSize } = this.#terrainGrid;
        const pos = new BlockCoordinates(this.#avatarConfig.x, this.#avatarConfig.y).
              toWorld(cellSize);
        pos.z = height + this.#avatarConfig.heightOffset * cellSize;
        this.#avatar.setPosition(pos.x, pos.y, pos.z);
        this.#renderConfig.needsRender = true;
    }

    updateAvatarScale() {
        this.#avatar.setScale(this.#avatarConfig.size * this.#terrainGrid.cellSize);
        this.#renderConfig.needsRender = true;
    }

    // Creates or updates the terrain meshes based on current grid data and config.
    createGridMeshes() {
        this.#terrainMesh.recreate(
            this.#terrainGrid,
            this.#palettes[this.#renderConfig.palette],
            this.#renderConfig.style
        );
        this.#renderConfig.needsRender = true;
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
