import { vector2 } from "../../maths/maths.js";

const NOGAP = 1; // Small number to avoid gaps between shapes.
const OUTLINE_PROPORTION = .03; // Configurable outline thickness
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

function resize() {
    const size = Math.min(window.innerWidth, window.innerHeight) * 0.8;
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


// Amount of radians corresponding to 1/3 of a rotation.
const RAD_THIRD = 2 * Math.PI / 3;
// Amount of radians corresponding to 1/12 of a rotation.
const RAD_TWELFTH = Math.PI / 6;

/**
 * Draw a third of the logo.
 */
function third(size: number, color: string) {
    const median = size * Math.cos(RAD_TWELFTH);
    const top = { x: 0, y: 0 };
    const right = { x: median, y: size/2 };
    const bottom = { x: 0, y: size };
    const left = { x: -median, y: size/2 };

    // Solid base.
    ctx.fillStyle = color;
    poly(top, right, bottom, left);

    // Outline.
    ctx.strokeStyle = 'black';
    ctx.lineCap = 'round';
    ctx.lineWidth = size * OUTLINE_PROPORTION;
    line(right, bottom, left);
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
