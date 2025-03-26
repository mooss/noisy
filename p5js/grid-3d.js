let gridPower = 6;
let gridSize = 2**gridPower+1; // Needs to be 2^n + 1 for midpoint displacement.
let cellSize = 15; // Size of each cell.
let grid = [];
let maxH = gridSize*2.5;
let camDist = gridSize * cellSize;
let noiseScale = .1; // Scale for noise coordinates.

function setup() {
    createCanvas(windowWidth, windowHeight, WEBGL);
    stroke('black');
    strokeWeight(5);
    randomSeed(4815162342);
    noiseSeed(4815162342);
    noiseGrid();
    camera(0, camDist, camDist,
           0, 0, 0,
           0, 1, 0);
}

function draw() {
    background(0);
    orbitControl(); // Rotate the scene with the mouse.
    ambientLight(100);
    directionalLight(255, 255, 255, 1, 1, -1); // Directional light from the top-left.
    translate(-gridSize * cellSize / 2, -gridSize * cellSize / 2, 0); // Center the grid.

    // Draw the grid.
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            push();
            // Interpolate color between magenta and cyan using the height.
            let height = grid[i][j];
            fill(interpolate([[255, 0, 255], [0, 255, 255]], height/maxH));

            translate(i * cellSize, j * cellSize, height / 2); // Position the cell.
            box(cellSize, cellSize, height); // Draw the cell as a box.
            pop();
        }
    }
}

function bigrand() { return random(9999999999); }

function keyPressed() {
    if (key === 'r') { // Random heights.
        randomSeed(bigrand());
        randGrid();
    }
    if (key === 'n') { // Perlin noise.
        noiseSeed(bigrand());
        noiseGrid();
    }
    if (key === 'm') { // Midpoint displacement.
        randomSeed(bigrand());
        midpointGrid();
    }
}

// Initialize the grid with random heights.
function randGrid() {
    for (let i = 0; i < gridSize; i++) {
        grid[i] = [];
        for (let j = 0; j < gridSize; j++) {
            grid[i][j] = random(0, maxH);
        }
    }
}

// Initialize the grid using Perlin noise.
function noiseGrid() {
    for (let i = 0; i < gridSize; i++) {
        grid[i] = [];
        for (let j = 0; j < gridSize; j++) {
            grid[i][j] = noise(i * noiseScale, j * noiseScale) * maxH;
        }
    }
}

// Initialize the grid using midpoint displacement algorithm (diamond-square).
function midpointGrid() {
    // Initialize empty grid
    for (let i = 0; i < gridSize; i++) {
        grid[i] = [];
        for (let j = 0; j < gridSize; j++) {
            grid[i][j] = 0;
        }
    }

    let roughness = 0.6; // Scaling factor for each additional subdivision.
    let range = 1;
    let step = gridSize - 1;

    // Initialize the four corners.
    grid[0][0] = random(0, range);
    grid[0][gridSize-1] = random(0, range);
    grid[gridSize-1][0] = random(0, range);
    grid[gridSize-1][gridSize-1] = random(0, range);

    // Keeping track of min and max heights to then normalize to the intended height range.
    let max_ = max(grid[0][0], grid[0][gridSize-1], grid[gridSize-1][0], grid[gridSize-1][gridSize-1]);
    let min_ = min(grid[0][0], grid[0][gridSize-1], grid[gridSize-1][0], grid[gridSize-1][gridSize-1]);

    // Diamond-square proper.
    while (step > 1) {
        let halfStep = step / 2;

        // Diamond step, average the four diagonal neighbours of a new point and nudge it a little
        // bit by a random value.
        for (let x = halfStep; x < gridSize - 1; x += step) {
            for (let y = halfStep; y < gridSize - 1; y += step) {
                let avg = (grid[x-halfStep][y-halfStep] +
                           grid[x-halfStep][y+halfStep] +
                           grid[x+halfStep][y-halfStep] +
                           grid[x+halfStep][y+halfStep]) / 4; // Average.
                grid[x][y] = avg + random(-range, range); // Nudge.
                if (grid[x][y] > max_) { max_ = grid[x][y]; }
                if (grid[x][y] < min_) { min_ = grid[x][y]; }
            }
        }

        // Square step, average the four (or three) linear neighbours and nudge it a little bit by a
        // random value.
        for (let x = 0; x < gridSize; x += halfStep) {
            for (let y = (x % step === 0) ? halfStep : 0; y < gridSize; y += step) {
                let count = 0;
                let sum = 0;

                // Points in this step can be on the edge of the grid and therefore only have three
                // valid neighbours so the coordinates must be carefully checked.
                if (x >= halfStep) { sum += grid[x-halfStep][y]; count++; }
                if (x + halfStep < gridSize) { sum += grid[x+halfStep][y]; count++; }
                if (y >= halfStep) { sum += grid[x][y-halfStep]; count++; }
                if (y + halfStep < gridSize) { sum += grid[x][y+halfStep]; count++; }

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
    normalize = rangeMaper(min_, max_, 0, maxH);
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            grid[i][j] = normalize(grid[i][j]);
        }
    }
}

function rangeMaper(fromMin, fromMax, toMin, toMax) {
    return x => toMin + ((x - fromMin) / (fromMax - fromMin)) * (toMax - toMin)
}

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
    const segment = clamp(Math.floor(value * nsegments), 0, color.length);
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
