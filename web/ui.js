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
        this.#fpsController = this.#gui.readOnly(0).legend('FPS');
    }

    #setupGUI() {
        /////////////////
        // Grid folder //
        const gridFolder = this.#gui.addFolder('Grid');
        gridFolder.range(this.#config, 'gridPower', 1, 9, 1)
            .legend('Grid size (2^n + 1)')
            .onInput(() => {
                // Update avatar position and scale based on new grid size.
                const oldSize = this.#terrainGrid.size;
                const conv = rangeMapper(0, oldSize, 0, this.#config.gridSize);
                this.#config.avatar.x = Math.round(conv(this.#config.avatar.x));
                this.#config.avatar.y = Math.round(conv(this.#config.avatar.y));

                this.#updateTerrain();
                this.#terrainRenderer.updateAvatarScale();
            });

        gridFolder.range(this.#config, 'heightMultiplier', 0.1, 5.0, 0.05)
            .legend('Height multiplier')
            .onInput(() => {
                this.#terrainGrid.reset(this.#config); // Recompute maxH.
                this.#updateTerrain();
            });

        gridFolder.select(this.#config, 'renderStyle', {
            'Squares': 'quadPrism',
            'Hexagons': 'hexPrism',
            'Surface': 'surface'
        }).legend('Shape')
            .onChange(() => {
                this.#terrainRenderer.createGridMeshes();
                this.#config.needsRender = true;
            });

        gridFolder.select(this.#config, 'palette', {
            'Bright terrain': 0,
            'Continental': 1,
            'Cyberpuke': 2,
            'Black & white': 3,
            'Fantasy': 4,
            'Sunset': 5
        }).legend('Palette')
            .onChange(() => {
                this.#terrainRenderer.createGridMeshes();
                this.#config.needsRender = true;
            });

        ///////////////////////////////
        // Terrain generation folder //
        this.#terrainFolder = this.#gui.addFolder('Terrain generation');
        this.#terrainFolder.number(this.#config.gen, 'seed')
            .legend('Seed')
            .onChange(() => this.#updateTerrain());

        this.#terrainFolder.select(this.#config.gen, 'terrainAlgo', {
            'Random': 'rand',
            'Noise': 'noise',
            'Ridge': 'ridge',
            'Midpoint': 'midpoint'
        }).legend('Algorithm')
            .onChange(() => {
                this.#updateAlgorithmFolders();
                this.#updateTerrain();
            });

        //////////////////
        // Noise folder //
        const noiseFolder = this.#terrainFolder.addFolder('Noise');
        noiseFolder.range(this.#config.gen.noise, 'octaves', 1, 8, 1)
            .legend('Octaves')
            .onInput(() => this.#updateTerrain());
        noiseFolder.range(this.#config.gen.noise, 'persistence', 0.1, 1.0, 0.05)
            .legend('Persistence')
            .onInput(() => this.#updateTerrain());
        noiseFolder.range(this.#config.gen.noise, 'lacunarity', 1.1, 4.0, 0.1)
            .legend('Lacunarity')
            .onInput(() => this.#updateTerrain());
        noiseFolder.range(this.#config.gen.noise, 'fundamental', 0.1, 5.0, 0.1)
            .legend('Fundamental')
            .onInput(() => this.#updateTerrain());
        noiseFolder.range(this.#config.gen.noise, 'warpingStrength', 0.0, 0.5, 0.01)
            .legend('Warping strength')
            .onInput(() => this.#updateTerrain());

        //////////////////
        // Ridge folder //
        const ridgeFolder = this.#terrainFolder.addFolder('Ridge');
        ridgeFolder.bool(this.#config.gen.noise.ridge, 'invertSignal')
            .legend('Invert signal')
            .onChange(() => this.#updateTerrain());
        ridgeFolder.bool(this.#config.gen.noise.ridge, 'squareSignal')
            .legend('Square signal')
            .onChange(() => this.#updateTerrain());
        ridgeFolder.select(this.#config.gen.noise.ridge, 'style', {
            'Octavian': 'octavian',
            'Melodic': 'melodic'
        }).legend('Ridge Style')
            .onChange(() => this.#updateTerrain());

        /////////////////////
        // Midpoint folder //
        const midpointFolder = this.#terrainFolder.addFolder('Midpoint');
        midpointFolder.range(this.#config.gen, 'midpointRoughness', 0.4, 0.8, 0.02)
            .legend('Roughness')
            .onInput(() => this.#updateTerrain());

        ///////////////////
        // Avatar folder //
        const avatarFolder = this.#gui.addFolder('Avatar').close();
        avatarFolder.range(this.#config.avatar, 'size', 0.1, 2.0, 0.1)
            .legend('Size')
            .onInput(() => {
                this.#terrainRenderer.updateAvatarScale();
            });
        avatarFolder.range(this.#config.avatar, 'heightOffset', 0.0, 2.0, 0.1)
            .legend('Height offset')
            .onInput(() => {
                this.#terrainRenderer.updateAvatarPosition();
            });

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
        const title2algo = {
            'Noise': ['noise', 'ridge'],
            'Ridge': ['ridge'],
            'Midpoint': ['midpoint'],
        }

        this.#terrainFolder.folders.forEach(folder => {
            const mustShow = title2algo[folder.title];
            if (mustShow.includes(this.#config.gen.terrainAlgo)) {
                folder.show();
            } else {
                folder.hide();
            }
        });
    }

    updateFPS() {
        this.#fpsController.update(Math.round(this.#fps.update()));
    }

    #updateTerrain() {
        this.#terrainGrid.reset(this.#config);
        this.#terrainGrid.generate();
        this.#terrainRenderer.createGridMeshes();
        this.#terrainRenderer.updateAvatarPosition();
        this.#config.needsRender = true;
    }
}
