import { Grid } from './terrain.js';
import { TerrainRenderer } from './renderer.js';
import { UI } from './ui.js';
import { palettes } from './palettes.js';

const config = {
    // Grid configuration.
    gridPower: 5, // Power of the grid (one side is )
    get gridSize() {
        return 2**this.gridPower + 1;
    },

    // Visualization options.
    renderStyle: 'quadPrism', // How the terrain is rendered (quadPrism, hexPrism, surface).
    palette: 0,               // Index of the color palette to use.
    heightMultiplier: 1.0,    // Multiplier for the terrain height.

    // Generation settings.
    gen: {
        seed: 23,               // Seed for deterministic terrain generation.
        terrainAlgo: 'ridge',   // Terrain creation algorithm (ridge, rand, noise, midpoint).
        midpointRoughness: 0.6, // Roughness factor for midpoint displacement.
        noise: {
            octaves: 6,         // Simplex Noise octaves to layer.
            persistence: 0.65,  // Amplitude reduction per octave.
            lacunarity: 1.5,    // Frequency increase per octave.
            fundamental: 1.1,   // Base frequency for noise.
            warpingStrength: 0, // Warping strength for noise coordinates.
            ridge: {
                invertSignal: true,  // Invert signal for ridges (1 - abs(noise)) vs valleys (abs(noise)).
                squareSignal: false, // Square the signal to sharpen ridges/valleys.
                style: 'octavian',   // Style of ridge generation (octavian, melodic).
            },
        },
    },

    // Player avatar.
    avatar: {
        x: undefined,
        y: undefined,
        size: .5,         // Avatar sphere radius (cell size multiplier).
        heightOffset: .5, // How high above the terrain the avatar floats (cell size multiplier).
    },

    // Render settings.
    needsRender: true, // Whether the frame should be updated.
};

function initializeApplication(config, palettes) {
    // 1. Create the Terrain Grid Data Structure.
    const terrainGrid = new Grid(config);
    terrainGrid[config.gen.terrainAlgo](); // Perform initial generation.
    config.avatar.x = config.avatar.y = Math.floor(terrainGrid.size / 2); // Place avatar in the middle.

    // 2. Create the Renderer (handles THREE.js scene, camera, meshes).
    // It performs the initial scene setup and mesh creation in its constructor.
    const terrainRenderer = new TerrainRenderer(terrainGrid, config, palettes);

    // 3. Create the UI Handler.
    // It sets up listeners and interacts with config, terrainGrid, and terrainRenderer.
    // Pass the initial terrainGrid; UI will manage updates/replacements.
	// The UI being an object is only a convenience to setup everything, is doesn't need to be persisted.
    new UI(config, terrainGrid, terrainRenderer);

    return terrainRenderer;
}

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

function startAnimationLoop(config, terrainRenderer) {
    const gui = new lil.GUI();
    gui.add(config, 'needsRender').name('Needs Render (Debug)').hide(); // Debug control

    const fps = new FpsCounter();
    const fpsController = gui.add({ fps: 0 }, 'fps').name('FPS').disable();

    function animate() {
        requestAnimationFrame(animate);
        fpsController.setValue(fps.update());

        // Only render if something has changed or controls are active.
        const controlsUpdated = terrainRenderer.controls.update(); // Required because of damping.
        if (config.needsRender || controlsUpdated) {
            terrainRenderer.renderer.render(terrainRenderer.scene, terrainRenderer.camera);
            config.needsRender = false;
        }
    }
    animate();
}

function main() {
    const terrainRenderer = initializeApplication(config, palettes);
    startAnimationLoop(config, terrainRenderer);
}

main();
