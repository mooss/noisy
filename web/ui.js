import { rangeMapper } from './utils.js';
import { GUI } from './gui.js';

class FpsCounter {
    constructor() {
        this.previous = performance.now();
        this.frames = 0;
        this.updateIntervalMs = 100; // Update FPS display every 100 milliseconds.
        this.fps = 0;
    }

    update() {
        const current = performance.now();
        this.frames++;
        const delta = current - this.previous;

        if (delta >= this.updateIntervalMs) {
            this.fps = (this.frames / (delta / 1000)).toFixed(1);
            this.frames = 0;
            this.previous = current;
        }

        return this.fps;
    }
}

export class UI {
    #config;
    #fps;
    #fpsController;
    #gui;
    #terrainFolder;
    #terrainGrid;
    #terrainRenderer;

    constructor(config, terrainGrid, terrainRenderer) {
        this.#config = config;
        this.#terrainGrid = terrainGrid;
        this.#terrainRenderer = terrainRenderer;

        this.#gui = new GUI();
        this.#setupFPS();
        this.#setupGUI();
        this.#setupKeyboard();
    }

    ///////////////////
    // Setup methods //

    #setupFPS() {
        this.#fps = new FpsCounter();
        this.#fpsController = this.#gui.add({ fps: 0 }, 'fps').name('FPS').disable();
    }

    #setupGUI() {
        /////////////////
        // Grid folder //
        const gridFolder = this.#gui.addFolder('Grid');
        gridFolder.add(this.#config, 'gridPower', 1, 9, 1)
            .name('Grid size (2^n + 1)')
            .onChange(() => {
                const oldSize = this.#terrainGrid.size;
                const conv = rangeMapper(0, oldSize, 0, this.#config.gridSize);

                this.#updateTerrain();

                // Update avatar position and scale based on new grid size.
                this.#config.avatar.x = Math.round(conv(this.#config.avatar.x));
                this.#config.avatar.y = Math.round(conv(this.#config.avatar.y));
                this.#terrainRenderer.updateAvatarPosition();
                this.#terrainRenderer.updateAvatarScale();
            })
            .onFinishChange(() => this.#config.needsRender = true);

        gridFolder.add(this.#config, 'heightMultiplier', 0.1, 5.0, 0.05)
            .name('Height multiplier')
            .onChange(() => {
                this.#terrainGrid.reset(this.#config); // Recompute maxH.
                this.#updateTerrain();
                this.#terrainRenderer.updateAvatarPosition();
            })
            .onFinishChange(() => this.#config.needsRender = true);

        gridFolder.add(this.#config, 'renderStyle', {
            'Squares': 'quadPrism',
            'Hexagons': 'hexPrism',
            'Surface': 'surface'
        }).name('Shape')
            .onChange(() => {
                this.#terrainRenderer.createGridMeshes();
                this.#config.needsRender = true;
            })
            .onFinishChange(() => this.#config.needsRender = true);

        gridFolder.add(this.#config, 'palette', {
            'Bright terrain': 0,
            'Continental': 1,
            'Cyberpuke': 2,
            'Black & white': 3,
            'Fantasy': 4,
            'Sunset': 5
        }).name('Palette')
            .onChange(() => {
                this.#terrainRenderer.createGridMeshes();
                this.#config.needsRender = true;
            })
            .onFinishChange(() => this.#config.needsRender = true);

        ///////////////////////////////
        // Terrain generation folder //
        this.#terrainFolder = this.#gui.addFolder('Terrain generation');
        this.#terrainFolder.add(this.#config.gen, 'seed')
            .name('Seed')
            .onChange(() => this.#updateTerrain())
            .onFinishChange(() => this.#config.needsRender = true);

        this.#terrainFolder.add(this.#config.gen, 'terrainAlgo', {
            'Random': 'rand',
            'Noise': 'noise',
            'Ridge': 'ridge',
            'Midpoint': 'midpoint'
        }).name('Algorithm')
            .onChange(() => {
                this.#updateAlgorithmFolders();
                this.#updateTerrain();
            })
            .onFinishChange(() => this.#config.needsRender = true);

        //////////////////
        // Noise folder //
        const noiseFolder = this.#terrainFolder.addFolder('Noise parameters');
        noiseFolder.add(this.#config.gen.noise, 'octaves', 1, 8, 1)
            .name('Octaves')
            .onChange(() => this.#updateTerrain())
            .onFinishChange(() => this.#config.needsRender = true);
        noiseFolder.add(this.#config.gen.noise, 'persistence', 0.1, 1.0, 0.05)
            .name('Persistence')
            .onChange(() => this.#updateTerrain())
            .onFinishChange(() => this.#config.needsRender = true);
        noiseFolder.add(this.#config.gen.noise, 'lacunarity', 1.1, 4.0, 0.1)
            .name('Lacunarity')
            .onChange(() => this.#updateTerrain())
            .onFinishChange(() => this.#config.needsRender = true);
        noiseFolder.add(this.#config.gen.noise, 'fundamental', 0.1, 5.0, 0.1)
            .name('Fundamental')
            .onChange(() => this.#updateTerrain())
            .onFinishChange(() => this.#config.needsRender = true);
        noiseFolder.add(this.#config.gen.noise, 'warpingStrength', 0.0, 0.5, 0.01)
            .name('Warping strength')
            .onChange(() => this.#updateTerrain())
            .onFinishChange(() => this.#config.needsRender = true);

        //////////////////
        // Ridge folder //
        const ridgeFolder = this.#terrainFolder.addFolder('Ridge parameters');
        ridgeFolder.add(this.#config.gen.noise.ridge, 'invertSignal')
            .name('Invert signal')
            .onChange(() => this.#updateTerrain())
            .onFinishChange(() => this.#config.needsRender = true);
        ridgeFolder.add(this.#config.gen.noise.ridge, 'squareSignal')
            .name('Square signal')
            .onChange(() => this.#updateTerrain())
            .onFinishChange(() => this.#config.needsRender = true);
        ridgeFolder.add(this.#config.gen.noise.ridge, 'style', {
            'Octavian': 'octavian',
            'Melodic': 'melodic'
        }).name('Ridge Style')
            .onChange(() => this.#updateTerrain())
            .onFinishChange(() => this.#config.needsRender = true);

        /////////////////////
        // Midpoint folder //
        const midpointFolder = this.#terrainFolder.addFolder('Midpoint parameters');
        midpointFolder.add(this.#config.gen, 'midpointRoughness', 0.4, 0.8, 0.02)
            .name('Roughness')
            .onChange(() => this.#updateTerrain())
            .onFinishChange(() => this.#config.needsRender = true);

        ///////////////////
        // Avatar folder //
        const avatarFolder = this.#gui.addFolder('Avatar');
        avatarFolder.add(this.#config.avatar, 'size', 0.1, 2.0, 0.1)
            .name('Size')
            .onChange(() => {
                this.#terrainRenderer.avatarMesh.scale.setScalar(this.#config.avatar.size * this.#terrainGrid.cellSize);
                this.#config.needsRender = true;
            })
            .onFinishChange(() => this.#config.needsRender = true);
        avatarFolder.add(this.#config.avatar, 'heightOffset', 0.0, 2.0, 0.1)
            .name('Height offset')
            .onChange(() => {
                this.#terrainRenderer.updateAvatarPosition();
            })
            .onFinishChange(() => this.#config.needsRender = true);

        /////////////////////////////
        // Post registration setup //
        this.#updateAlgorithmFolders();
    }

    #setupKeyboard() {
        document.addEventListener('keydown', (event) => {
            let moved = false;
            const avatar = this.#config.avatar;
            const gridSize = this.#config.gridSize;

            switch (event.code) {
            case 'KeyW': // Up.
                if (avatar.y < gridSize - 1) {
                    avatar.y++;
                    moved = true;
                }
                break;
            case 'KeyS': // Down.
                if (avatar.y > 0) {
                    avatar.y--;
                    moved = true;
                }
                break;
            case 'KeyA': // Left.
                if (avatar.x > 0) {
                    avatar.x--;
                    moved = true;
                }
                break;
            case 'KeyD': // Right.
                if (avatar.x < gridSize - 1) {
                    avatar.x++;
                    moved = true;
                }
                break;
            }

            if (moved) {
                this.#terrainRenderer.updateAvatarPosition();
                this.#config.needsRender = true;
            }
        });
    }

    ////////////////////
    // Update methods //

    // Dynamically show/hide parameter folders based on the selected terrain algorithm.
    #updateAlgorithmFolders() {
        const activeTerrainAlgo = this.#config.gen.terrainAlgo;

        this.#terrainFolder.folders.forEach(folder => {
            if (folder._title === 'Noise parameters') {
                if (['noise', 'ridge'].includes(activeTerrainAlgo)) {
                    folder.show();
                } else {
                    folder.hide();
                }
            }
            if (folder._title === 'Ridge parameters') {
                if (activeTerrainAlgo === 'ridge') {
                    folder.show();
                } else {
                    folder.hide();
                }
            } else if (folder._title === 'Midpoint parameters') {
                if (activeTerrainAlgo === 'midpoint') {
                    folder.show();
                } else {
                    folder.hide();
                }
            }
        });
    }

    updateFPS() {
        this.#fpsController.setValue(this.#fps.update());
    }

    #updateTerrain() {
        this.#terrainGrid.reset(this.#config);
        this.#terrainGrid[this.#config.gen.terrainAlgo]();
        this.#terrainRenderer.createGridMeshes();
        this.#terrainRenderer.updateAvatarPosition();
        this.#config.needsRender = true;
    }
}
