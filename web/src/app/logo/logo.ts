import { vector2 } from "../../maths/maths.js";


// Amount of radians corresponding to 1/3 of a rotation.
const RAD_THIRD = 2 * Math.PI / 3;

// Amount of radians corresponding to 1/6 of a rotation.
const RAD_SIXTH = Math.PI / 3;

// Amount of radians corresponding to 1/12 of a rotation.
const RAD_TWELFTH = Math.PI / 6;

// Small number to avoid gaps between shapes.
const NOGAP = 1;

// Thickness of the outer lines.
const OUTLINE_PROPORTION = .03;

// Thickness of the inner lines.
const INLINE_PROPORTION = .015;

// Dimensions of the beam.
const BEAM_PROPORTION = .2;

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

function resize() {
    const size = Math.min(window.innerWidth, window.innerHeight);
    canvas.width = size;
    canvas.height = size;
}

function refresh() {
    resize();
    logo();
}

function path(...points: vector2[]) {
    let p = points.shift();
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    for (p of points) ctx.lineTo(p.x, p.y);
}

function line(...points: vector2[]) {
    path(...points);
    ctx.stroke();
}

function poly(...points: vector2[]) {
    path(...points);
    ctx.closePath();
    ctx.fill();
}

/**
 * Draw a sixth of the logo (the bottom left triangle).
 */
function sixth(size: number, color: string) {
    const median = size * Math.cos(RAD_TWELFTH);
    const top = { x: 0, y: 0 };
    const bottom = { x: 0, y: size };
    const left = { x: -median, y: size / 2 };

    // Solid base (triangle).
    ctx.fillStyle = color;
    poly(top, bottom, left);

    // Outline.
    ctx.strokeStyle = 'black';
    ctx.lineCap = 'round';
    ctx.lineWidth = size * OUTLINE_PROPORTION;
    line(bottom, left);
}

/**
 * Draw a third of the logo (the bottom rhombus, made of the bottom left triangle and its
 * horizontally mirrored sibling).
 */
function third(size: number, color: string) {
    ctx.save();
    sixth(size, color);
    ctx.scale(-1, 1);
    sixth(size, color);
    ctx.restore();
}

function logo() {
    const center = { x: canvas.width / 2, y: canvas.height / 2 }
    const size = Math.min(canvas.width, canvas.height) * (.5 - OUTLINE_PROPORTION / 2);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.translate(center.x, center.y);
    third(size, 'cyan');
    ctx.rotate(RAD_THIRD);
    third(size, 'yellow');
    ctx.rotate(RAD_THIRD);
    third(size, 'magenta');
}

window.addEventListener('resize', refresh);
refresh();
