import { vector2 } from "../../maths/maths.js";

const NOGAP = 1; // Small number to avoid gaps between shapes.
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

function triangle(size: number, color: string) {
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size * Math.cos(Math.PI / 6), size * Math.sin(Math.PI / 6));
    ctx.lineTo(-size * Math.cos(Math.PI / 6), size * Math.sin(Math.PI / 6));
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
}

/**
 * Draw a third of the logo.
 */
function third(size: number, color: string, center: vector2) {
    ctx.translate(center.x, center.y);
    triangle(size, color);
    ctx.translate(0, size - NOGAP);
    ctx.rotate(60 * Math.PI / 180);
    triangle(size, color);
}

function logo() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const triangleSize = Math.min(canvas.width, canvas.height) * 0.25;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    third(triangleSize, 'teal', { x: centerX, y: centerY });
    ctx.restore();
}

window.addEventListener('resize', refresh);
refresh();
