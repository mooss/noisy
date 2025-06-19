import { BlockCoordinates } from './coordinates.js';
import { TerrainRenderer } from './renderer.js';
import { UI } from './ui.js';
import { palettes } from './palettes.js'; // TODO: turn to dict.
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
    render: new RenderConfig(),
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

function placeAvatar() {
    config.avatar.x = Math.floor(config.grid.size / 2);
    config.avatar.y = Math.floor(config.grid.size / 2);
}

function loadChunks(chunkManager) {
    const chunkCoords = new BlockCoordinates(config.avatar.x, config.avatar.y)
          .asChunk(config.grid.size);
    if (config.chunks.enabled) {
        chunkCoords.within(config.chunks.loadRadius)
            .forEach(({x, y}) => chunkManager.at(x, y));
    }
}

function main() {
    // Data and meshes.
    const chunkManager = new ChunkManager(config);
    const terrainGrid = chunkManager.at(0, 0);
    const terrainMesh = new TerrainMesh();

    // Renderer.
    const terrainRenderer = new TerrainRenderer(
        terrainGrid, config.avatar
    );
    terrainRenderer.scene.add(terrainMesh.mesh);


    // UI callbacks.
    const updateTerrainMesh = () => {
        terrainMesh.update(terrainGrid, palettes[config.render.palette], config.render.style);
        config.needsRender = true;
    }
    const updateTerrain = () => {
        terrainGrid.reset(config.gen, config.grid);
        terrainGrid.generate();
        updateTerrainMesh();
        terrainRenderer.updateAvatarPosition();
        terrainRenderer.updateAvatarScale();
    }

    // UI declaration.
    const ui = new UI(config, terrainRenderer, updateTerrain);
    config.render.ui(ui.root.addFolder('Render'), updateTerrainMesh);
    config.grid.ui(ui.root.addFolder('Grid'), terrainGrid, config.avatar, updateTerrain);
    updateTerrainMesh();
    ui.setupGUI();
    placeAvatar();

    // Application start.
    startAnimationLoop(config, terrainRenderer, ui);
}

main();
