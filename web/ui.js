import { Grid } from './terrain.js';

export class UI {
    #config;
    #terrainGrid;
    #terrainRenderer;
    #palettes;

    // Left panel DOM elements.
    #gridSizeValue; // Size of the grid (2^n + 1).
    #shapeRadios;

    // Right panel DOM elements.
    #terrainPanel;
    #terrainButtonsContainer;
    #terrainButtons;
    #terrainParamsContainer;

    constructor(config, terrainGrid, terrainRenderer, palettes) {
        this.#config = config;
        this.#terrainGrid = terrainGrid; // Initial grid reference.
        this.#terrainRenderer = terrainRenderer;
        this.#palettes = palettes;

        // Left panel.
        this.#gridSizeValue = document.getElementById('grid-size-value');
        this.#shapeRadios = document.querySelectorAll('input[name="shape"]');

        // Right panel.
        this.#terrainPanel = document.getElementById('terrain-panel');
        this.#terrainButtonsContainer = document.getElementById('terrain-buttons');
        this.#terrainButtons = this.#terrainButtonsContainer.querySelectorAll('button');
        this.#terrainParamsContainer = document.getElementById('terrain-params');

        this.#setupInitialState();
        this.#setupListeners();
    }

    // Generic slider setup helper.
    #setupSlider(sliderId, valueId, configKey, options) {
        const slider = document.getElementById(sliderId);
        const valueElement = document.getElementById(valueId);
        const { isInteger = false, valueFormat = (v) => v, onUpdate = () => {} } = options;

        if (!slider || !valueElement) {
            console.error(`Slider or value element not found for ${sliderId}/${valueId}`);
            return;
        }

        // Set initial state.
        const initialValue = this.#config[configKey];
        slider.value = initialValue;
        valueElement.textContent = valueFormat(initialValue);

        // Attach listener.
        slider.addEventListener('input', () => {
            const rawValue = slider.value;
            const newValue = isInteger ? parseInt(rawValue) : parseFloat(rawValue);

            this.#config[configKey] = newValue;
            valueElement.textContent = valueFormat(newValue);
            onUpdate(newValue); // Execute the callback.
            this.#config.needsRender = true;
        });
    }

    // Sets the initial state of UI elements based on config.
    #setupInitialState() {
        this.#updateActiveParams(this.#config.terrainAlgo);

        /////////////
        // Sliders //
        this.#setupSlider('grid-size-slider', 'grid-size-value', 'gridPower', {
            isInteger: true,
            valueFormat: () => this.#config.gridSize, // Display calculated size
            onUpdate: () => {
                // Update calculated display.
                this.#gridSizeValue.textContent = this.#config.gridSize;

                // Compute heights.
                this.#terrainGrid = new Grid(this.#config);
                this.#terrainGrid[this.#config.terrainAlgo]();

                // Render terrain.
                this.#terrainRenderer.setTerrainGrid(this.#terrainGrid);
                this.#terrainRenderer.createGridMeshes();
            }
        });

        this.#setupSlider('noise-octaves-slider', 'noise-octaves-value', 'noiseOctaves', {
            isInteger: true,
            onUpdate: () => this.#regenerateNoise()
        });

        this.#setupSlider('noise-persistence-slider', 'noise-persistence-value', 'noisePersistence', {
            valueFormat: (v) => v.toFixed(2),
            onUpdate: () => this.#regenerateNoise()
        });

        this.#setupSlider('noise-lacunarity-slider', 'noise-lacunarity-value', 'noiseLacunarity', {
            valueFormat: (v) => v.toFixed(1),
            onUpdate: () => this.#regenerateNoise()
        });

        this.#setupSlider('noise-fundamental-slider', 'noise-fundamental-value', 'noiseFundamental', {
            valueFormat: (v) => v.toFixed(1),
            onUpdate: () => this.#regenerateNoise()
        });

        this.#setupSlider('midpoint-roughness-slider', 'midpoint-roughness-value', 'midpointRoughness', {
            valueFormat: (v) => v.toFixed(2),
            onUpdate: () => this.#regenerateNoise() // Regenerate handles midpoint too
        });


        ///////////////////
        // Checkboxes    //
        document.getElementById('ridge-invert-checkbox').checked = this.#config.ridgeInvertSignal;
        document.getElementById('ridge-square-checkbox').checked = this.#config.ridgeSquareSignal;

        ///////////////////
        // Radio buttons //
        const initialShapeRadio = document.querySelector(`input[name="shape"][value="${this.#config.renderStyle}"]`);
        if (initialShapeRadio) {
            initialShapeRadio.checked = true;
        } else {
            document.getElementById('shape-quadPrism').checked = true; // Default to quad prism.
        }
    }

    // Helper to regenerate terrain only if the active terrain algorithm uses noise parameters.
    #regenerateNoise() {
        this.#terrainGrid.setConfig(this.#config);
        this.#terrainGrid[this.#config.terrainAlgo]();
        this.#terrainRenderer.createGridMeshes();
        this.#config.needsRender = true;
    }

    // Attaches event listeners to UI elements.
    #setupListeners() {
        // Grid size slider listener is attached in #setupSlider.

        // Terrain algorithm buttons.
        this.#terrainButtons.forEach(button => {
            button.addEventListener('click', this.#handleTerrainButtonClick.bind(this));
        });

        // New seed button.
        document.getElementById('btn-new-seed').addEventListener('click', this.#handleNewSeed.bind(this));

        // Noise parameter listeners are attached in #setupSlider.

        // Ridge parameter checkboxes.
        document.getElementById('ridge-invert-checkbox').addEventListener('change', (e) => {
            this.#config.ridgeInvertSignal = e.target.checked;
            this.#regenerateNoise();
        });
        document.getElementById('ridge-square-checkbox').addEventListener('change', (e) => {
            this.#config.ridgeSquareSignal = e.target.checked;
            this.#regenerateNoise();
        });

        // Shape radio buttons.
        this.#shapeRadios.forEach(radio => {
            radio.addEventListener('change', this.#handleShapeChange.bind(this));
        });

        // Cycle palette button.
        document.getElementById('btn-palette').addEventListener('click', this.#handlePaletteChange.bind(this));

    }

    ////////////////////
    // Event handlers //

    // Shows/hides parameter sections and updates button styles based on the current terrain
    // algorithm.
    #updateActiveParams(activeTerrainAlgo) {
        // Update parameter sections visibility.
        this.#terrainParamsContainer.querySelectorAll('.param-section').forEach(section => {
            if (section.dataset.terrainAlgos.split(' ').includes(activeTerrainAlgo)) {
                section.classList.add('active');
            } else {
                section.classList.remove('active');
            }
        });

        // Update button active states.
        this.#terrainButtons.forEach(button => {
            if (button.dataset.terrainAlgo === activeTerrainAlgo) {
                button.classList.add('active-terrain-algo');
            } else {
                button.classList.remove('active-terrain-algo');
            }
        });
        this.#config.needsRender = true;
    }

    // Handles clicks on the terrain algorithm buttons.
    #handleTerrainButtonClick(event) {
        const button = event.target;
        const newTerrainAlgo = button.dataset.terrainAlgo;

        // Do nothing if clicking the current terrain algorithm.
        if (newTerrainAlgo === this.#config.terrainAlgo) return;

        this.#config.terrainAlgo = newTerrainAlgo;
        this.#updateActiveParams(newTerrainAlgo); // Update params visibility and button styles.

        // Generate terrain with the new terrain algorithm.
        this.#terrainGrid.setConfig(this.#config);
        this.#terrainGrid[newTerrainAlgo]();
        this.#terrainRenderer.createGridMeshes();
        this.#config.needsRender = true;
    }

    // Handles click on the "New Seed" button.
    #handleNewSeed() {
        this.#config.rngSeed++;

        // Update the parameters on the existing grid instance.
        this.#terrainGrid.setConfig(this.#config);

        // Regenerate using the current algorithm.
        this.#terrainGrid[this.#config.terrainAlgo]();
        this.#terrainRenderer.createGridMeshes();
        this.#config.needsRender = true;
    }

    // Handles changes to the shape radio buttons.
    #handleShapeChange(event) {
        const newStyle = event.target.value;
        this.#config.renderStyle = newStyle;
        this.#terrainRenderer.createGridMeshes();
        this.#config.needsRender = true;
    }

    // Handles click on the "Cycle Palette" button.
    #handlePaletteChange() {
        this.#config.palette = (this.#config.palette + 1) % this.#palettes.length;
        this.#terrainRenderer.createGridMeshes();
        this.#config.needsRender = true;
    }
}
