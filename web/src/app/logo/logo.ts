import { vector2 } from "../../maths/maths.js";

const NOGAP = 1; // Small number to avoid gaps between shapes.
const OUTLINE_PROPORTION = .3; // Configurable outline thickness
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

function triangle(size: number, color: string) {
    const top = { x: 0, y: -size };
    const right = { x: size * Math.cos(Math.PI / 6), y: size * Math.sin(Math.PI / 6) };
    const left = { x: -right.x, y: right.y };
    ctx.save();

    // Inside.
    ctx.beginPath();
    ctx.moveTo(top.x, top.y);
    ctx.lineTo(right.x, right.y);
    ctx.stroke();
    ctx.lineTo(left.x, left.y);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    // Border.
    ctx.strokeStyle = 'black';
    ctx.lineCap = 'round';
    ctx.lineWidth = size * OUTLINE_PROPORTION;

    line(left, top);
    line(top, right);
}


/**
 * Draw a third of the logo.
 */
function third(size: number, color: string, center: vector2) {
    ctx.save();
    ctx.translate(center.x, center.y);
    ctx.rotate(Math.PI / 2);
    triangle(size, color);
    ctx.translate(0, size - NOGAP);
    ctx.rotate(Math.PI);
    triangle(size, color);
    ctx.restore();
}

function logo() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const triangleSize = Math.min(canvas.width, canvas.height) * 0.22;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    third(triangleSize, 'teal', { x: centerX, y: centerY });
}

window.addEventListener('resize', refresh);
refresh();
