import { CHUNK_UNIT, LATIN_ALPHABET, VERSION } from '../../../config/constants.js';
import { Avatar } from '../../avatar/avatar.js';
import { lexon64 } from '../../encoding/codecs.js';
import { Codec } from '../../encoding/encoding.js';
import { encrec } from '../../encoding/self-encoder.js';
import { Renderer } from '../../engine/renderer/renderer.js';
import { Terrain } from '../../engine/terrain.js';
import { CheckBar } from '../../gui/components/widget.js';
import { Window } from '../../gui/components/window.js';
import { GUI, Panel } from '../../gui/gui.js';
import { Position } from '../../maths/coordinates.js';
import { numStats } from '../../maths/stats.js';
import { avatarUI } from '../../state/avatar.js';
import { cameraUI } from '../../state/camera.js';
import { chunksUI } from '../../state/chunk.js';
import { renderUI } from '../../state/renderer.js';
import { GameCallbacks, StateRegistry } from '../../state/state.js';
import { noiseUI } from '../../ui/noise.js';
import { tips } from '../../ui/tips.js';
import { FpsWidget, Keyboard } from '../../ui/ui.js';
import { downloadData, dragAndDrop, toClipBoard } from '../../utils/utils.js';
import { GameState, INITIAL_STATE, REFERENCE_STATE } from './init.js';

const STATE_STORAGE_KEY = 'load-state';
const DONT_SHOW_WELCOME_STORAGE_KEY = VERSION.storageKey('dont-show-welcome');
const smallcaps = 'style="font-variant: small-caps;"';
const welcomeMessage = `
Welcome to Noisy, the procedural terrain sandbox.<br/>
<br/>
The goal of this project is to create and navigate interesting procedurally-generated terrain.<br/>
You can create your own terrain by tweaking the parameters available in the control panels.

<h3>Controls</h3>
<ul>
  <li><strong>WASD</strong> to move</li>
  <li><strong>Mouse wheel</strong> to zoom</li>
  <li><strong>Left click + mouse</strong> to pan around the map</li>
  <li><strong>Right click + mouse</strong> to rotate the camera</li>
</ul>

<h3>Overview of the UI</h3>
<ul>
  <li><strong>Terrain Generation</strong> - Mix different noise types to create varied landscapes</li>

  <li><strong>Buttons</strong>
    <ul>
      <li><strong ${smallcaps}>Copy URL</strong> - Save the terrain as a shareable URL and copy it to the clipboard</li>
      <li><strong ${smallcaps}>Download</strong> - Download the terrain as a JSON file</li>
      <li><strong ${smallcaps}>Screenshot</strong> - Download a JPEG screenshot of the terrain</li>
    </ul>
  </li>

  <li><strong>Chunks</strong> - Control how much terrain is rendered around the avatar</li>
  <li><strong>Render</strong> - Adjust how the terrain is rendered</li>
  <li><strong>Camera</strong> - Switch between free camera movement and following the avatar</li>
  <li><strong>Avatar</strong> - Tweak the red sphere representing the avatar</li>
</ul>`;

class Game {
    static ENABLE_STATS_GRAPH = false;
    terrain: Terrain;
    avatar: Avatar;
    renderer: Renderer;
    fps: FpsWidget;
    keyboard: Keyboard;
    updateStats: () => void = () => { };
    readonly callbacks = new GameCallbacks(this);
    state: GameState = INITIAL_STATE;

    /** Encoder/decoder of noise state to a URL-friendly string. */
    codec: Codec<any, string>;

    start(): void {
        this.prepareState();

        this.terrain = new Terrain(this.state.chunks, this.state.noise, this.state.render);
        this.keyboard = new Keyboard();
        this.avatar = new Avatar(this.state.avatar);

        this.renderer = new Renderer(this.state.render, this.state.camera);
        this.renderer.addMesh(this.terrain.meshGroup);
        this.renderer.addMesh(this.avatar.mesh);

        this.setupUI();
        this.recomputeTerrain();
        this.updateAvatar();
        this.startAnimationLoop();
    }

    /** Create the noise codec and potentially load state from session storage or GET parameters. */
    prepareState(): void {
        const encodedRef = encrec(REFERENCE_STATE);
        this.codec = lexon64(StateRegistry, encodedRef, LATIN_ALPHABET);

        const reload = sessionStorage.getItem(STATE_STORAGE_KEY);
        if (reload) {
            sessionStorage.removeItem(STATE_STORAGE_KEY);
            this.state = StateRegistry.decode(JSON.parse(reload));
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
        this.renderer?.updateState();
        return this.state;
    }

    ////////
    // UI //

    setupUI(): void {
        const gui = new GUI(GUI.POSITION_LEFT).collapsible();
        this.setupActions(gui);
        this.fps = new FpsWidget(gui);
        if (Game.ENABLE_STATS_GRAPH) this.setupStatsGraph(gui);

        chunksUI(this.state.chunks, gui.folder('Chunks').tooltip(tips.chunks), this.callbacks);
        renderUI(this.state.render, gui.folder('Render'), this.callbacks);
        cameraUI(this.state.camera, gui.folder('Camera'), this.callbacks);
        avatarUI(this.state.avatar, gui.folder('Avatar').close(), this.callbacks);

        const tergen = new GUI(GUI.POSITION_RIGHT).title('Terrain Generation').collapsible();
        noiseUI(this.state.noise, tergen, this.callbacks);

        this.welcome();
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
        actions.button('Copy URL').onClick(() => toClipBoard(this.saveStateToUrl()));
        actions.button('Download').onClick(() => {
            const state = JSON.stringify(StateRegistry.encode(this.updatedState()), null, 2);
            downloadData(state, 'noisy-savefile.json', { type: 'application/json' });
        });
        actions.button('Screenshot').onClick(() => this.renderer.screenshot('noisy-screenshot.jpeg'));
        actions.button('?').onClick(() => this.welcomeWindow.show());

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
            const heightfun = this.terrain.heightAt({ x: Math.floor(pos.x), y: Math.floor(pos.y) });
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

    private welcomeWindow: Window;
    welcome(): void {
        this.welcomeWindow = new Window(`Noisy ${VERSION.string()}`, welcomeMessage);
        const check = new CheckBar(this.welcomeWindow.container, (checked: boolean) => {
            if (checked)
                localStorage.setItem(DONT_SHOW_WELCOME_STORAGE_KEY, 'true');
            this.welcomeWindow.hide();
            check.hide();
        }, "Don't show again", 'Close');
        if (localStorage.getItem(DONT_SHOW_WELCOME_STORAGE_KEY) === 'true') {
            this.welcomeWindow.hide();
            check.hide();
        }
    }

    ///////////////
    // Game loop //

    // alwaysRender and mustRender are used with a timeout call when starting the animation loop to
    // force rendering when the game starts, so that the initial terrain can be fully drawn when the
    // window is out-of-focus.
    private readonly alwaysRenderDuration = 1000; // ms.
    private alwaysRender = true;
    private mustRender(): boolean { return this.alwaysRender || document.hasFocus() }

    startAnimationLoop(): void {
        this.renderer.render(); // Render at least once if out of focus.
        let prev = performance.now();

        const animate = (): void => {
            requestAnimationFrame(animate);
            const now = performance.now();
            this.onFrame((now - prev) / 1000);
            prev = now;
            if (this.mustRender()) this.renderer.render();
        };

        setTimeout(() => this.alwaysRender = false, this.alwaysRenderDuration);
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
        this.terrain.recomputeAll();
        this.renderer.updateLighting();
        this.updateStats();
        this.updateAvatar();
    }

    ensureTerrainLoaded(): void {
        this.terrain.ensureLoaded();
    }

    updateRender(): void {
        this.renderer.updateLighting();
        this.terrain.rescaleMeshes();
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
