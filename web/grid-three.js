import { BlockCoordinates } from './coordinates.js';
import { TerrainRenderer } from './renderer.js';
import { UI } from './ui.js';
import { palettes } from './palettes.js';
import { ChunkManager } from './chunk-manager.js';

import { AvatarConfig } from './config/avatar.js';
import { ChunkConfig } from './config/chunk.js';
import { GenerationConfig } from './config/generation.js';
import { RenderConfig } from './config/render.js';
import { GridConfig } from './config/grid.js';
import { TerrainMesh } from './mesh.js';

const config = {
    // Grid configuration.
    grid: new GridConfig(),

    // Chunking system.
    chunks: new ChunkConfig(),

    // Generation settings.
    gen: new GenerationConfig(),

    // Player avatar.
    avatar: new AvatarConfig(),

    // Render settings.
    needsRender: true, // Whether the frame should be updated.
    render: undefined,
};

function startAnimationLoop(config, terrainRenderer, ui) {
    function animate() {
        requestAnimationFrame(animate);
        ui.updateFPS();

        // Only render if something has changed or controls are active.
        const controlsUpdated = terrainRenderer.controls.update(); // Required because of damping.
        if (config.needsRender || controlsUpdated) {
            terrainRenderer.renderer.render(terrainRenderer.scene, terrainRenderer.camera);
            config.needsRender = false;
        }
    }
    animate();
}

function main() {
    // 1. Create the terrain data.
    const chunkManager = new ChunkManager(config);

    const avatar = config.avatar;
    avatar.x = Math.floor(config.grid.size / 2);
    avatar.y = Math.floor(config.grid.size / 2);
    const chunkCoords = new BlockCoordinates(avatar.x, avatar.y).asChunk(config.grid.size);

    let terrainGrid = chunkManager.at(0, 0);
    if (config.chunks.enabled) {
        chunkCoords.within(config.chunks.loadRadius)
            .forEach(({x, y}) => chunkManager.at(x, y));
    }

    // 2. Create the meshes.
    const terrainMesh = new TerrainMesh();

    // 3. Create the renderer (handles the THREE.js setup).
    const updateTerrainMesh = () => {
        terrainMesh.update(terrainGrid, palettes[config.render.palette], config.render.style);
        config.needsRender = true;
    }
    const terrainRenderer = new TerrainRenderer(
        terrainGrid, config.avatar, updateTerrainMesh,
    );
    terrainRenderer.scene.add(terrainMesh.mesh);

    // 4. Create the UI Handler.
    // It sets up listeners and interacts with config, terrainGrid, and terrainRenderer.
    // Pass the initial terrainGrid; UI will manage updates/replacements.
	// The UI being an object is only a convenience to setup everything, is doesn't need to be persisted.
    const ui = new UI(config, terrainGrid, terrainRenderer);

    // 4. Initialise the configuration parameters.
    config.render = new RenderConfig(ui.root.addFolder('Render'), updateTerrainMesh);
    updateTerrainMesh();

    // 5. Start the animation loop.
    startAnimationLoop(config, terrainRenderer, ui);
}

main();
