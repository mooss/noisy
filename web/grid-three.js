import { TerrainRenderer } from './renderer.js';
import { FpsWidget, setupKeyboard } from './ui.js';
import { palettes } from './palettes.js'; // TODO: turn to dict.
import { ChunkManager } from './chunk-manager.js';

import { AvatarConfig } from './config/avatar.js';
import { ChunkConfig } from './config/chunk.js';
import { GenerationConfig } from './config/generation.js';
import { RenderConfig } from './config/render.js';
import { GridConfig } from './config/grid.js';
import { AvatarMesh, TerrainMesh } from './mesh.js';
import { GUI } from './gui.js';

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

function startAnimationLoop(config, terrainRenderer, fps) {
    function animate() {
        requestAnimationFrame(animate);
        fps.update();

        // Only render if something has changed or controls are active.
        const controlsUpdated = terrainRenderer.controls.update(); // Required because of damping.
        if (config.needsRender || controlsUpdated) {
            terrainRenderer.renderer.render(terrainRenderer.scene, terrainRenderer.camera);
            config.needsRender = false;
        }
    }
    animate();
}

// function loadChunks(chunkManager) {
//     const chunkCoords = new BlockCoordinates(config.avatar.x, config.avatar.y)
//           .asChunk(config.grid.size);
//     if (config.chunks.enabled) {
//         chunkCoords.within(config.chunks.loadRadius)
//             .forEach(({x, y}) => chunkManager.at(x, y));
//     }
// }

function main() {
    // Data and meshes.
    const chunkManager = new ChunkManager(config);
    const terrainGrid = chunkManager.at(0, 0);
    const terrainMesh = new TerrainMesh();
    const avatar = new AvatarMesh();

    // Renderer.
    const terrainRenderer = new TerrainRenderer(terrainGrid);
    terrainRenderer.addMesh(terrainMesh.mesh);
    terrainRenderer.addMesh(avatar.mesh);


    // UI callbacks.
    const updateTerrainMesh = () => {
        terrainMesh.update(terrainGrid, palettes[config.render.palette], config.render.style);
        config.needsRender = true;
    }
    const updateAvatar = () => {
        const pos = terrainGrid.positionOf(config.avatar.position);
        pos.z += config.avatar.heightOffset * terrainGrid.cellSize;
        avatar.setPosition(pos);
        avatar.setScale(config.avatar.size * terrainGrid.cellSize);
        config.needsRender = true;
    }
    const updateTerrain = () => {
        terrainGrid.reset(config.gen, config.grid);
        terrainGrid.generate();
        updateTerrainMesh();
        updateAvatar();
    }

    // UI and controls definition.
    const gui = new GUI();
    const fps = new FpsWidget(gui);
    config.grid.ui(gui.addFolder('Grid'), terrainGrid, config.avatar, updateTerrain);
    config.render.ui(gui.addFolder('Render'), updateTerrainMesh);
    config.gen.ui(gui.addFolder('Terrain generation'), updateTerrain)
    config.avatar.ui(gui.addFolder('Avatar').close(), updateAvatar);
    setupKeyboard(config.avatar, config.grid, updateAvatar);

    // Application start.
    updateTerrainMesh();
    config.avatar.x = Math.floor(config.grid.size / 2);
    config.avatar.y = Math.floor(config.grid.size / 2);
    updateAvatar();
    startAnimationLoop(config, terrainRenderer, fps);
}

main();
