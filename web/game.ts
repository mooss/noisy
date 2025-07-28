import { Avatar } from './avatar.js';
import { CHUNK_UNIT, VERSION, Version } from './constants.js';
import { AutoCodec, Codec, Lexon64 } from './encoding/codecs.js';
import { decrec, encrec } from './encoding/self-encoder.js';
import { GUI, Panel } from './gui/gui.js';
import { NoiseMakerI } from './noise/foundations.js';
import { noiseAlgorithms } from './noise/init.js';
import { noiseUI } from './noise/ui.js';
import { Renderer } from './renderer.js';
import { AvatarState, avatarUI } from './state/avatar.js';
import { ChunkState, chunksUI } from './state/chunk.js';
import { RenderState, renderUI } from './state/render.js';
import { StateCallbacks, StateRegistry } from './state/state.js';
import { numStats } from './stats.js';
import { Terrain } from './terrain.js';
import { FpsWidget, Keyboard } from './ui.js';
import { download, dragAndDrop, toClipBoard } from './utils/utils.js';

const STATE_STORAGE_KEY = 'load-state';

interface GameState {
    chunks: ChunkState;
    avatar: AvatarState;
    render: RenderState;
    noise: NoiseMakerI;
    version: Version;
}

class Game {
    static ENABLE_STATS_GRAPH = false;
    terrain: Terrain;
    avatar: Avatar;
    renderer: Renderer;
    fps: FpsWidget;
    keyboard: Keyboard;
    updateStats: () => void = () => { };

    state: GameState = {
        chunks: new ChunkState({
            _power: 7,
            loadRadius: 1,
            radiusType: 'square',
        }),
        avatar: new AvatarState({
            size: 3,
            heightOffset: 0,
            cameraMode: 'Follow',
        }),
        render: new RenderState({
            style: 'surface',
            paletteName: 'Bright terrain',
            light: {
                ambient: { intensity: .5 },
                directional: { intensity: 4 },
            },
            heightMultiplier: 1,
        }),
        noise: noiseAlgorithms(),
        version: VERSION,
    };

    /** Encoder/decoder of noise state to a URL-friendly string. */
    codec: Codec<any, string>;

    start(): void {
        this.prepareState();

        this.terrain = new Terrain(this.state.chunks, this.state.noise, this.state.render);
        this.keyboard = new Keyboard();
        this.avatar = new Avatar();
        this.avatar.x = .5;
        this.avatar.y = .5;
        this.avatar.z = 0;

        this.renderer = new Renderer(this.state.render);
        this.renderer.addMesh(this.terrain.mesh);
        this.renderer.addMesh(this.avatar.mesh);

        this.setupUI();
        this.recomputeTerrain();
        this.startAnimationLoop();
    }

    /** Create the noise codec and potentially load state from session storage or GET parameters. */
    prepareState(): void {
        const alphabet = 'abcdefghijklmnopqrstuwvxyzABCDEFGHIJKLMNOPQRSTUWVXYZ';
        const urlCodec = new Lexon64(encrec(this.state), alphabet);
        this.codec = new AutoCodec(urlCodec, StateRegistry);
        this.state = StateRegistry.decode(encrec(this.state)); // Live encoding/decoding test.

        const reload = sessionStorage.getItem(STATE_STORAGE_KEY);
        if (reload) {
            sessionStorage.removeItem(STATE_STORAGE_KEY);
            this.state = decrec(JSON.parse(reload), StateRegistry);
            this.saveStateToUrl();
            return;
        }

        const encoded = new URLSearchParams(window.location.search).get('q');
        if (encoded?.length > 0) {
            this.state = this.codec.decode(encoded);
        }
    }

    ////////
    // UI //

    setupUI(): void {
        const gui = new GUI(GUI.POSITION_LEFT).collapsible();
        this.setupActions(gui);
        this.fps = new FpsWidget(gui);
        if (Game.ENABLE_STATS_GRAPH) this.setupStatsGraph(gui);

        const cb = new StateCallbacks(this);
        chunksUI(this.state.chunks, gui.folder('Chunks'), cb);
        renderUI(this.state.render, gui.folder('Render'), cb);
        avatarUI(this.state.avatar, gui.folder('Avatar').close(), cb);

        const tergen = new GUI(GUI.POSITION_RIGHT).title('Terrain generation').collapsible();
        noiseUI(this.state.noise, tergen, cb);
    }

    saveStateToUrl(): string {
        const url = new URL(window.location.href);
        url.search = '?q=' + this.codec.encode(this.state);
        const link = encodeURI(url.toString());
        // Update the URL bar to enshrine the current state into the page.
        window.history.pushState({ path: link }, '', link);
        return link;
    }

    setupActions(root: Panel): void {
        const actions = root.buttonBar();
        const copy = actions.button('COPY URL');
        const save = actions.button('DOWNLOAD');
        copy.onClick(() => toClipBoard(this.saveStateToUrl()));

        save.onClick(() => {
            const state = JSON.stringify(encrec(this.state), null, 2);
            download(state, 'tergen-state.json', { type: 'application/json' });
        });

        dragAndDrop((file) => {
            if (file.type === 'application/json') {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const res = e.target?.result;
                    if (typeof res === 'string') {
                        sessionStorage.setItem(STATE_STORAGE_KEY, res);
                        window.location.reload();
                    }
                };
                reader.readAsText(file);
            } else {
                console.warn(`Unsupported file type for drag and drop: ${file.type}`);
            }
        })
    }

    setupStatsGraph(root: Panel): void {
        const heightGraph = root.graph().legend("Sorted heights in active chunk");
        const heightStats = root.readOnly('').legend('Height stats');
        const zScoreGraph = root.graph().legend("Z-scores of the sorted heights").close();

        this.updateStats = (): void => {
            const heightfun = this.terrain.chunkHeightFun(this.avatar.coords.toChunk());
            const heights: number[] = [];
            for (let i = 0; i < this.state.chunks.nblocks; ++i)
                for (let j = 0; j < this.state.chunks.nblocks; ++j)
                    heights.push(heightfun(i / this.state.chunks.nblocks, j / this.state.chunks.nblocks));

            heightGraph.update(heights.sort((l, r) => l - r));

            const stats = numStats(heights);
            const min = Math.min(...heights), max = Math.max(...heights);
            heightStats.update(`mean: ${stats.mean.toFixed(2)}, std: ${stats.std.toFixed(2)}
min: ${min.toFixed(2)}, max: ${max.toFixed(2)}`);

            zScoreGraph.update(stats.zScores);
        };
    }

    ///////////////
    // Game loop //

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

    /////////////////////
    // Update graphics //

    updateAvatar(): void {
        this.terrain.centerOn(this.avatar.coords);
        this.avatar.z = this.terrain.height(this.avatar.x, this.avatar.y) + this.state.avatar.heightOffset;
        this.avatar.reposition(CHUNK_UNIT, this.state.render.verticalUnit);
        this.avatar.setScale(this.state.avatar.size);

        if (this.state.avatar.cameraMode === 'Follow') {
            this.renderer.lookAt(this.avatar.mesh.position);
        }
    }

    recomputeTerrain(): void {
        this.terrain.recompute();
        this.renderer.updateLighting();
        this.updateAvatar();
        this.updateStats();
    }

    ensureTerrainLoaded(): void {
        this.terrain.ensureLoaded();
    }

    updateRender(): void {
        this.renderer.updateLighting();
        this.terrain.rescaleMesh();
        this.updateAvatar();
    }
}

function main(): void {
    const game = new Game();
    game.start();
}

main();
