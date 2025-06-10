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

    // Chunking system.
    chunks: {
        enabled: false, // Toggle chunk system on/off.
        radius: 1,      // Number of chunks in each direction from center chunk.
        get totalChunks() {
            return (this.radius * 2 + 1)**2;
        },
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
    const ui = new UI(config, terrainGrid, terrainRenderer);

    return [terrainRenderer, ui];
}

function startAnimationLoop(config, terrainRenderer, ui) {
    function animate() {
        requestAnimationFrame(animate);
        ui.updateFPS();

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
    const [terrainRenderer, ui] = initializeApplication(config, palettes);
    startAnimationLoop(config, terrainRenderer, ui);
}

main();
