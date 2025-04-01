import { Grid } from './terrain.js';
import { setupScene, createGridMeshes } from './renderer.js';
import { setupUIListeners } from './ui.js';
import { palettes } from './palettes.js';

//////////////////////////////
// Configuration & Settings //

// The grid size needs to be 2^n + 1 for midpoint displacement.
let gridPower = 5;
let gridSize = 2**gridPower + 1;

// Toggle between squares and hexagons.
let useHexagons = false;

// Toggle between 3D surface and individual cells.
let useSurface = false;

// Initial seed to allow for deterministic generation.
let rngSeed = 23;

// Terrain generation method.
let currentGenerationMethod = 'midpoint';

// Current palette index
let currentPalette = 0;

/////////////////////////////////////////
// Three.js Initialization & Rendering //

let terrainGrid, scene, camera, renderer, controls, terrainMeshes;

// Core Three.js scene setup.
function init() {
    // Heightmap.
    terrainGrid = new Grid(gridSize, rngSeed);
    terrainGrid[currentGenerationMethod]();

    // Setup Three.js scene.
    const sceneSetup = setupScene(terrainGrid);
    scene = sceneSetup.scene;
    camera = sceneSetup.camera;
    renderer = sceneSetup.renderer;
    controls = sceneSetup.controls;
    terrainMeshes = sceneSetup.terrainMeshes;
    createGridMeshes(terrainGrid, terrainMeshes, useHexagons, useSurface, palettes, currentPalette);

    // Setup UI event listeners.
    setupUIListeners(
        terrainGrid,
        terrainMeshes,
        gridSize,
        gridPower,
        rngSeed,
        useHexagons,
        useSurface,
        palettes,
        currentPalette,
        currentGenerationMethod
    );
}

function animate() {
    requestAnimationFrame(animate);
    controls.update(); // Required because of damping.
    renderer.render(scene, camera);
}

init();
animate();
