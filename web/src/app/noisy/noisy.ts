import { CHUNK_UNIT, LATIN_ALPHABET } from '../../../config/constants.js';
import { Avatar } from '../../avatar/avatar.js';
import { Renderer } from '../../engine/renderer/renderer.js';
import { Terrain } from '../../engine/terrain/terrain.js';
import { GUI } from '../../gui/gui.js';
import { MenuBar, Panel } from '../../gui/panels/panel.js';
import { VerticalStack } from '../../gui/panels/vertical-stack.js';
import { Blawhi, POSITION_TOP_LEFT } from '../../gui/style.js';
import { UIManager } from '../../gui/ui-manager.js';
import { Position } from '../../maths/coordinates.js';
import { numStats } from '../../maths/stats.js';
import { advancedNoise, comixNoise, textureNoise } from '../../noise/init.js';
import { NoisePipeline } from '../../noise/processing/pipeline.js';
import { chunksUI } from '../../state/chunk.js';
import { renderUI } from '../../state/renderer.js';
import { StateManager, TEMP_STORAGE_KEY } from '../../state/state-manager.js';
import { GameCallbacks, StateRegistry } from '../../state/state.js';
import { noiseUI } from '../../ui/noise.js';
import { tips } from '../../ui/tips.js';
import { FpsWidget, Keyboard } from '../../ui/ui.js';
import { downloadBlob, downloadData, dragAndDrop, toClipBoard } from '../../utils/utils.js';
import { GameState, INITIAL_STATE, REFERENCE_STATE } from './init.js';


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

    private stateManager: StateManager<GameState>;

    private topMenu: MenuBar;
    private guiStack: VerticalStack;
    private tergen: GUI;
    private uiManager = new UIManager();

    start(): void {
        this.stateManager = new StateManager(
            StateRegistry,
            REFERENCE_STATE,
            LATIN_ALPHABET,
            TEMP_STORAGE_KEY,
        );
        this.state = this.stateManager.loadInitialState(INITIAL_STATE);

        this.terrain = new Terrain(
            this.state.chunks,
            () => {
                this.state.noise.recompute();
                return this.state.noise.normalised(.01, 1);
            },
            this.state.render,
        );
        this.keyboard = new Keyboard();
        this.avatar = new Avatar(this.state.avatar);

        this.renderer = new Renderer(this.state.render, this.state.camera);
        this.renderer.addMesh(this.terrain.meshGroup);
        this.renderer.addMesh(this.avatar.mesh);

        this.setupUI();
        this.recomputeTerrain();
        this.updateAvatar();

        // Center camera on avatar to prevent a sudden jerk when moving for the first time, but only
        // when the default scene is loaded (to preserve the focus point when loading a scene).
        if (this.state.camera.cameraMode === 'Follow' && window.location.search == '') {
            this.updateCamera();
        }

        this.startAnimationLoop();
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
        const gui = new GUI().collapsible();
        this.setupActions();
        this.fps = new FpsWidget(gui);
        if (Game.ENABLE_STATS_GRAPH) this.setupStatsGraph(gui);

        chunksUI(this.state.chunks, gui.folder('Chunks').tooltip(tips.chunks), this.callbacks);
        renderUI(this.state.render, gui.folder('Render'), this.callbacks);

        // Camera UI is not very important for now because too limited.
        // cameraUI(this.state.camera, gui.folder('Camera'), this.callbacks);

        // Avatar UI is basically useless right now since the avatar is so minimalist.
        // avatarUI(this.state.avatar, gui.folder('Avatar').close(), this.callbacks);

        this.setupTergen();

        // Place the menu on top and stack the control panels vertically below.
        const guiRoot = document.querySelector('.dynamicUI') as HTMLElement;
        this.setupMenu(guiRoot);
        this.guiStack = new VerticalStack(guiRoot, POSITION_TOP_LEFT, gui._elt, this.tergen._elt);
        this.uiManager.registerLayout(this.topMenu, this.guiStack);

        // Style the footer like the top menu for consistency.
        const footer = document.getElementById('footer');
        footer.classList.add(...Blawhi.footer.classes);

        // Make sure the GUI always fits between the top menu and the footer.
        this.uiManager.adjustStackBounds();
        window.addEventListener('resize', () => this.uiManager.adjustStackBounds());

        this.uiManager.showWelcome();
    }

    /**
     * Registers the terrain generation UI, replacing the noise and removing the previous UI if
     * needed.
     */
    setupTergen(noise: NoisePipeline = null): void {
        if (noise) {
            this.state.noise = noise;
            this.recomputeTerrain();
            this.ensureTerrainLoaded();
        }

        const old = this.tergen;
        this.tergen = new GUI().title('Terrain Generation').collapsible();
        // Ensure the new GUI stacks correctly inside the vertical container.
        this.tergen._elt.addFacet(Blawhi.verticalChild);
        noiseUI(this.state.noise, this.tergen, this.callbacks);
        old?.replace(this.tergen); // Make sure the new UI appears in the right place.

        if (noise) this.uiManager.adjustStackBounds();
    }


    setupActions(): void {
        dragAndDrop((file) => {
            if (file.type === 'application/json') {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const res = e.target?.result;
                    if (typeof res === 'string') {
                        sessionStorage.setItem(TEMP_STORAGE_KEY, res);
                        window.location.reload();
                    }
                };
                reader.readAsText(file);
            } else {
                console.warn(`Unsupported file type for drag and drop: ${file.type}`);
            }
        })
    }

    private setupMenu(root: HTMLElement): void {
        const menu = new MenuBar(root);
        this.topMenu = menu;

        menu.entry('?').onClick(() => this.uiManager.showWelcome());
        this.setupSaves(menu);
        this.setupLoads(menu);
    }

    private setupSaves(menu: MenuBar): void {
        const saves = menu.entry('Save');

        saves.entry('As URL in the Clipboard').onClick(() => {
            toClipBoard(this.stateManager.saveStateToUrl(this.updatedState()));
        });

        saves.entry('As JSON').onClick(() => this.stateManager.saveToFile(this.updatedState()));

        saves.entry('As JPEG Screenshot').onClick(
            () => this.renderer.screenshot('noisy-screenshot.jpeg'),
        );

        saves.entry('As PNG Texture').onClick(() => this.terrain.asTexture().then(
            (texture: Blob) => downloadBlob(texture, 'noisy-texture.png'),
        ));

        saves.entry('As STL').onClick(() => downloadData(
            this.terrain.asSTL(),
            'noisy-terrain.stl',
            { type: 'model/stl' },
        ));
    }

    private setupLoads(menu: MenuBar): void {
        const loads = menu.entry('Load');
        loads.entry('Continental mix').onClick(() => this.setupTergen(comixNoise()));

        const texture = (palette: string, tiling: string) => {
            this.state.render.geometryStyle = 'Pixel';
            this.state.render.paletteName = palette;
            this.state.chunks.radiusType = 'square';
            this.state.chunks.loadRadius = 1;
            this.state.chunks.power = 5;
            this.setupTergen(textureNoise(this.state.chunks, tiling));
        };
        loads.entry('Texture lab').onClick(() => texture('Glacier', 'Quad'));
        loads.entry('Wallpaper').onClick(() => texture('Praclarush', 'Mirrored'));

        const advanced = advancedNoise(this.state.chunks);
        loads.entry('Advanced mode').onClick(() => this.setupTergen(advanced));
    }

    setupStatsGraph(root: Panel): void {
        const heightGraph = root.graph().label("Sorted heights in active chunk");
        const heightStats = root.static('').label('Height stats');
        const zScoreGraph = root.graph().label("Z-scores of the sorted heights").close();

        this.updateStats = (): void => {
            const pos = this.avatar.coords;
            const heightfun = this.terrain.heightAt({ x: Math.floor(pos.x), y: Math.floor(pos.y) });
            const heights: number[] = [];
            for (let i = 0; i < this.state.chunks.resolution; ++i)
                for (let j = 0; j < this.state.chunks.resolution; ++j)
                    heights.push(heightfun(i / this.state.chunks.resolution, j / this.state.chunks.resolution));

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

        // When using pixels, the avatar is at ground level.
        let height = 0;
        if (this.state.render.geometryStyle !== 'Pixel')
            height = this.terrain.height(this.avatar.x, this.avatar.y);

        this.avatar.z = height + this.state.avatar.heightOffset;
        this.avatar.reposition(CHUNK_UNIT, this.state.render.verticalUnit);
        this.avatar.setScale(this.state.avatar.size);
    }

    recomputeTerrain(): void {
        this.terrain.update();
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

    repaintTerrain(): void {
        this.terrain.repaint();
    }
}

function main(): void {
    const game = new Game();
    game.start();
}

main();
