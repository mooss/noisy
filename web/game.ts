import { Avatar } from './avatar.js';
import { CHUNK_UNIT } from './constants.js';
import { Position } from './coordinates.js';
import { AutoCodec, Codec, Lexon64 } from './encoding/codecs.js';
import { decrec, encrec } from './encoding/self-encoder.js';
import { GUI, Panel } from './gui/gui.js';
import { GameState, initialState } from './init.js';
import { noiseUI } from './noise/ui.js';
import { Renderer } from './renderer.js';
import { avatarUI } from './state/avatar.js';
import { cameraUI } from './state/camera.js';
import { chunksUI } from './state/chunk.js';
import { renderUI } from './state/render.js';
import { GameCallbacks, StateRegistry } from './state/state.js';
import { numStats } from './stats.js';
import { Terrain } from './terrain.js';
import { FpsWidget, Keyboard } from './ui.js';
import { downloadData, dragAndDrop, toClipBoard } from './utils/utils.js';

const STATE_STORAGE_KEY = 'load-state';

class Game {
    static ENABLE_STATS_GRAPH = false;
    terrain: Terrain;
    avatar: Avatar;
    renderer: Renderer;
    fps: FpsWidget;
    keyboard: Keyboard;
    updateStats: () => void = () => { };
    readonly callbacks = new GameCallbacks(this);
    state: GameState = initialState();

    /** Encoder/decoder of noise state to a URL-friendly string. */
    codec: Codec<any, string>;

    start(): void {
        this.prepareState();

        this.terrain = new Terrain(this.state.chunks, this.state.noise, this.state.render);
        this.keyboard = new Keyboard();
        this.avatar = new Avatar(this.state.avatar);

        this.renderer = new Renderer(this.state.render, this.state.camera);
        this.renderer.addMesh(this.terrain.mesh);
        this.renderer.addMesh(this.avatar.mesh);

        this.setupUI();
        this.recomputeTerrain();
        this.updateAvatar();
        this.startAnimationLoop();
    }

    /** Create the noise codec and potentially load state from session storage or GET parameters. */
    prepareState(): void {
        const alphabet = 'abcdefghijklmnopqrstuwvxyzABCDEFGHIJKLMNOPQRSTUWVXYZ';
        const statenc = encrec(this.state);
        const urlCodec = new Lexon64(statenc, alphabet);
        this.codec = new AutoCodec(urlCodec, StateRegistry);
        this.state = StateRegistry.decode(statenc); // Live encoding/decoding test.

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

    /**
     * Ensure that the state is fully up-to-date and returns it.
     * This state is necessary because some part of the state are encoded in third-party objects
     * whose value are not automatically reflected in the game state.
     */
    updatedState(): GameState {
        this.renderer.updateState();
        return this.state;
    }

    ////////
    // UI //

    setupUI(): void {
        const gui = new GUI(GUI.POSITION_LEFT).collapsible();
        this.setupActions(gui);
        this.fps = new FpsWidget(gui);
        if (Game.ENABLE_STATS_GRAPH) this.setupStatsGraph(gui);

        chunksUI(this.state.chunks, gui.folder('Chunks'), this.callbacks);
        renderUI(this.state.render, gui.folder('Render'), this.callbacks);
        cameraUI(this.state.camera, gui.folder('Camera'), this.callbacks);
        avatarUI(this.state.avatar, gui.folder('Avatar').close(), this.callbacks);

        const tergen = new GUI(GUI.POSITION_RIGHT).title('Terrain Generation').collapsible();
        noiseUI(this.state.noise, tergen, this.callbacks);
    }

    saveStateToUrl(): string {
        const url = new URL(window.location.href);
        url.search = '?q=' + this.codec.encode(this.updatedState());
        const link = encodeURI(url.toString());
        // Update the URL bar to enshrine the current state into the page.
        window.history.pushState({ path: link }, '', link);
        return link;
    }

    setupActions(root: Panel): void {
        const actions = root.buttons();
        actions.button('Copy url').onClick(() => toClipBoard(this.saveStateToUrl()));
        actions.button('Download').onClick(() => {
            const state = JSON.stringify(encrec(this.updatedState()), null, 2);
            downloadData(state, 'noisy-savefile.json', { type: 'application/json' });
        });
        actions.button('Screenshot').onClick(() => this.renderer.screenshot('noisy-screenshot.jpeg'));

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
        const heightGraph = root.graph().label("Sorted heights in active chunk");
        const heightStats = root.static('').label('Height stats');
        const zScoreGraph = root.graph().label("Z-scores of the sorted heights").close();

        this.updateStats = (): void => {
            const pos = this.avatar.coords;
            const heightfun = this.terrain.chunkHeightFun({ x: Math.floor(pos.x), y: Math.floor(pos.y) });
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
        if (this.avatar.update(delta, this.keyboard, this.callbacks)) {
            this.updateAvatar();
        }
    }

    /////////////////////
    // Update graphics //

    updateAvatar(): void {
        this.terrain.centerOn(new Position(this.avatar.coords));
        this.avatar.z = this.terrain.height(this.avatar.x, this.avatar.y) + this.state.avatar.heightOffset;
        this.avatar.reposition(CHUNK_UNIT, this.state.render.verticalUnit);
        this.avatar.setScale(this.state.avatar.size);
    }

    recomputeTerrain(): void {
        this.terrain.recompute();
        this.renderer.updateLighting();
        this.updateStats();
        this.updateAvatar();
    }

    ensureTerrainLoaded(): void {
        this.terrain.ensureLoaded();
    }

    updateRender(): void {
        this.renderer.updateLighting();
        this.terrain.rescaleMesh();
    }

    updateCamera(): void {
        if (this.state.camera.cameraMode === 'Follow') {
            this.renderer.lookAt(this.avatar.mesh.position);
        }
    }
}

function main(): void {
    const game = new Game();
    game.start();
}

main();
