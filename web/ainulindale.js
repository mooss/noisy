import { Avatar } from './avatar.js';
import { AvatarConfig } from './config/avatar.ts';
import { ChunkConfig } from './config/chunk.ts';
import { GenerationConfig } from './config/generation.ts';
import { RenderConfig } from './config/render.ts';
import { CHUNK_UNIT } from './constants.ts';
import { GUI } from './gui/gui.js';
import { Renderer } from './renderer.js';
import { numStats } from './stats.ts';
import { Terrain } from './terrain.js';
import { FpsWidget, Keyboard } from './ui.ts';

class Game {
    static ENABLE_STATS_GRAPH = false;
    terrain = null;
    avatar = null;
    renderer = null;
    gui = null;
    fps = null;
    keyboard = null;
    updateStats = () => { };

    constructor() {
        this.config = {
            chunks: new ChunkConfig(),
            gen: new GenerationConfig(),
            avatar: new AvatarConfig(),
            render: new RenderConfig(),
        };
    }

    start() {
        this.terrain = new Terrain(this.config.chunks, this.config.gen, this.config.render);
        this.avatar = new Avatar();

        this.renderer = new Renderer(this.config.render);
        this.renderer.addMesh(this.terrain.mesh);
        this.renderer.addMesh(this.avatar.mesh);

        this.setupUI();
        this.setupAvatarPosition();
        this.keyboard = new Keyboard();
        this.regenerateTerrain();
        this.startAnimationLoop();
    }

    setupUI() {
        this.gui = new GUI({ left: '8px' }).collapsible();
        this.fps = new FpsWidget(this.gui);

        if (Game.ENABLE_STATS_GRAPH) {
            this.setupStatsGraph();
        }

        this.config.chunks.ui(this.gui.folder('Chunks'),
            () => this.regenerateTerrain(),
            () => this.reloadTerrain()
        );
        this.config.render.ui(this.gui.folder('Render'),
            () => this.regenerateTerrain()
        );
        this.config.avatar.ui(this.gui.folder('Avatar').close(),
            () => this.updateAvatar()
        );

        const terrainGeneration = new GUI(GUI.POSITION_RIGHT).title('Terrain generation').collapsible();
        this.config.gen.ui(terrainGeneration,
            () => this.regenerateTerrain()
        );
    }

    setupAvatarPosition() {
        this.avatar.x = .5;
        this.avatar.y = .5;
        this.avatar.z = 0;
    }

    startAnimationLoop() {
        let prev = performance.now();

        const animate = () => {
            requestAnimationFrame(animate);
            const now = performance.now();
            this.onFrame((now - prev) / 1000);
            prev = now;
            this.renderer.render();
        };

        animate();
    }

    onFrame(delta) {
        this.fps.update(delta);
        this.keyboard.checkFocus();
        if (this.avatar.update(delta, this.keyboard)) {
            this.updateAvatar();
        }
    }

    updateAvatar() {
        this.terrain.centerOn(this.avatar.coords);
        this.avatar.z = this.terrain.height(this.avatar.x, this.avatar.y) + this.config.avatar.heightOffset;
        this.avatar.reposition(CHUNK_UNIT, this.config.gen.verticalUnit);
        this.avatar.setScale(this.config.avatar.size);

        if (this.config.avatar.cameraMode === 'Follow') {
            this.renderer.lookAt(this.avatar.mesh.position);
        }
    }

    regenerateTerrain() {
        this.terrain.regen();
        this.renderer.updateLighting();
        this.updateAvatar();
        this.updateStats();
    }

    reloadTerrain() {
        this.terrain.reload();
    }

    setupStatsGraph() {
        const heightGraph = this.gui.graph().legend("Sorted heights in active chunk");
        const heightStats = this.gui.readOnly('').legend('Height stats');
        const zScoreGraph = this.gui.graph().legend("Z-scores of the sorted heights").close();

        this.updateStats = () => {
            const heightfun = this.terrain.chunkHeightFun(this.avatar.coords.toChunk(this.config.chunks.nblocks))
            const heights = [];
            for (let i = 0; i < this.config.chunks.nblocks; ++i)
                for (let j = 0; j < this.config.chunks.nblocks; ++j)
                    heights.push(heightfun(i / this.config.chunks.nblocks, j / this.config.chunks.nblocks));

            heightGraph.update(heights.sort((l, r) => l - r));

            const stats = numStats(heights);
            const min = Math.min(...heights), max = Math.max(...heights);
            heightStats.update(`mean: ${stats.mean.toFixed(2)}, std: ${stats.std.toFixed(2)}
min: ${min.toFixed(2)}, max: ${max.toFixed(2)}`);

            zScoreGraph.update(stats.zScores);
        };
    }
}

function main() {
    const game = new Game();
    game.start();
}

main();
