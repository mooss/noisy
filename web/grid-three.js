import { Renderer } from './renderer.js';
import { FpsWidget, setupKeyboard } from './ui.js';
import { palettes } from './palettes.js';
import { Terrain } from './terrain.js';

import { AvatarConfig } from './config/avatar.js';
import { ChunkConfig } from './config/chunk.js';
import { GenerationConfig } from './config/generation.js';
import { RenderConfig } from './config/render.js';
import { AvatarMesh, createTerrainMesh } from './mesh.js';
import { GUI } from './gui.js';
import { Coordinates } from './coordinates.js';
import { HeightGenerator } from './height-generation.js';

const config = {
    // Chunking system.
    chunks: new ChunkConfig(),

    // Terrain generation.
    gen: new GenerationConfig(),

    // Player avatar.
    avatar: new AvatarConfig(),

    // Rendering.
    render: new RenderConfig(),
};

function startAnimationLoop(renderer, fps) {
    function animate() {
        requestAnimationFrame(animate);
        fps.update();
        renderer.render();
    }
    animate();
}

function loadChunks(terrain) {
    const chunkCoords = config.avatar.position
          .asChunk(config.chunks.size);
    chunkCoords.within(config.chunks.loadRadius)
        .forEach((coords) => terrain.at(coords));
}

function main() {
    // Data and meshes.
    const terrain = new Terrain((coords) => {
        return new HeightGenerator(config.gen, config.chunks, coords);
    }, (heights) => {
        return createTerrainMesh(heights, palettes[config.render.palette], config.render.style);
    });
    const chunk = terrain.at(new Coordinates(0, 0));
    const avatar = new AvatarMesh();

    // Renderer.
    const renderer = new Renderer(chunk.heights.size * chunk.heights.cellSize);
    renderer.addMesh(terrain.mesh);
    renderer.addMesh(avatar.mesh);

    // UI callbacks.
    const updateTerrainMesh = () => {
        terrain.updateMesh();
        renderer.pleaseRender();
    }
    const updateAvatar = () => {
        const pos = chunk.heights.positionOf(config.avatar.position);
        pos.z += config.avatar.heightOffset * chunk.heights.cellSize;
        avatar.setPosition(pos);
        avatar.setScale(config.avatar.size * chunk.heights.cellSize);
        renderer.pleaseRender();
    }
    const updateTerrain = () => {
        terrain.regen();
        updateAvatar();
    }
    const resizeChunk = () => {
        config.avatar.chunkResize(chunk.heights.size, config.chunks.size);
        updateTerrain(); // Will update activeChunk.size.
    }
    const noOp = () => { console.log('noOp'); }

    // UI and controls definition.
    const gui = new GUI();
    const fps = new FpsWidget(gui);
    config.chunks.ui(gui.addFolder('Chunks'), resizeChunk, noOp);
    config.render.ui(gui.addFolder('Render'), updateTerrainMesh);
    config.gen.ui(gui.addFolder('Terrain generation'), updateTerrain)
    config.avatar.ui(gui.addFolder('Avatar').close(), updateAvatar);
    setupKeyboard(config.avatar, config.chunks, updateAvatar);

    // Application start.
    updateTerrainMesh();
    config.avatar.x = Math.floor(config.chunks.size / 2);
    config.avatar.y = Math.floor(config.chunks.size / 2);
    updateAvatar();
    startAnimationLoop(renderer, fps);
}

main();
