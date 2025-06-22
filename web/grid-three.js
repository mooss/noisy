import { Renderer } from './renderer.js';
import { FpsWidget, Keyboard } from './ui.js';
import { palettes } from './palettes.js';
import { Terrain } from './terrain.js';

import { AvatarConfig } from './config/avatar.js';
import { ChunkConfig } from './config/chunk.js';
import { GenerationConfig } from './config/generation.js';
import { RenderConfig } from './config/render.js';
import { createTerrainMesh } from './mesh.js';
import { GUI } from './gui.js';
import { Coordinates } from './coordinates.js';
import { HeightGenerator } from './height-generation.js';
import { Avatar } from './avatar.js';

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

function main() {
    // Data, meshes and utilities.
    const terrain = new Terrain((coords) => {
        return new HeightGenerator(config.gen, config.chunks, coords);
    }, (heights) => {
        const res = createTerrainMesh(heights, palettes[config.render.palette], config.render.style);
        res.geometry.scale(config.chunks.blockSize, config.chunks.blockSize, 1);
        return res;
    });
    const avatar = new Avatar();
    const conv = config.chunks.converter;

    // Renderer.
    const renderer = new Renderer();
    renderer.addMesh(terrain.mesh);
    renderer.addMesh(avatar.mesh);

    // UI callbacks.
    const updateTerrainMesh = () => {
        terrain.updateMesh();
        renderer.pleaseRender();
    }
    const updateAvatar = () => {
        const chunk = terrain.chunkAt(conv.toChunk(avatar.coords));
        const pos = conv.toWorld(avatar.coords);
        pos.z = chunk.heights.heightOf(conv.toLocal(avatar.coords)) + config.avatar.heightOffset * config.chunks.blockSize;
        console.log(":POS", pos);
        avatar.setPosition(pos);
        avatar.setScale(config.avatar.size * config.chunks.blockSize);
        renderer.pleaseRender();
    }
    const updateTerrain = () => {
        terrain.regen();
        updateAvatar();
    }
    const resizeChunk = () => {
        avatar.chunkResize(config.chunks.previousSize, config.chunks.size);
        updateTerrain();
    }
    const noOp = () => { console.log('noOp'); }

    // UI definition.
    const gui = new GUI();
    const fps = new FpsWidget(gui);
    config.chunks.ui(gui.addFolder('Chunks'), resizeChunk, noOp);
    config.render.ui(gui.addFolder('Render'), updateTerrainMesh);
    config.gen.ui(gui.addFolder('Terrain generation'), updateTerrain)
    config.avatar.ui(gui.addFolder('Avatar').close(), updateAvatar);

    // Keyboard registration.
    const keyboard = new Keyboard();
    keyboard.down('KeyW', () => { avatar.y++; updateAvatar(); })
    keyboard.down('KeyA', () => { avatar.x--; updateAvatar(); })
    keyboard.down('KeyS', () => { avatar.y--; updateAvatar(); })
    keyboard.down('KeyD', () => { avatar.x++; updateAvatar(); })

    // Application start.
    updateTerrainMesh();
    avatar.x = Math.floor(config.chunks.size / 2);
    avatar.y = Math.floor(config.chunks.size / 2);
    updateAvatar();
    startAnimationLoop(renderer, fps);
}

main();
