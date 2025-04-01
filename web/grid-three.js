import { Grid } from './terrain.js';
import { setupScene, createGridMeshes } from './renderer.js';
import { setupUIListeners } from './ui.js';
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
 * - method:      Active terrain generation algorithm.
 * - palette:     Index of active color palette.
 */
const config = {
    // Grid configuration.
    gridPower: 5,
    get gridSize() {
        return 2**this.gridPower + 1;
    },

    // Visualization options.
    useHexagons: false,
    useSurface: false,

    // Generation settings.
    rngSeed: 23,
    method: 'midpoint',

    // Color settings.
    palette: 0
};

/////////////////////////////////////////
// Three.js Initialization & Rendering //

let terrainGrid, scene, camera, renderer, controls, terrainMeshes;

// Core Three.js scene setup.
function init() {
    // Heightmap.
    terrainGrid = new Grid(config.gridSize, config.rngSeed);
    terrainGrid[config.method]();

    // Setup Three.js scene.
    const sceneSetup = setupScene(terrainGrid);
    scene = sceneSetup.scene;
    camera = sceneSetup.camera;
    renderer = sceneSetup.renderer;
    controls = sceneSetup.controls;
    terrainMeshes = sceneSetup.terrainMeshes;
    createGridMeshes(terrainGrid, terrainMeshes, config.useHexagons, config.useSurface, palettes, config.palette);

    // Setup UI event listeners.
    setupUIListeners(
        terrainGrid,
        terrainMeshes,
        config.gridSize,
        config.gridPower,
        config.rngSeed,
        config.useHexagons,
        config.useSurface,
        palettes,
        config.palette,
        config.method
    );
}

function animate() {
    requestAnimationFrame(animate);
    controls.update(); // Required because of damping.
    renderer.render(scene, camera);
}

init();
animate();
