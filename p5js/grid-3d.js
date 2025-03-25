let gridSize = 20; // Number of cells in each direction
let cellSize = 30; // Size of each cell
let grid = [];

function setup() {
    createCanvas(800, 600, WEBGL);
    noStroke();
    randGrid();
}

function draw() {
    background(0);
    orbitControl(); // Rotate the scene with the mouse.
    ambientLight(100);
    directionalLight(255, 255, 255, -1, -1, -1); // Directional light from the top-leff.
    translate(-gridSize * cellSize / 2, -gridSize * cellSize / 2, 0); // Center the grid.

    // Draw the grid.
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            push();
            translate(i * cellSize, j * cellSize, grid[i][j] / 2); // Position the cell.
            box(cellSize, cellSize, grid[i][j]); // Draw the cell as a box.
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
            grid[i][j] = random(20, 100); // Random height between 20 and 100
        }
    }
}
