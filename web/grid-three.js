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
    noiseOctaves: 4,        // Simplex Noise octaves to layer.
    noisePersistence: 0.5,  // Amplitude reduction per octave.
    noiseLacunarity: 2.0,   // Frequency increase per octave.
    noiseFundamental: 1.0,  // Base frequency for noise.
    midpointRoughness: 0.6, // Roughness factor for midpoint displacement.
    midnoiseRatio: 0.7,     // Midpoint vs Noise ratio (0=noise, 1=midpoint).

    // Color settings.
    palette: 0,
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

    // 4. Animation Loop.
    function animate() {
        requestAnimationFrame(animate);
        terrainRenderer.controls.update(); // Required because of damping.
        terrainRenderer.renderer.render(terrainRenderer.scene, terrainRenderer.camera);
    }
    animate();
}

main();
