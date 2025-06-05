import { Grid } from './terrain.js';

export class UI {
    #config;
    #terrainGrid;
    #terrainRenderer;
    #palettes;

    // Left panel DOM elements.
    #gridSizeValue; // Size of the grid (2^n + 1).
    #shapeRadios;
    #seedInput;

    // Right panel DOM elements.
    #terrainButtonsContainer;
    #terrainButtons;
    #terrainParamsContainer;
    #ridgeStyleRadios;

    constructor(config, terrainGrid, terrainRenderer, palettes) {
        this.#config = config;
        this.#terrainGrid = terrainGrid; // Initial grid reference.
        this.#terrainRenderer = terrainRenderer;
        this.#palettes = palettes;

        // Left panel.
        this.#gridSizeValue = document.getElementById('grid-size-value');
        this.#shapeRadios = document.querySelectorAll('input[name="shape"]');
        this.#seedInput = document.getElementById('seed-input');

        // Right panel.
        this.#terrainButtonsContainer = document.getElementById('terrain-buttons');
        this.#terrainButtons = this.#terrainButtonsContainer.querySelectorAll('button');
        this.#terrainParamsContainer = document.getElementById('terrain-params');
        this.#ridgeStyleRadios = document.querySelectorAll('input[name="ridge-style"]');

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

        this.#setupSlider('height-multiplier-slider', 'height-multiplier-value', 'heightMultiplier', {
            valueFormat: (v) => v.toFixed(2),
            onUpdate: () => {
                // Recompute the maxH on the existing grid instance.
                this.#terrainGrid.setConfig(this.#config);
                // Re-render the terrain with the new height. No need to regenerate data.
                this.#regenerateTerrain();
            }
        });

        this.#setupSlider('noise-octaves-slider', 'noise-octaves-value', 'noiseOctaves', {
            isInteger: true,
            onUpdate: () => this.#regenerateTerrain()
        });

        this.#setupSlider('noise-persistence-slider', 'noise-persistence-value', 'noisePersistence', {
            valueFormat: (v) => v.toFixed(2),
            onUpdate: () => this.#regenerateTerrain()
        });

        this.#setupSlider('noise-lacunarity-slider', 'noise-lacunarity-value', 'noiseLacunarity', {
            valueFormat: (v) => v.toFixed(1),
            onUpdate: () => this.#regenerateTerrain()
        });

        this.#setupSlider('noise-fundamental-slider', 'noise-fundamental-value', 'noiseFundamental', {
            valueFormat: (v) => v.toFixed(1),
            onUpdate: () => this.#regenerateTerrain()
        });

        this.#setupSlider('noise-warping-strength-slider', 'noise-warping-strength-value', 'noiseWarpingStrength', {
            valueFormat: (v) => v.toFixed(2),
            onUpdate: () => this.#regenerateTerrain()
        });

        this.#setupSlider('midpoint-roughness-slider', 'midpoint-roughness-value', 'midpointRoughness', {
            valueFormat: (v) => v.toFixed(2),
            onUpdate: () => this.#regenerateTerrain()
        });


        ////////////////
        // Checkboxes //
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

        const initialRidgeStyleRadio = document.querySelector(`input[name="ridge-style"][value="${this.#config.ridgeStyle}"]`);
        if (initialRidgeStyleRadio) {
            initialRidgeStyleRadio.checked = true;
        } else {
            document.getElementById('ridge-style-octavian').checked = true; // Default to octavian.
        }

        // Seed input.
        this.#seedInput.value = this.#config.rngSeed;
    }

    #regenerateTerrain() {
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

        // Seed controls.
        this.#seedInput.addEventListener('change', this.#handleSeedInputChange.bind(this));
        this.#seedInput.addEventListener('wheel', this.#handleSeedWheelChange.bind(this));


        // Noise parameter listeners are attached in #setupSlider.

        // Ridge parameter checkboxes.
        document.getElementById('ridge-invert-checkbox').addEventListener('change', (e) => {
            this.#config.ridgeInvertSignal = e.target.checked;
            this.#regenerateTerrain();
        });
        document.getElementById('ridge-square-checkbox').addEventListener('change', (e) => {
            this.#config.ridgeSquareSignal = e.target.checked;
            this.#regenerateTerrain();
        });

        // Ridge style radio buttons.
        this.#ridgeStyleRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.#config.ridgeStyle = e.target.value;
                this.#regenerateTerrain();
            });
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
        this.#config.needsRender = true; // TODO: put in common with terrain size slider.
    }

    // Handles changes to the seed input field.
    #handleSeedInputChange(event) {
        const newSeed = parseInt(event.target.value);
        if (!isNaN(newSeed)) {
            this.#config.rngSeed = newSeed;
            this.#regenerateTerrain();
        }
    }

    // Handles mouse wheel events on the seed input field.
    #handleSeedWheelChange(event) {
        event.preventDefault(); // Prevent page scrolling.
        const delta = Math.sign(event.deltaY); // -1 for scroll up, 1 for scroll down.
        this.#config.rngSeed -= delta; // Decrement for scroll up, increment for scroll down.
        this.#seedInput.value = this.#config.rngSeed; // Update the input field.
        this.#regenerateTerrain();
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
