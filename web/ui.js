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
    #terrainMethodButtonsContainer;
    #methodButtons;
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
        this.#terrainMethodButtonsContainer = document.getElementById('terrain-method-buttons');
        this.#methodButtons = this.#terrainMethodButtonsContainer.querySelectorAll('button');
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
        });
    }

    // Sets the initial state of UI elements based on config.
    #setupInitialState() {
        this.#updateActiveParams(this.#config.method);

        /////////////
        // Sliders //
        this.#setupSlider('grid-size-slider', 'grid-size-value', 'gridPower', {
            isInteger: true,
            valueFormat: () => this.#config.gridSize, // Display calculated size
            onUpdate: () => {
                // Special handling for grid size: recreate grid and renderer connection.
                this.#gridSizeValue.textContent = this.#config.gridSize; // Update calculated display.
                this.#terrainGrid = new Grid(this.#config.gridSize, this.#config.rngSeed);
                this.#terrainGrid[this.#config.method](this.#config);
                this.#terrainRenderer.setTerrainGrid(this.#terrainGrid);
                this.#terrainRenderer.createGridMeshes();
            }
        });

        this.#setupSlider('noise-octaves-slider', 'noise-octaves-value', 'noiseOctaves', {
            isInteger: true,
            onUpdate: () => this.#regenerateNoiseIfNeeded()
        });

        this.#setupSlider('noise-persistence-slider', 'noise-persistence-value', 'noisePersistence', {
            valueFormat: (v) => v.toFixed(2),
            onUpdate: () => this.#regenerateNoiseIfNeeded()
        });

        this.#setupSlider('noise-lacunarity-slider', 'noise-lacunarity-value', 'noiseLacunarity', {
            valueFormat: (v) => v.toFixed(1),
            onUpdate: () => this.#regenerateNoiseIfNeeded()
        });


        ///////////////////
        // Radio buttons //
        const initialShapeRadio = document.querySelector(`input[name="shape"][value="${this.#config.renderStyle}"]`);
        if (initialShapeRadio) {
            initialShapeRadio.checked = true;
        } else {
            document.getElementById('shape-quadPrism').checked = true; // Default to quad prism.
        }
    }

    // Helper to regenerate terrain only if noise method is active.
    #regenerateNoiseIfNeeded() {
        if (this.#config.method === 'noise') {
            this.#terrainGrid.noise(this.#config);
            this.#terrainRenderer.createGridMeshes();
        }
    }

    // Attaches event listeners to UI elements.
    #setupListeners() {
        // Grid size slider listener is attached in #setupSlider.

        // Terrain algorithm buttons.
        this.#methodButtons.forEach(button => {
            button.addEventListener('click', this.#handleTerrainMethodButtonClick.bind(this));
        });

        // New seed button.
        document.getElementById('btn-new-seed').addEventListener('click', this.#handleNewSeed.bind(this));

        // Noise parameter listeners are attached in #setupSlider.

        // Shape radio buttons.
        this.#shapeRadios.forEach(radio => {
            radio.addEventListener('change', this.#handleShapeChange.bind(this));
        });

        // Cycle palette button.
        document.getElementById('btn-palette').addEventListener('click', this.#handlePaletteChange.bind(this));

    }

    ////////////////////
    // Event handlers //

    // Grid size change is now handled by the onUpdate callback in #setupSlider.

    // Shows/hides parameter sections and updates button styles based on the active method.
    #updateActiveParams(activeMethod) {
        // Update parameter sections visibility.
        this.#terrainParamsContainer.querySelectorAll('.param-section').forEach(section => {
            if (section.dataset.method === activeMethod) {
                section.classList.add('active');
            } else {
                section.classList.remove('active');
            }
        });

        // Update button active states.
        this.#methodButtons.forEach(button => {
            if (button.dataset.method === activeMethod) {
                button.classList.add('active-method');
            } else {
                button.classList.remove('active-method');
            }
        });
    }

    // Handles clicks on the terrain algorithm buttons.
    #handleTerrainMethodButtonClick(event) {
        const button = event.target;
        const newMethod = button.dataset.method;

        if (newMethod === this.#config.method) return; // Do nothing if clicking the already active method.

        this.#config.method = newMethod;
        this.#updateActiveParams(newMethod); // Update params visibility and button styles.

        // Generate terrain with the new method and current config.
        this.#terrainGrid[newMethod](this.#config);
        this.#terrainRenderer.createGridMeshes();
    }

    // Handles click on the "New Seed" button.
    #handleNewSeed() {
        this.#config.rngSeed++;
        // Update the seed on the existing grid instance and regenerate.
        this.#terrainGrid.seed = this.#config.rngSeed;
        this.#terrainGrid[this.#config.method](this.#config);
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
}
