import { createNoise2D } from 'https://unpkg.com/simplex-noise@4.0.1/dist/esm/simplex-noise.js';

///////////////////////////
// Generation parameters //

let gridPower = 5;
let gridSize = 2**gridPower + 1; // Needs to be 2^n + 1 for midpoint displacement.
let cellSize = 15; // Size of each cell.
let maxH = gridSize * cellSize / 3; // Maximum height of terrain.
let updateMaxHeight = () => { maxH = gridSize * cellSize / 3; };
let useHexagons = false; // Toggle between squares and hexagons.
let useSurface = false; // Toggle between 3D surface and individual cells.
let noiseScale = 0.1; // Scale for noise coordinates.
let rngSeed = 4815162342;

let rgb = (r, g, b) => new THREE.Color(r/255, g/255, b/255);
const terrainPalette = [
    rgb(100, 200, 50),  // Light green.
    rgb(100, 200, 50),  // Light green.
    rgb(75, 125, 25),   // Dark green.
    rgb(75, 125, 25),   // Dark green.
    rgb(100, 100, 100), // Grey.
    rgb(255, 255, 255), // White.
    rgb(255, 255, 255), // White.
];
// Interesting for the underside which can be used to seed continents.
const continentalPalette = [
    rgb(100, 200, 50),
    rgb(100, 200, 50),
    rgb(50, 100, 200),
    rgb(50, 100, 200),
    rgb(100, 200, 50),
    rgb(100, 200, 50),
    rgb(100, 200, 50),
];
const cyberPuke = [
    rgb(255, 0, 255), // Magenta.
    rgb(0, 255, 255), // Cyan.
];
let palettes = [terrainPalette, continentalPalette, cyberPuke];
let currentPalette = 0;

////////////////////////
// Terrain generation //

let terrainGrid;

// Grid class to encapsulate grid data and generation methods.
class Grid {
    constructor(size, maxH) {
        this.size = size;
        this.maxH = maxH;
        this.data = [];

        for (let i = 0; i < this.size; i++) {
            this.data[i] = new Array(this.size).fill(0);
        }
    }

    ///////////////
    // Utilities //

    // Returns a function that gives the simplex value at the given coordinates.
    simplex() {
        const noiseGen = createNoise2D(createLCG(rngSeed));
        return (x, y) => ((noiseGen(x * noiseScale, y * noiseScale) + 1) / 2) * this.maxH;
    }

    apply(fun) {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                this.data[i][j] = fun(i, j);
            }
        }
    }

    ///////////////////////
    // Height generation //

    // Random heights.
    rand() {
        reseed();
        this.apply(() => rng(1, maxH));
    }

    // Simplex noise.
    noise() {
        this.apply(this.simplex());
    }

    // Midpoint displacement (diamond-square).
    midpoint() {
        reseed();
        midpointDisplacement(this.data, this.maxH);
    }

    // Average of midpoint displacement and simplex noise.
    midnoise() {
        reseed();
        this.midpoint();
        const spx = this.simplex();
        this.apply((x, y) => this.data[x][y] * .8 + spx(x, y) * .2);
    }
}

function midpointDisplacement(grid, maxH) {
    const roughness = 0.6; // Scaling factor for each additional subdivision.
    let range = 1;
    const size = grid.length;

    // Offset used to iterate through the grid.
    // Power of two. Starts big and is divided by two each iteration (adding level of details).
    let step = size - 1;

    // Initialize the four corners.
    grid[0][0] = rng(0, range);
    grid[0][size - 1] = rng(0, range);
    grid[size - 1][0] = rng(0, range);
    grid[size - 1][size - 1] = rng(0, range);

    // Keeping track of min and max heights to then normalize to the intended height range.
    let max_ = -Infinity, min_ = Infinity;
    const minmax = (val) => {
        if (val > max_) max_ = val;
        if (val < min_) min_ = val;
    };
    minmax(grid[0][0]);
    minmax(grid[0][grid.length - 1]);
    minmax(grid[grid.length - 1][0]);
    minmax(grid[grid.length - 1][grid.length - 1]);

    // Diamond-square proper.
    while (step > 1) {
        let halfStep = step / 2;

        // Diamond step, average the four diagonal neighbours of a new point and nudge it a
        // little bit by a random value.
        for (let x = halfStep; x < size - 1; x += step) {
            for (let y = halfStep; y < size - 1; y += step) {
                let avg = (grid[x - halfStep][y - halfStep] +
                           grid[x - halfStep][y + halfStep] +
                           grid[x + halfStep][y - halfStep] +
                           grid[x + halfStep][y + halfStep]) / 4; // Average.

                grid[x][y] = avg + rng(-range, range); // Nudge.
                minmax(grid[x][y]);
            }
        }

        // Square step, average the four (or three) linear neighbours and nudge it a little bit
        // by a random value.
        for (let x = 0; x < size; x += halfStep) {
            for (let y = (x % step === 0) ? halfStep : 0; y < size; y += step) {
                let count = 0;
                let sum = 0;

                // Points in this step can be on the edge of the grid and therefore only have
                // three valid neighbours so the coordinates must be carefully checked.
                if (x >= halfStep) { sum += grid[x - halfStep][y]; count++; }
                if (x + halfStep < size) { sum += grid[x + halfStep][y]; count++; }
                if (y >= halfStep) { sum += grid[x][y - halfStep]; count++; }
                if (y + halfStep < size) { sum += grid[x][y + halfStep]; count++; }

                grid[x][y] = sum / count + rng(-range, range); // Average and nudge.
                minmax(grid[x][y]);
            }
        }

        // Reduce the random range for the next iteration.
        range *= roughness;
        step = halfStep;
    }

    // Normalize all values between 1 and maxH.
    let normalize = rangeMapper(min_, max_, 1, maxH);
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            grid[i][j] = normalize(grid[i][j]);
        }
    }
}

function rangeMapper(fromMin, fromMax, toMin, toMax) {
    return x => toMin + ((x - fromMin) / (fromMax - fromMin)) * (toMax - toMin);
}

// Returns a linear congruential generator that generates pseudorandom values between 0 and 1.
// This is a hack to get deterministic PRNG since Math.random cannot be seeded.
function createLCG(seed) {
    const a = 1664525;
    const c = 1013904223;
    const m = Math.pow(2, 32);
    let currentSeed = seed;
    
    return function() {
        currentSeed = (a * currentSeed + c) % m;
        return currentSeed / m;
    };
}

let rng;
let currentGenerationMethod = 'midpoint';

const reseed = function() {
    let generator = createLCG(rngSeed);
    rng = (min, max) => generator() * (max - min) + min;
}
reseed();

// Interpolate between colors in a palette. Value expected between 0 and 1.
function interpolateColors(colors, value) {
    if (colors.length === 0) return rgb(255, 255, 255);
    if (colors.length === 1) return colors[0].clone();

    value = THREE.MathUtils.clamp(value, 0, 1);

    const nsegments = colors.length - 1;
    const segment = Math.min(Math.floor(value * nsegments), nsegments - 1);
    const ratio = value * nsegments - segment;

    const color1 = colors[segment];
    const color2 = colors[segment + 1];

    return color1.clone().lerp(color2, ratio);
}

//////////////////////////////////
// Three.js setup and rendering //

let scene, camera, renderer, controls, terrainMeshes;

const camDist = gridSize * cellSize *1.2 + 50;

function init() {
    // Scene.
    scene = new THREE.Scene();
    scene.background = rgb(0, 0, 0);

    // Camera. Mediocre, needs to be improved.
    const aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(60, aspect, 0.1, camDist * 2);
    camera.position.set(0, -camDist * 0.7, camDist * 0.7);
    camera.lookAt(scene.position);

    // Renderer.
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Lighting.
    const ambientLight = new THREE.AmbientLight(0x808080); // Soft white light.
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, .8);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);

    // Mouse controls.
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Smooths camera movement.
    controls.dampingFactor = 0.1;

    // Heightmap.
    terrainGrid = new Grid(gridSize, maxH);
    terrainGrid.midpoint();

    // Meshes (from heightmap to geometry).
    terrainMeshes = new THREE.Group();
    scene.add(terrainMeshes);
    createGridMeshes();

    // Event Listeners.
    window.addEventListener('resize', onWindowResize, false);
    setupUIListeners(); // Add listeners for the controls.
}

function animate() {
    requestAnimationFrame(animate);
    controls.update(); // Required because of damping.
    renderer.render(scene, camera);
}

init();
animate();

////////////
// Meshes //

function createHexagonGeometry(radius, height) {
    const shape = new THREE.Shape();
    const sides = 6;
    const angle = (2 * Math.PI) / sides;

    shape.moveTo(radius, 0); // The top point.

    // The five remaining points.
    for (let i = 1; i <= sides; i++) {
        const x = radius * Math.cos(angle * i);
        const y = radius * Math.sin(angle * i);
        shape.lineTo(x, y);
    }

    return new THREE.ExtrudeGeometry(shape, {
        steps: 1,
        depth: height,
        bevelEnabled: false
    });
}

function createGridMeshes() {
    // Clear previous meshes.
    while (terrainMeshes.children.length > 0) {
        terrainMeshes.remove(terrainMeshes.children[0]);
    }

    if (useSurface) {
        const geometry = new THREE.PlaneGeometry(
            gridSize * cellSize, 
            gridSize * cellSize, 
            gridSize - 1, 
            gridSize - 1
        );
        
        const positionAttribute = geometry.getAttribute('position');
        const colors = [];
        
        // Set heights and colors.
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                // Height.
                const vertexIndex = i * gridSize + j;
                const height = terrainGrid.data[i][j];
                positionAttribute.setZ(vertexIndex, height);
                
                // Color.
                const color = interpolateColors(palettes[currentPalette], height / maxH);
                colors.push(color.r, color.g, color.b);
            }
        }
        
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.attributes.position.needsUpdate = true;
        geometry.computeVertexNormals();
        
        const material = new THREE.MeshStandardMaterial({ 
            vertexColors: true,
            side: THREE.DoubleSide
        });
        
        const surfaceMesh = new THREE.Mesh(geometry, material);
        surfaceMesh.rotation.z = Math.PI / 2;
        terrainMeshes.add(surfaceMesh);
        return;
    }

    const ySpacingFactor = useHexagons ? Math.sqrt(3) / 2 : 1;
    const hexRadius = cellSize / Math.sqrt(3);
    const hexWidth = cellSize; // Distance between parallel sides.

    // Calculate total grid dimensions for centering.
    let totalGridWidth = (gridSize - 1) * cellSize + (useHexagons ? hexWidth / 2 : 0);
    let totalGridHeight = (gridSize - 1) * cellSize * ySpacingFactor;

    const startX = -totalGridWidth / 2;
    const startY = -totalGridHeight / 2;

    // Material reused for performance.
    const material = new THREE.MeshStandardMaterial({ vertexColors: false });

    for (let i = 0; i < terrainGrid.size; i++) {
        for (let j = 0; j < terrainGrid.size; j++) {
            const height = terrainGrid.data[i][j];

            let geometry;
            let mesh;
            const cellColor = interpolateColors(palettes[currentPalette], height / terrainGrid.maxH);

            const xOffset = (useHexagons && j % 2 !== 0) ? hexWidth / 2 : 0;
            const xPos = startX + i * cellSize + xOffset;
            const yPos = startY + j * cellSize * ySpacingFactor;
            let zPos = height / 2; // Center squares vertically.

            if (useHexagons) {
                geometry = createHexagonGeometry(hexRadius, height);
                mesh = new THREE.Mesh(geometry, material.clone());
                mesh.material.color.set(cellColor);
                mesh.rotation.z = Math.PI / 2; // Rotate for a flat top orientation.
                zPos = 0; // Hexagon prisms are already centered vertically.
            } else {
                geometry = new THREE.BoxGeometry(cellSize, cellSize, height);
                mesh = new THREE.Mesh(geometry, material.clone());
                mesh.material.color.set(cellColor);
            }

            mesh.position.set(xPos, yPos, zPos);
            terrainMeshes.add(mesh);
        }
    }
}

////////////
// Events //

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function setupUIListeners() {
    ///////////////
    // Grid size //
    const gridSizeSlider = document.getElementById('grid-size-slider');
    const gridSizeValue = document.getElementById('grid-size-value');

    // Initial values.
    gridSizeValue.textContent = gridSize;
    gridSizeSlider.value = gridPower;

    gridSizeSlider.addEventListener('input', () => {
        gridPower = parseInt(gridSizeSlider.value);
        gridSize = 2**gridPower + 1;
        gridSizeValue.textContent = gridSize;
        updateMaxHeight();

        // Regenerate with new size.
        terrainGrid = new Grid(gridSize, maxH);
        terrainGrid[currentGenerationMethod]();
        createGridMeshes();
    });

    ////////////////////////
    // Terrain generation //
    document.getElementById('btn-random').addEventListener('click', () => {
        currentGenerationMethod = 'rand';
        terrainGrid.rand();
        createGridMeshes();
    });

    document.getElementById('btn-noise').addEventListener('click', () => {
        currentGenerationMethod = 'noise';
        terrainGrid.noise();
        createGridMeshes();
    });

    document.getElementById('btn-midpoint').addEventListener('click', () => {
        currentGenerationMethod = 'midpoint';
        terrainGrid.midpoint();
        createGridMeshes();
    });

    document.getElementById('btn-midnoise').addEventListener('click', () => {
        currentGenerationMethod = 'midnoise';
        terrainGrid.midnoise();
        createGridMeshes();
    });

    document.getElementById('btn-new-seed').addEventListener('click', () => {
        rngSeed++;
        terrainGrid = new Grid(gridSize, maxH);
        terrainGrid[currentGenerationMethod]();
        createGridMeshes();
    });

    ////////////
    // Shapes //
    document.querySelectorAll('input[name="shape"]').forEach(radio => {
        radio.addEventListener('change', (event) => {
            const shape = event.target.value;
            if (shape === 'squares') {
                useHexagons = false;
                useSurface = false;
            } else if (shape === 'hexagons') {
                useHexagons = true;
                useSurface = false;
            } else if (shape === 'surface') {
                useHexagons = false;
                useSurface = true;
            }
            createGridMeshes();
        });
    });

    // Set initial radio button state based on default variables.
    if (useSurface) {
        document.getElementById('shape-surface').checked = true;
    } else if (useHexagons) {
        document.getElementById('shape-hexagons').checked = true;
    } else {
        document.getElementById('shape-squares').checked = true;
    }


    ////////////
    // Colors //
    document.getElementById('btn-palette').addEventListener('click', () => {
        currentPalette = (currentPalette + 1) % palettes.length;
        createGridMeshes();
    });
}
