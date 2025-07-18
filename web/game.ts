import { Avatar } from './avatar.js';
import { AvatarConfig } from './config/avatar.js';
import { ChunkConfig } from './config/chunk.js';
import { GenerationConfig } from './config/generation.js';
import { RenderConfig } from './config/render.js';
import { CHUNK_UNIT } from './constants.js';
import { GUI } from './gui/gui.js';
import { Renderer } from './renderer.js';
import { numStats } from './stats.js';
import { Terrain } from './terrain.js';
import { FpsWidget, Keyboard } from './ui.js';

class Game {
    static ENABLE_STATS_GRAPH = false;
    terrain: Terrain;
    avatar: Avatar;
    renderer: Renderer;
    gui: GUI;
    fps: FpsWidget;
    keyboard: Keyboard;
    updateStats: () => void = () => { };

    config: {
        chunks: ChunkConfig;
        gen: GenerationConfig;
        avatar: AvatarConfig;
        render: RenderConfig;
    };

    constructor() {
        this.config = {
            chunks: new ChunkConfig(),
            gen: new GenerationConfig(),
            avatar: new AvatarConfig(),
            render: new RenderConfig(),
        };
    }

    start(): void {
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

    setupUI(): void {
        this.gui = new GUI(GUI.POSITION_LEFT).collapsible();
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

    setupAvatarPosition(): void {
        this.avatar.x = .5;
        this.avatar.y = .5;
        this.avatar.z = 0;
    }

    startAnimationLoop(): void {
        this.renderer.render(); // Render at least once if out of focus.
        let prev = performance.now();

        const animate = (): void => {
            requestAnimationFrame(animate);
            const now = performance.now();
            this.onFrame((now - prev) / 1000);
            prev = now;
            if (document.hasFocus()) this.renderer.render();
        };

        animate();
    }

    onFrame(delta: number): void {
        this.fps.update(delta);
        this.keyboard.checkFocus();
        if (this.avatar.update(delta, this.keyboard)) {
            this.updateAvatar();
        }
    }

    updateAvatar(): void {
        this.terrain.centerOn(this.avatar.coords);
        this.avatar.z = this.terrain.height(this.avatar.x, this.avatar.y) + this.config.avatar.heightOffset;
        this.avatar.reposition(CHUNK_UNIT, this.config.gen.verticalUnit);
        this.avatar.setScale(this.config.avatar.size);

        if (this.config.avatar.cameraMode === 'Follow') {
            this.renderer.lookAt(this.avatar.mesh.position);
        }
    }

    regenerateTerrain(): void {
        this.terrain.regen();
        this.renderer.updateLighting();
        this.updateAvatar();
        this.updateStats();
    }

    reloadTerrain(): void {
        this.terrain.reload();
    }

    setupStatsGraph(): void {
        const heightGraph = this.gui.graph().legend("Sorted heights in active chunk");
        const heightStats = this.gui.readOnly('').legend('Height stats');
        const zScoreGraph = this.gui.graph().legend("Z-scores of the sorted heights").close();

        this.updateStats = (): void => {
            const heightfun = this.terrain.chunkHeightFun(this.avatar.coords.toChunk());
            const heights: number[] = [];
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

function main(): void {
    const game = new Game();
    game.start();
}

main();
