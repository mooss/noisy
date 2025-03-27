let gridPower = 6;
let gridSize = 2**gridPower + 1; // Needs to be 2^n + 1 for midpoint displacement.
let cellSize = 15; // Size of each cell.
let maxH = gridSize * cellSize / 3;
let camDist = gridSize * cellSize + 50;
let noiseScale = .1; // Scale for noise coordinates.
let useHexagons = false; // Toggle between squares and hexagons.

let terrain; // Terrain, defined as a matrix of heights.

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

            // Interpolate color between magenta and cyan using the height.
            fill(interpolate([[255, 0, 255], [0, 255, 255]], height / terrain.maxH));

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
        let roughness = 0.6; // Scaling factor for each additional subdivision.
        let range = 1;
        let step = this.size - 1;

        // Initialize the four corners.
        this.data[0][0] = random(0, range);
        this.data[0][this.size - 1] = random(0, range);
        this.data[this.size - 1][0] = random(0, range);
        this.data[this.size - 1][this.size - 1] = random(0, range);

        // Keeping track of min and max heights to then normalize to the intended height range.
        let max_ = max(this.data[0][0], this.data[0][this.size - 1], this.data[this.size - 1][0], this.data[this.size - 1][this.size - 1]);
        let min_ = min(this.data[0][0], this.data[0][this.size - 1], this.data[this.size - 1][0], this.data[this.size - 1][this.size - 1]);

        // Diamond-square proper.
        while (step > 1) {
            let halfStep = step / 2;

            // Diamond step, average the four diagonal neighbours of a new point and nudge it a
            // little bit by a random value.
            for (let x = halfStep; x < this.size - 1; x += step) {
                for (let y = halfStep; y < this.size - 1; y += step) {
                    let avg = (this.data[x - halfStep][y - halfStep] +
                               this.data[x - halfStep][y + halfStep] +
                               this.data[x + halfStep][y - halfStep] +
                               this.data[x + halfStep][y + halfStep]) / 4; // Average.
                    this.data[x][y] = avg + random(-range, range); // Nudge.

                    if (this.data[x][y] > max_) { max_ = this.data[x][y]; }
                    if (this.data[x][y] < min_) { min_ = this.data[x][y]; }
                }
            }

            // Square step, average the four (or three) linear neighbours and nudge it a little bit
            // by a random value.
            for (let x = 0; x < this.size; x += halfStep) {
                for (let y = (x % step === 0) ? halfStep : 0; y < this.size; y += step) {
                    let count = 0;
                    let sum = 0;


                    // Points in this step can be on the edge of the grid and therefore only have
                    // three valid neighbours so the coordinates must be carefully checked.
                    if (x >= halfStep) { sum += this.data[x - halfStep][y]; count++; }
                    if (x + halfStep < this.size) { sum += this.data[x + halfStep][y]; count++; }
                    if (y >= halfStep) { sum += this.data[x][y - halfStep]; count++; }
                    if (y + halfStep < this.size) { sum += this.data[x][y + halfStep]; count++; }

                    this.data[x][y] = sum / count + random(-range, range); // Average and nudge.

                    if (this.data[x][y] > max_) { max_ = this.data[x][y]; }
                    if (this.data[x][y] < min_) { min_ = this.data[x][y]; }
                }
            }


            // Reduce the random range for the next iteration.
            range *= roughness;
            step = halfStep;
        }

        // Normalize all values between 0 and maxH.
        let normalize = rangeMapper(min_, max_, 0, this.maxH);
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                this.data[i][j] = normalize(this.data[i][j]);
            }
        }
    }
}


function rangeMapper(fromMin, fromMax, toMin, toMax) {
    return x => toMin + ((x - fromMin) / (fromMax - fromMin)) * (toMax - toMin);
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
