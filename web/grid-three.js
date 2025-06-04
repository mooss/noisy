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

    // Generation settings.
    rngSeed: 23,              // Seed for deterministic terrain generation.
    terrainAlgo: 'ridge',     // Terrain creation algorithm (ridge, rand, noise, midpoint).
    ridgeInvertSignal: true,  // Invert signal for ridges (1 - abs(noise)) vs valleys (abs(noise)).
    ridgeSquareSignal: false, // Square the signal to sharpen ridges/valleys.
    ridgeStyle: 'octavian',   // Style of ridge generation (octavian, melodic).
    noiseOctaves: 6,          // Simplex Noise octaves to layer.
    noisePersistence: 0.65,   // Amplitude reduction per octave.
    noiseLacunarity: 1.5,     // Frequency increase per octave.
    noiseFundamental: 1.1,    // Base frequency for noise.
	noiseWarpingStrength: 0.0,  // Warping strength for noise coordinates.
    midpointRoughness: 0.6,   // Roughness factor for midpoint displacement.

    // Render settings.
    needsRender: true,        // Whether the frame should be rendered.
};

function initializeApplication(config, palettes) {
    // 1. Create the Terrain Grid Data Structure.
    // The UI class will create new Grid instances when size changes.
    const terrainGrid = new Grid(config);
    terrainGrid[config.terrainAlgo](); // Perform initial generation.

    // 2. Create the Renderer (handles THREE.js scene, camera, meshes).
    // It performs the initial scene setup and mesh creation in its constructor.
    const terrainRenderer = new TerrainRenderer(terrainGrid, config, palettes);

    // 3. Create the UI Handler.
    // It sets up listeners and interacts with config, terrainGrid, and terrainRenderer.
    // Pass the initial terrainGrid; UI will manage updates/replacements.
	// The UI being an object is only a convenience to setup everything, is doesn't need to be persisted.
    new UI(config, terrainGrid, terrainRenderer, palettes);

    return terrainRenderer;
}

class FpsCounter {
    constructor(elementId) {
        this.element = document.getElementById(elementId);
        this.previous = performance.now();
        this.frames = 0;
        this.updateIntervalMs = 100; // Update FPS display every 100 milliseconds.
    }

    update() {
        const current = performance.now();
        this.frames++;
        const delta = current - this.previous;

        if (delta >= this.updateIntervalMs) {
            const fps = (this.frames / (delta / 1000)).toFixed(1);
            if (this.element) {
                this.element.textContent = `FPS: ${fps}`;
            }
            this.frames = 0;
            this.previous = current;
        }
    }
}

function startAnimationLoop(config, terrainRenderer, fpsCounter) {
    function animate() {
        requestAnimationFrame(animate);

        fpsCounter.update();

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
    const fpsCounter = new FpsCounter('fps-counter');
    startAnimationLoop(config, terrainRenderer, fpsCounter);
}

main();
