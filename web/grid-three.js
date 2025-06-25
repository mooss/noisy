import { Renderer } from './renderer.js';
import { FpsWidget, Keyboard } from './ui.js';
import { Terrain } from './terrain.js';
import { AvatarConfig } from './config/avatar.js';
import { ChunkConfig } from './config/chunk.js';
import { GenerationConfig } from './config/generation.js';
import { RenderConfig } from './config/render.js';
import { GUI } from './gui/gui.js';
import { Avatar } from './avatar.js';
import { numStats } from './stats.js';

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
    const terrain = new Terrain(config.chunks, config.gen, config.render);
    const avatar = new Avatar();
    const conv = config.chunks.converter;

    // Renderer.
    const renderer = new Renderer();
    renderer.addMesh(terrain.mesh);
    renderer.addMesh(avatar.mesh);

    // UI callbacks.
    const updateAvatar = () => {
        const chunk = terrain.getChunk(conv.toChunk(avatar.coords));
        const local = conv.toLocal(avatar.coords);
        const pos = conv.toWorld(avatar.coords);
        pos.z = chunk.height(local.x * config.chunks.sampling, local.y * config.chunks.sampling)
            * config.gen.verticalUnit
            + config.avatar.heightOffset * config.chunks.blockSize;
        avatar.setPosition(pos);
        avatar.setScale(config.avatar.size * config.chunks.blockSize);
        renderer.pleaseRender();
    }
    const updateTerrain = () => {
        terrain.regen();
        updateAvatar();
        updateStats(); // Defined later.
    }
    const resizeChunk = () => {
        avatar.chunkResize(config.chunks.previousSize, config.chunks.nblocks);
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
    config.render.ui(gui.addFolder('Render'), updateTerrain);
    config.gen.ui(gui.addFolder('Terrain generation'), updateTerrain)
    config.avatar.ui(gui.addFolder('Avatar').close(), updateAvatar);

    // Stats and graphs.
    const updateStats = () => {
        const chunk = terrain.getChunk(conv.toChunk(avatar.coords));
        const heights = [];
        for (let i = 0; i < config.chunks.nblocks; ++i)
            for (let j = 0; j < config.chunks.nblocks; ++j)
                heights.push(chunk.height(i, j));
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
    avatar.x = Math.floor(config.chunks.nblocks / 2);
    avatar.y = Math.floor(config.chunks.nblocks / 2);
    updateAvatar();
    updateStats();
    startAnimationLoop(renderer, fps);
}

main();
