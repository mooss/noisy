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

function startAnimationLoop(renderer, onFrame) {
    let prev = performance.now();

    function animate() {
        requestAnimationFrame(animate);
        const now = performance.now();
        onFrame((now - prev) / 1000);
        prev = now;
        renderer.render();
    }
    animate();
}

function main() {
    // Data, meshes and utilities.
    const terrain = new Terrain(config.chunks, config.gen, config.render);
    const avatar = new Avatar();

    // Renderer.
    const renderer = new Renderer();
    renderer.addMesh(terrain.mesh);
    renderer.addMesh(avatar.mesh);

    // UI callbacks.
    const updateAvatar = () => {
        terrain.centerOn(avatar.coords);
        avatar.z = terrain.height(avatar.x, avatar.y) + config.avatar.heightOffset;
        avatar.reposition(CHUNK_UNIT, config.gen.verticalUnit);
        avatar.setScale(config.avatar.size);
    }
    const regenerateTerrain = () => {
        terrain.regen();
        updateAvatar();
        updateStats(); // Defined later.
    }
    const reloadTerrain = () => terrain.reload();

    // UI definition.
    const gui = new GUI();
    const fps = new FpsWidget(gui);
    const heightGraph = gui.graph().legend("Sorted heights in active chunk");
    const heightStats = gui.readOnly('').legend('Height stats');
    const zScoreGraph = gui.graph().legend("Z-scores of the sorted heights").close();
    config.chunks.ui(gui.addFolder('Chunks'), regenerateTerrain, reloadTerrain);
    config.render.ui(gui.addFolder('Render'), regenerateTerrain);
    config.gen.ui(gui.addFolder('Terrain generation'), regenerateTerrain)
    config.avatar.ui(gui.addFolder('Avatar').close(), updateAvatar);

    // Stats and graphs.
    const updateStats = () => {
        const heightfun = terrain.chunkHeightFun(avatar.coords.toChunk(config.chunks.nblocks))
        const heights = [];
        for (let i = 0; i < config.chunks.nblocks; ++i)
            for (let j = 0; j < config.chunks.nblocks; ++j)
                heights.push(heightfun(i/config.chunks.nblocks, j/config.chunks.nblocks));
        heightGraph.update(heights.sort((l, r) => { return l - r; }));

        const stats = numStats(heights);
        const min = Math.min(...heights), max = Math.max(...heights);
        heightStats.update(`mean: ${stats.mean.toFixed(2)}, std: ${stats.std.toFixed(2)}
min: ${min.toFixed(2)}, max: ${max.toFixed(2)}`);

        zScoreGraph.update(stats.zScores);
    }

    // Final touches.
    avatar.x = .5; avatar.y = .5; avatar.z = 0; // Center of the original chunk.

    const keyboard = new Keyboard();
    regenerateTerrain();
    startAnimationLoop(renderer, (delta) => {
        fps.update(delta);
        keyboard.checkFocus();
        if (avatar.update(delta, keyboard)) updateAvatar();
    });
}

main();
