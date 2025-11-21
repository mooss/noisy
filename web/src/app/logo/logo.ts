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

function line(from: vector2, to: vector2) {
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
}

function poly(...points: vector2[]) {
    let p = points.shift();
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    for (p of points) ctx.lineTo(p.x, p.y);
    ctx.closePath();
    ctx.fill();
}

function triangle(size: number, color: string) {
    const left = { x: 0, y: 0 };
    const right = { x: size, y: 0};
    const top = { x: size * .5, y: - size * Math.cos(Math.PI / 6) };

    // Inside.
    ctx.fillStyle = color;
    poly(left, right, top);

    // Border.
    ctx.strokeStyle = 'black';
    ctx.lineCap = 'round';
    ctx.lineWidth = size * OUTLINE_PROPORTION;
    line(top, left);
    line(top, right);
}


/**
 * Draw a third of the logo.
 */
function third(size: number, color: string) {
    ctx.save();

    // Top triangle.
    triangle(size, color);

    // Shift to the right, superposing the new left point with the old right point.
    ctx.translate(size, 0);

    // Rotate half a turn around the left point, resulting in a triangle mirrored along the bottom
    // line.
    ctx.rotate(Math.PI);
    triangle(size, color);

    ctx.restore();
}

function logo() {
    const center = { x: canvas.width / 2, y: canvas.height / 2 }
    const size = Math.min(canvas.width, canvas.height) * (.5 - OUTLINE_PROPORTION / 2);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.translate(center.x, center.y);
    ctx.rotate(Math.PI / 2); // Transform the flat-top hexagon into a pointy-top one.
    third(size, 'cyan');
    ctx.rotate(4 * Math.PI / 3);
    third(size, 'yellow');
    ctx.rotate(4 * Math.PI / 3);
    third(size, 'magenta');
}

window.addEventListener('resize', refresh);
refresh();
