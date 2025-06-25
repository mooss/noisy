import { Renderer } from './renderer.js';
import { FpsWidget, Keyboard } from './ui.js';
import { palettes } from './palettes.js';
import { Terrain } from './terrain.js';

import { AvatarConfig } from './config/avatar.js';
import { ChunkConfig } from './config/chunk.js';
import { GenerationConfig } from './config/generation.js';
import { RenderConfig } from './config/render.js';
import { createTerrainMesh } from './mesh.js';
import { GUI } from './gui/gui.js';
import { Avatar } from './avatar.js';
import { numStats } from './stats.js';
import { CHUNK_UNIT } from './constants.js';

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
        const field = config.gen.heightField();
        const maxH = (CHUNK_UNIT / 5) * config.gen.heightMultiplier;
        return {
            raw: field.raw,
            at: field.mkNormalised(.1, maxH),
            maxH: maxH,
            size: config.chunks.size,
            generate: () => {},
            coords: coords,
        }
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
        const local = conv.toLocal(avatar.coords);
        const pos = conv.toWorld(avatar.coords);
        pos.z = chunk.heights.at(local.x * config.chunks.sampling, local.y * config.chunks.sampling)
            + config.avatar.heightOffset * config.chunks.blockSize;
        avatar.setPosition(pos);
        avatar.setScale(config.avatar.size * config.chunks.blockSize);
        renderer.pleaseRender();
    }
    const updateTerrain = () => {
        terrain.regen(); // Also updates the mesh.
        updateAvatar();
        updateStats(); // Defined later.
    }
    const resizeChunk = () => {
        avatar.chunkResize(config.chunks.previousSize, config.chunks.size);
        updateTerrain();
    }
    const noOp = () => { console.log('noOp'); }

    // UI definition.
    const gui = new GUI();
    const fps = new FpsWidget(gui);
    const heightGraph = gui.graph().legend("Sorted heights in active chunk");
    const heightStats = gui.readOnly('').legend('Height stats');
    const zScoreGraph = gui.graph().legend("Z-scores of the sorted heights").close();
    config.chunks.ui(gui.addFolder('Chunks'), resizeChunk, noOp);
    config.render.ui(gui.addFolder('Render'), updateTerrainMesh);
    config.gen.ui(gui.addFolder('Terrain generation'), updateTerrain)
    config.avatar.ui(gui.addFolder('Avatar').close(), updateAvatar);

    // Stats and graphs.
    const updateStats = () => {
        const chunk = terrain.chunkAt(conv.toChunk(avatar.coords));
        const heights = [];
        for (let i = 0; i < config.chunks.size; ++i)
            for (let j = 0; j < config.chunks.size; ++j)
                heights.push(chunk.heights.at(i, j));
        heightGraph.update(heights.sort((l, r) => { return l - r; }));

        const stats = numStats(heights);
        const min = Math.min(...heights), max = Math.max(...heights);
        heightStats.update(`mean: ${stats.mean.toFixed(2)}, std: ${stats.std.toFixed(2)}
min: ${min.toFixed(2)}, max: ${max.toFixed(2)}`);

        zScoreGraph.update(stats.zScores);
    }

    // Keyboard registration.
    const keyboard = new Keyboard();
    keyboard.down('KeyW', () => { avatar.y++; updateAvatar(); })
    keyboard.down('KeyA', () => { avatar.x--; updateAvatar(); })
    keyboard.down('KeyS', () => { avatar.y--; updateAvatar(); })
    keyboard.down('KeyD', () => { avatar.x++; updateAvatar(); })

    // Application start.
    avatar.x = Math.floor(config.chunks.size / 2);
    avatar.y = Math.floor(config.chunks.size / 2);
    updateAvatar();
    updateStats();
    startAnimationLoop(renderer, fps);
}

main();
