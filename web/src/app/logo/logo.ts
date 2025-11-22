import { vector2 } from "../../maths/maths.js";

// Amount of radians corresponding to 1/3 of a rotation.
const RAD_THIRD = 2 * Math.PI / 3;

// Amount of radians corresponding to 1/12 of a rotation.
const RAD_TWELFTH = Math.PI / 6;

// Thickness of the lines.
const LINE_PROPORTION = .02;

// Dimensions of the beam.
const BEAM_PROPORTION = .13;

// Width of polygon borders to ensure overlap between fills.
const POLYBORDER_OVERLAP = 1

// Color of the internal and external lines.
const LINE_COLOR = 'white';

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
    // Joining points two by two removes undesired pointy ends.
    let first = points.shift();
    for (let second of points) {
        path(first, second);
        first = second;
        ctx.stroke();
    }
}

function poly(...points: vector2[]) {
    path(...points);
    ctx.closePath();
    ctx.fill();
}

function polyborder(points: vector2[], color: string) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = POLYBORDER_OVERLAP;
    ctx.lineJoin = 'round';
    poly(...points);
    ctx.stroke();
    ctx.restore();
}

/**
 * Draw a sixth of the logo (the bottom left triangle).
 */
function sixth(size: number, colbot: string, colmid: string, coltip: string) {
    ///////////////
    // Distances //

    // Vertical/horizontal size of the beams.
    const beamsize = size * BEAM_PROPORTION;

    // Median of the triangle.
    const median = size * Math.cos(RAD_TWELFTH);

    // Median of a beam (i.e. length of the median of the triangle whole side is the beam size).
    // Used to construct a beam of the desired length when taking the "obliqueness" of the beams
    // into account.
    const beamed = beamsize * Math.cos(RAD_TWELFTH);

    //////////////
    // Vertices //

    // Triangle vertices.
    const top = { x: 0, y: 0 };
    const bottom = { x: 0, y: size };
    const left = { x: -median, y: size / 2 };

    // Middle points.
    const tole = { x: left.x / 2, y: left.y / 2 }; // Middle of top and left points.
    const tobo = { x: 0, y: size / 2 }; // Middle of the top and bottom points.

    // Bottom fill points.
    const bfa = { x: left.x + beamed, y: left.y + beamsize / 2 };
    const bfb = { x: tole.x, y: tole.y + beamsize }
    const bfc = { x: tobo.x, y: tobo.y + beamsize };

    // Top triangle fill points.
    const ttfa = { x: tole.x + beamed, y: tole.y - beamsize / 2 };
    const ttfb = { x: top.x - beamed, y: top.y + beamsize / 2 };
    const ttfc = { x: tobo.x - beamed, y: tobo.y - 1.5 * beamsize };

    // Missing beam points.
    const mba = { x: ttfc.x, y: ttfc.y + beamsize };

    ///////////
    // Fills //

    // Top triangle fill.
    polyborder([ttfa, ttfb, ttfc], colmid);

    // Hook fill.
    polyborder([left, tole, mba, ttfb, top, bfc, bfb, bfa], coltip);

    // Transverse fill.
    polyborder([tole, ttfa, ttfc, mba], colbot)

    // Bottom fill.
    polyborder([bfa, bfb, bfc, bottom], colbot);

    ///////////
    // Lines //

    // Line settings.
    ctx.strokeStyle = LINE_COLOR;
    ctx.lineCap = 'round';
    ctx.lineWidth = size * LINE_PROPORTION;

    // Outlines.
    line(bottom, left, ttfa, ttfc, ttfb, top, bfc, bfb, bfa);
    line(tole, mba, ttfc)
}

/**
 * Draw a third of the logo (the bottom rhombus, made of the bottom left triangle and its
 * horizontally mirrored sibling).
 */
function third(size: number, pri: string, sec: string, ter: string) {
    ctx.save();
    sixth(size, pri, sec, ter);
    ctx.scale(-1, 1);
    sixth(size, pri, ter, sec);
    ctx.restore();
}

function rgb(r: string, g: string, b: string) {
    return '#' + r + g + b;
}

function logo() {
    const center = { x: canvas.width / 2, y: canvas.height / 2 }
    const size = Math.min(canvas.width, canvas.height) * (.5 - LINE_PROPORTION / 2);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cola = '00', colb = 'bb', colc = 'ff';

    // Lime, fushia, turquoise.
    let cyanish = rgb(cola, colb, colc);
    let magentaish = rgb(colc, cola, colb);
    let yellowish = rgb(colb, colc, cola);

    // Orange, purple, turquoise.
    // cyanish = rgb(cola, colb, colc);
    // magentaish = rgb(colb, cola, colc);
    // yellowish = rgb(colc, colb, cola);

    // Cyan, magenta, yellow.
    cyanish = 'cyan';
    magentaish = 'magenta';
    yellowish = 'yellow';

    ctx.translate(center.x, center.y);
    third(size, cyanish, magentaish, yellowish);
    // return;
    ctx.rotate(RAD_THIRD);
    third(size, yellowish, cyanish, magentaish);
    ctx.rotate(RAD_THIRD);
    third(size, magentaish, yellowish, cyanish);
}

window.addEventListener('resize', refresh);
refresh();
