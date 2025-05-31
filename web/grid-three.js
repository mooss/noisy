import { Grid } from './terrain.js';
import { TerrainRenderer } from './renderer.js';
import { UI } from './ui.js';
import { palettes } from './palettes.js';

//////////////////////////////
// Configuration & Settings //

/**
 * Central configuration object for terrain generation and visualization.
 *
 * Properties:
 * - gridPower:   Exponent for grid size calculation (2^n + 1).
 * - gridSize:    Calculated grid size based on gridPower.
 * - useHexagons: Toggle between square and hexagonal cells.
 * - useSurface:  Toggle between 3D surface and individual cells.
 * - rngSeed:     Initial seed for deterministic generation.
 * - terrainAlgo: Active terrain generation algorithm.
 * - palette:     Index of active color palette.
 *
 * Passed around to different modules.
 */
const config = {
    // Grid configuration.
    gridPower: 5,
    get gridSize() {
        return 2**this.gridPower + 1;
    },

    // Visualization options.
    renderStyle: 'quadPrism', // 'quadPrism', 'hexPrism', 'surface'.

    // Generation settings.
    rngSeed: 23,
    terrainAlgo: 'ridge',
    ridgeInvertSignal: true, // Invert signal for ridges (1 - abs(noise)) vs valleys (abs(noise)).
    ridgeSquareSignal: false, // Square the signal to sharpen ridges/valleys.
    noiseOctaves: 6,         // Simplex Noise octaves to layer.
    noisePersistence: 0.65,   // Amplitude reduction per octave.
    noiseLacunarity: 1.5,    // Frequency increase per octave.
    noiseFundamental: 1.1,   // Base frequency for noise.
    midpointRoughness: 0.6,  // Roughness factor for midpoint displacement.

    // Color settings.
    palette: 0,

    // Rendering flag.
    needsRender: true, // Render the first frame.
};

///////////////////
// Main Function //

function main() {
    // 1. Create the Terrain Grid Data Structure.
    // The UI class will create new Grid instances when size changes.
    let terrainGrid = new Grid(config);
    terrainGrid[config.terrainAlgo](); // Perform initial generation.

    // 2. Create the Renderer (handles THREE.js scene, camera, meshes).
    // It performs the initial scene setup and mesh creation in its constructor.
    const terrainRenderer = new TerrainRenderer(terrainGrid, config, palettes);

    // 3. Create the UI Handler.
    // It sets up listeners and interacts with config, terrainGrid, and terrainRenderer.
    // Pass the initial terrainGrid; UI will manage updates/replacements.
    const ui = new UI(config, terrainGrid, terrainRenderer, palettes);

    // 4. FPS Counter.
    const fpsCounter = document.getElementById('fps-counter');
    let lastTime = performance.now();
    let frameCount = 0;

    // 5. Animation Loop.
    function animate() {
        requestAnimationFrame(animate);

        // FPS calculation
        const currentTime = performance.now();
        frameCount++;
        const deltaTime = currentTime - lastTime;

		// Update FPS display every 100 millisecond.
        if (deltaTime >= 100) {
            const fps = (frameCount / (deltaTime / 1000)).toFixed(1);
            fpsCounter.textContent = `FPS: ${fps}`;
            frameCount = 0;
            lastTime = currentTime;
        }

        // Only render if something has changed or controls are active.
        const controlsUpdated = terrainRenderer.controls.update(); // Required because of damping.
        if (config.needsRender || controlsUpdated) {
            terrainRenderer.renderer.render(terrainRenderer.scene, terrainRenderer.camera);
            config.needsRender = false; // Reset flag after rendering.
        }
    }
    animate();
}

main();
