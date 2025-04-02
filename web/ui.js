import { Grid } from './terrain.js';

export class UI {
    #config;
    #terrainGrid;
    #terrainRenderer;
    #palettes;

    // Left panel DOM elements.
    #gridSizeSlider;
    #gridSizeValue;
    #shapeRadios;

    // Right panel DOM elements.
    #toggleTerrainPanelButton;
    #terrainPanel;

    constructor(config, terrainGrid, terrainRenderer, palettes) {
        this.#config = config;
        this.#terrainGrid = terrainGrid; // Initial grid reference.
        this.#terrainRenderer = terrainRenderer;
        this.#palettes = palettes;

        // Left panel.
        this.#gridSizeSlider = document.getElementById('grid-size-slider');
        this.#gridSizeValue = document.getElementById('grid-size-value');
        this.#shapeRadios = document.querySelectorAll('input[name="shape"]');

        // Right panel.
        this.#toggleTerrainPanelButton = document.getElementById('toggle-terrain-panel');
        this.#terrainPanel = document.getElementById('terrain-panel');

        this.#setupInitialState();
        this.#setupListeners();
    }

    // Sets the initial state of UI elements based on config.
    #setupInitialState() {
        // Grid size.
        this.#gridSizeValue.textContent = this.#config.gridSize;
        this.#gridSizeSlider.value = this.#config.gridPower;

        // Check the radio button corresponding to the initial renderStyle.
        const initialShapeRadio = document.querySelector(`input[name="shape"][value="${this.#config.renderStyle}"]`);
        if (initialShapeRadio) {
            initialShapeRadio.checked = true;
        } else {
            document.getElementById('shape-quadPrism').checked = true; // Default to quad prism.
        }
    }

    // Attaches event listeners to UI elements.
    #setupListeners() {
        // Grid size slider.
        this.#gridSizeSlider.addEventListener('input', this.#handleGridSizeChange.bind(this));

        // Tettain generation buttons.
        document.getElementById('btn-random').addEventListener('click', () => this.#handleTerrainGeneration('rand'));
        document.getElementById('btn-noise').addEventListener('click', () => this.#handleTerrainGeneration('noise'));
        document.getElementById('btn-midpoint').addEventListener('click', () => this.#handleTerrainGeneration('midpoint'));
        document.getElementById('btn-midnoise').addEventListener('click', () => this.#handleTerrainGeneration('midnoise'));

        // New seed button.
        document.getElementById('btn-new-seed').addEventListener('click', this.#handleNewSeed.bind(this));

        // Shape radio buttons.
        this.#shapeRadios.forEach(radio => {
            radio.addEventListener('change', this.#handleShapeChange.bind(this));
        });

        // Palette cycle button.
        document.getElementById('btn-palette').addEventListener('click', this.#handlePaletteChange.bind(this));

        // Terrain panel toggle button.
        this.#toggleTerrainPanelButton.addEventListener('click', this.#handleToggleTerrainPanel.bind(this));
    }

    ////////////////////
    // Event handlers //

    // Handles changes to the grid size slider.
    #handleGridSizeChange() {
        this.#config.gridPower = parseInt(this.#gridSizeSlider.value);
        this.#gridSizeValue.textContent = this.#config.gridSize;

        // Update the terrain with the new size.
        this.#terrainGrid = new Grid(this.#config.gridSize, this.#config.rngSeed);
        this.#terrainGrid[this.#config.method]();

        // Render the new terrain.
        this.#terrainRenderer.setTerrainGrid(this.#terrainGrid);
        this.#terrainRenderer.createGridMeshes();
    }

    // Handles clicks on terrain generation buttons.
    #handleTerrainGeneration(method) {
        this.#config.method = method;
        this.#terrainGrid[method]();
        this.#terrainRenderer.createGridMeshes();
    }

    // Handles click on the "New Seed" button.
    #handleNewSeed() {
        this.#config.rngSeed++;
        // Update the seed on the existing grid instance and regenerate.
        this.#terrainGrid.seed = this.#config.rngSeed;
        this.#terrainGrid[this.#config.method]();
        this.#terrainRenderer.createGridMeshes();
    }

    // Handles changes to the shape radio buttons.
    #handleShapeChange(event) {
        const newStyle = event.target.value;
        this.#config.renderStyle = newStyle;
        this.#terrainRenderer.createGridMeshes();
    }

    // Handles click on the "Cycle Palette" button.
    #handlePaletteChange() {
        this.#config.palette = (this.#config.palette + 1) % this.#palettes.length;
        this.#terrainRenderer.createGridMeshes();
    }

    // Handles toggling the visibility of the terrain panel content.
    #handleToggleTerrainPanel() {
        this.#terrainPanel.classList.toggle('collapsed');
    }
}
