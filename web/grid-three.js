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

const config = {
    // Grid configuration.
    grid: new GridConfig(),

    // Chunking system.
    chunks: new ChunkConfig(),

    // Visualization options.
    render: new RenderConfig(),

    // Generation settings.
    gen: new GenerationConfig(),

    // Player avatar.
    avatar: new AvatarConfig(),

    // Render settings.
    needsRender: true, // Whether the frame should be updated.
};

function initializeApplication(config, palettes) {
    // 1. Create the terrain.
    const chunkManager = new ChunkManager(config);

    const avatar = config.avatar;
    avatar.x = Math.floor(config.grid.size / 2);
    avatar.y = Math.floor(config.grid.size / 2);
    const chunkCoords = new BlockCoordinates(avatar.x, avatar.y).asChunk(config.grid.size);

    let initialTerrainGrid = chunkManager.at(0, 0);
    if (config.chunks.enabled) {
        chunkCoords.within(config.chunks.loadRadius)
            .forEach(({x, y}) => chunkManager.at(x, y));
    }

    // 2. Create the Renderer (handles THREE.js scene, camera, meshes).
    // It performs the initial scene setup and mesh creation in its constructor.
    const terrainRenderer = new TerrainRenderer(initialTerrainGrid, config, palettes);

    // 3. Create the UI Handler.
    // It sets up listeners and interacts with config, terrainGrid, and terrainRenderer.
    // Pass the initial terrainGrid; UI will manage updates/replacements.
	// The UI being an object is only a convenience to setup everything, is doesn't need to be persisted.
    const ui = new UI(config, initialTerrainGrid, terrainRenderer);

    return [terrainRenderer, ui];
}

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
    const [terrainRenderer, ui] = initializeApplication(config, palettes);
    startAnimationLoop(config, terrainRenderer, ui);
}

main();
