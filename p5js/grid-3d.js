let gridPower = 6;
let gridSize = 2**gridPower + 1; // Needs to be 2^n + 1 for midpoint displacement.
let cellSize = 15; // Size of each cell.
let maxH = gridSize * cellSize / 3;
let camDist = gridSize * cellSize + 50;
let noiseScale = .1; // Scale for noise coordinates.
let useHexagons = false; // Toggle between squares and hexagons.

let terrain; // Terrain, defined as a matrix of heights.

const terrainPalette = [
    [100, 200, 50], // Bright green (grass).
    [100, 200, 50], // Bright green (grass).
    [75, 125, 25], // Darker green (forest).
    [75, 125, 25], // Darker green (forest).
    [100, 100, 100], // Grey (mountains).
    [255, 255, 255], // White (mountains tops).
    [255, 255, 255], // White (mountains tops).
];
const cyberPuke = [[255, 0, 255], [0, 255, 255]]; // Garish magenta -> cyan palette.

function setup() {
    createCanvas(windowWidth, windowHeight, WEBGL);
    stroke('white');
    strokeWeight(1);
    randomSeed(4815162342);
    noiseSeed(4815162342);

    terrain = new Grid(gridSize, maxH);
    terrain.midpoint(); // Generate initial terrain.

    camera(0, camDist, camDist,
           0, 0, 0,
           0, 1, 0);
}

///////////////
// Rendering //

function draw() {
    background(0);
    orbitControl(); // Rotate the scene with the mouse.
    ambientLight(128);
    directionalLight(255, 255, 255, 1, 1, -1); // Directional light from the top-left.

    // Center the grid for both hexagons and squares.
    let ySpacingFactor = useHexagons ? (3 * Math.sqrt(3)) / 4 : 1; // Width and height differ for hexagons.
    let totalGridHeight = (gridSize - 1) * cellSize * ySpacingFactor;
    let totalGridWidth = (gridSize - 1) * cellSize + (useHexagons ? cellSize / 2 : 0);
    translate(-totalGridWidth / 2, -totalGridHeight / 2, 0);

    // Draw the grid.
    for (let i = 0; i < terrain.size; i++) {
        for (let j = 0; j < terrain.size; j++) {
            let height = terrain.data[i][j];

            push();

            // Color of the cell.
            fill(interpolate(terrainPalette, height / terrain.maxH));

            // Position the cell.
            let yOffset = (useHexagons && i % 2 !== 0) ? cellSize / 2 : 0;
            let yPos = j * cellSize * ySpacingFactor + yOffset;
            let xPos = i * cellSize;
            translate(xPos, yPos, height / 2);

            if (useHexagons) {
                hexprism(cellSize, height);
            } else {
                box(cellSize, cellSize, height);
            }

            pop();
        }
    }
}

// Hexagonal prism centered at the origin.
function hexprism(width, h) {
    let r = width / Math.sqrt(3); // Radius (center to vertex).
    let halfH = h / 2;

    // Compute 2d hexagon vertices by rotating around the center.
    let vertices = [];
    for (let i = 0; i < 6; i++) {
        let angle = PI / 3 * i; // Angle for pointy top.
        vertices.push({ x: r * cos(angle), y: r * sin(angle) });
    }

    // Top face.
    beginShape();
    for (let v of vertices) {
        vertex(v.x, v.y, halfH);
    }
    endShape(CLOSE);

    // Bottom face.
    beginShape();
    for (let v of vertices) {
        vertex(v.x, v.y, -halfH);
    }
    endShape(CLOSE);

    // Draw side faces
    beginShape();
    for (let i = 0; i < 6; i++) {
        let v1 = vertices[i];
        let v2 = vertices[(i + 1) % 6];
        vertex(v1.x, v1.y, -halfH); // Bottom-left.
        vertex(v2.x, v2.y, -halfH); // Bottom-right.
        vertex(v2.x, v2.y, halfH);  // Top-right.
        vertex(v1.x, v1.y, halfH);  // Top-left.
    }
    endShape(CLOSE);
}

////////////////////
// Input handling //

function bigrand() { return random(9999999999); }

function keyPressed() {
    if (key === 'r') { // Random heights.
        randomSeed(bigrand());
        terrain.rand();
    }
    if (key === 'n') { // Perlin noise.
        noiseSeed(bigrand());
        terrain.noise();
    }
    if (key === 'm') { // Midpoint displacement.
        randomSeed(bigrand());
        terrain.midpoint();
    }
    if (key === 'h') { // Toggle hexagons.
        useHexagons = !useHexagons;
    }
}

////////////////////////
// Terrain generation //

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

    // Random heights.
    rand() {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                this.data[i][j] = random(0, this.maxH);
            }
        }
    }

    // Perlin noise.
    noise() {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                this.data[i][j] = noise(i * noiseScale, j * noiseScale) * this.maxH;
            }
        }
    }

    // Midpoint displacement (diamond-square).
    midpoint() {
        midpointDisplacement(this.data);
    }
}

function midpointDisplacement(grid) {
    const roughness = 0.6; // Scaling factor for each additional subdivision.
    let range = 1;
    const size = grid.length;

    // Offset used to iterate through the grid.
    // Power of two. Starts big and is divided by two each iteration (adding level of details).
    let step = size - 1;

    // Initialize the four corners.
    grid[0][0] = random(0, range);
    grid[0][size - 1] = random(0, range);
    grid[size - 1][0] = random(0, range);
    grid[size - 1][size - 1] = random(0, range);

    // Keeping track of min and max heights to then normalize to the intended height range.
    let max_ = max(grid[0][0], grid[0][size - 1], grid[size - 1][0], grid[size - 1][size - 1]);
    let min_ = min(grid[0][0], grid[0][size - 1], grid[size - 1][0], grid[size - 1][size - 1]);

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
                grid[x][y] = avg + random(-range, range); // Nudge.

                if (grid[x][y] > max_) { max_ = grid[x][y]; }
                if (grid[x][y] < min_) { min_ = grid[x][y]; }
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

                grid[x][y] = sum / count + random(-range, range); // Average and nudge.

                if (grid[x][y] > max_) { max_ = grid[x][y]; }
                if (grid[x][y] < min_) { min_ = grid[x][y]; }
            }
        }


        // Reduce the random range for the next iteration.
        range *= roughness;
        step = halfStep;
    }

    // Normalize all values between 0 and maxH.
    let normalize = rangeMapper(min_, max_, 0, maxH);
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            grid[i][j] = normalize(grid[i][j]);
        }
    }
}

function rangeMapper(fromMin, fromMax, toMin, toMax) {
    return x => toMin + ((x - fromMin) / (fromMax - fromMin)) * (toMax - toMin);
}

///////////////
// Libraries //

//:CONCAT lib.js
// Everything after this point was generated with `./refresh.bash grid-3d.js`.

//lib.js
// Color spectrum: white -> rainbow -> black.
const wrainbowb = [
    [255, 255, 255], // white
    [255, 0, 0],     // red
    [255, 255, 0],   // yellow
    [0, 255, 0],     // green
    [0, 255, 255],   // cyan
    [0, 0, 255],     // blue
    [255, 0, 255],   // magenta
    [0, 0, 0],       // black
];

// Return x bounded by min_ and max_.
function clamp(x, min_, max_) {
    if (x < min_) return min_;
    if (x > max_) return max_;
    return x;
}

// Interpolate the value (expected to be between 0 and 1) in the given color spectrum.
function interpolate(colors, value) {
    if (colors.length == 0) {
        return [255, 255, 255];
    }
    if (colors.length == 1) {
        return colors[0];
    }

	value = clamp(value, 0, 1);

    // Find the position on the spectrum.
    const nsegments = colors.length-1;
    const segment = clamp(Math.floor(value * nsegments), 0, nsegments-1);
    const ratio = value * nsegments - segment;

    // Get the two colors to interpolate between.
    const color1 = colors[segment];
    const color2 = colors[segment + 1];

    // Interpolate between the two colors.
    const r = Math.floor(color1[0] + (color2[0] - color1[0]) * ratio);
    const g = Math.floor(color1[1] + (color2[1] - color1[1]) * ratio);
    const b = Math.floor(color1[2] + (color2[2] - color1[2]) * ratio);

	return color(r, g, b);
}

// Return a random color.
function colorand() {
    return color(random(255), random(255), random(255));
}
