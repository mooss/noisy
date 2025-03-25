let gridSize = 20; // Number of cells in each direction
let cellSize = 30; // Size of each cell
let grid = [];
let maxH = 100;
let camDist = gridSize * cellSize;

function setup() {
    createCanvas(windowWidth, windowHeight, WEBGL);
    stroke('black');
    strokeWeight(5);
    randomSeed(4815162342);
    randGrid();
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

function keyPressed() {
    if (key === 'r') { // Regenerate the grid.
        randGrid();
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
    const segment = clamp(Math.floor(value * nsegments, 0, 5));
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
