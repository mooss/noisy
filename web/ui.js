import { Grid } from './terrain.js';

export class UI {
    #config;
    #terrainGrid;
    #terrainRenderer;
    #palettes;

    // DOM Elements
    #gridSizeSlider;
    #gridSizeValue;
    #shapeRadios;

    constructor(config, terrainGrid, terrainRenderer, palettes) {
        this.#config = config;
        this.#terrainGrid = terrainGrid; // Initial grid reference
        this.#terrainRenderer = terrainRenderer;
        this.#palettes = palettes;

        this.#gridSizeSlider = document.getElementById('grid-size-slider');
        this.#gridSizeValue = document.getElementById('grid-size-value');
        this.#shapeRadios = document.querySelectorAll('input[name="shape"]');

        this.#setupInitialState();
        this.#setupListeners();
    }

    // Sets the initial state of UI elements based on config.
    #setupInitialState() {
        // Grid size
        this.#gridSizeValue.textContent = this.#config.gridSize;
        this.#gridSizeSlider.value = this.#config.gridPower;

        // Shape
        if (this.#config.useSurface) {
            document.getElementById('shape-surface').checked = true;
        } else if (this.#config.useHexagons) {
            document.getElementById('shape-hexagons').checked = true;
        } else {
            document.getElementById('shape-squares').checked = true;
        }
    }

    // Attaches event listeners to UI elements.
    #setupListeners() {
        // Grid size slider
        this.#gridSizeSlider.addEventListener('input', this.#handleGridSizeChange.bind(this));

        // Generation buttons
        document.getElementById('btn-random').addEventListener('click', () => this.#handleGeneration('rand'));
        document.getElementById('btn-noise').addEventListener('click', () => this.#handleGeneration('noise'));
        document.getElementById('btn-midpoint').addEventListener('click', () => this.#handleGeneration('midpoint'));
        document.getElementById('btn-midnoise').addEventListener('click', () => this.#handleGeneration('midnoise'));

        // New seed button
        document.getElementById('btn-new-seed').addEventListener('click', this.#handleNewSeed.bind(this));

        // Shape radio buttons
        this.#shapeRadios.forEach(radio => {
            radio.addEventListener('change', this.#handleShapeChange.bind(this));
        });

        // Palette cycle button
        document.getElementById('btn-palette').addEventListener('click', this.#handlePaletteChange.bind(this));
    }

    // Handles changes to the grid size slider.
    #handleGridSizeChange() {
        this.#config.gridPower = parseInt(this.#gridSizeSlider.value);
        // No direct setting of gridSize on config, rely on getter.
        this.#gridSizeValue.textContent = this.#config.gridSize;

        // Create a new grid instance with the updated size and existing seed.
        // Note: This replaces the terrainGrid reference held by the UI and potentially the renderer if not updated.
        // It's crucial that TerrainRenderer gets the updated grid reference.
        // We'll pass the new grid to the renderer's update method.
        this.#terrainGrid = new Grid(this.#config.gridSize, this.#config.rngSeed);
        this.#terrainGrid[this.#config.method](); // Generate with the current method

        // Update the renderer with the new grid and redraw.
        // We need a way for the renderer to accept a new grid. Let's assume createGridMeshes can handle this for now,
        // or add a dedicated method like `setTerrainGrid`. For simplicity, let's update the renderer's internal reference.
        this.#terrainRenderer.setTerrainGrid(this.#terrainGrid); // Assumes TerrainRenderer has a setter method
        this.#terrainRenderer.createGridMeshes();
    }

    // Handles clicks on terrain generation buttons.
    #handleGeneration(method) {
        this.#config.method = method;
        this.#terrainGrid[method](); // Call the generation method on the current grid
        this.#terrainRenderer.createGridMeshes(); // Redraw meshes
    }

    // Handles click on the "New Seed" button.
    #handleNewSeed() {
        this.#config.rngSeed++;
        // Update the seed on the existing grid instance and regenerate.
        this.#terrainGrid.seed = this.#config.rngSeed; // Use the setter
        this.#terrainGrid[this.#config.method](); // Regenerate
        this.#terrainRenderer.createGridMeshes(); // Redraw
    }

    // Handles changes to the shape radio buttons.
    #handleShapeChange(event) {
        const shape = event.target.value;
        this.#config.useHexagons = (shape === 'hexagons');
        this.#config.useSurface = (shape === 'surface');
        this.#terrainRenderer.createGridMeshes(); // Redraw with new shape setting
    }

    // Handles click on the "Cycle Palette" button.
    #handlePaletteChange() {
        this.#config.palette = (this.#config.palette + 1) % this.#palettes.length;
        this.#terrainRenderer.createGridMeshes(); // Redraw with new palette
    }
}

// We might need to add a setter to TerrainRenderer for the grid
// Example (add this to TerrainRenderer class in renderer.js if needed):
/*
    setTerrainGrid(newGrid) {
        this.#terrainGrid = newGrid;
        // Potentially update camera distance based on new grid size here as well
        const camDist = this.#terrainGrid.size * this.#terrainGrid.cellSize * 1.2 + 50;
        this.#camera.far = camDist * 2; // Adjust far plane
        // Reposition camera? Maybe not necessary unless grid size changes drastically
        this.#camera.updateProjectionMatrix();
    }
*/
