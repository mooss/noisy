import { createGridMeshes } from './renderer.js';
import { Grid } from './terrain.js';

export function setupUIListeners(
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
) {
    const state = {
        gridSize,
        gridPower,
        rngSeed,
        useHexagons,
        useSurface,
        currentPalette,
        currentGenerationMethod
    };

    ///////////////
    // Grid size //
    const gridSizeSlider = document.getElementById('grid-size-slider');
    const gridSizeValue = document.getElementById('grid-size-value');

    // Initial values.
    gridSizeValue.textContent = state.gridSize;
    gridSizeSlider.value = state.gridPower;

    gridSizeSlider.addEventListener('input', () => {
        state.gridPower = parseInt(gridSizeSlider.value);
        state.gridSize = 2**state.gridPower + 1;
        gridSizeValue.textContent = state.gridSize;

        // Regenerate with new size.
        terrainGrid = new Grid(state.gridSize, state.rngSeed);
        terrainGrid[state.currentGenerationMethod]();
        createGridMeshes(terrainGrid, terrainMeshes, state.useHexagons, state.useSurface, palettes, state.currentPalette);
    });

    ////////////////////////
    // Terrain generation //
    document.getElementById('btn-random').addEventListener('click', () => {
        state.currentGenerationMethod = 'rand';
        terrainGrid.rand();
        createGridMeshes(terrainGrid, terrainMeshes, state.useHexagons, state.useSurface, palettes, state.currentPalette);
    });

    document.getElementById('btn-noise').addEventListener('click', () => {
        state.currentGenerationMethod = 'noise';
        terrainGrid.noise();
        createGridMeshes(terrainGrid, terrainMeshes, state.useHexagons, state.useSurface, palettes, state.currentPalette);
    });

    document.getElementById('btn-midpoint').addEventListener('click', () => {
        state.currentGenerationMethod = 'midpoint';
        terrainGrid.midpoint();
        createGridMeshes(terrainGrid, terrainMeshes, state.useHexagons, state.useSurface, palettes, state.currentPalette);
    });

    document.getElementById('btn-midnoise').addEventListener('click', () => {
        state.currentGenerationMethod = 'midnoise';
        terrainGrid.midnoise();
        createGridMeshes(terrainGrid, terrainMeshes, state.useHexagons, state.useSurface, palettes, state.currentPalette);
    });

    document.getElementById('btn-new-seed').addEventListener('click', () => {
        state.rngSeed++;
        terrainGrid = new Grid(state.gridSize, state.rngSeed);
        terrainGrid[state.currentGenerationMethod]();
        createGridMeshes(terrainGrid, terrainMeshes, state.useHexagons, state.useSurface, palettes, state.currentPalette);
    });

    ////////////
    // Shapes //
    document.querySelectorAll('input[name="shape"]').forEach(radio => {
        radio.addEventListener('change', (event) => {
            const shape = event.target.value;
            if (shape === 'squares') {
                state.useHexagons = false;
                state.useSurface = false;
            } else if (shape === 'hexagons') {
                state.useHexagons = true;
                state.useSurface = false;
            } else if (shape === 'surface') {
                state.useHexagons = false;
                state.useSurface = true;
            }
            createGridMeshes(terrainGrid, terrainMeshes, state.useHexagons, state.useSurface, palettes, state.currentPalette);
        });
    });

    // Set initial radio button state based on default variables.
    if (state.useSurface) {
        document.getElementById('shape-surface').checked = true;
    } else if (state.useHexagons) {
        document.getElementById('shape-hexagons').checked = true;
    } else {
        document.getElementById('shape-squares').checked = true;
    }

    ////////////
    // Colors //
    document.getElementById('btn-palette').addEventListener('click', () => {
        state.currentPalette = (state.currentPalette + 1) % palettes.length;
        createGridMeshes(terrainGrid, terrainMeshes, state.useHexagons, state.useSurface, palettes, state.currentPalette);
    });

    return state;
}
