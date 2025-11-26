/**
 * Generates the logo of Noisy.

 * Copyright (c) 2025 Félix Jamet (mooss).
 * The Noisy logo and its variations generated here are proprietary.
 * They are not licensed under the MIT license that applies to the source code.
 *
 * You may not use, reproduce, modify, or distribute these assets without prior written permission.
 *
 * The code generating the logo, however (this file) is MIT like the rest of the project.
 */

import { vector2 } from "../../maths/maths.js";

// Amount of radians corresponding to 1/3 of a rotation.
const RAD_THIRD = 2 * Math.PI / 3;

// Amount of radians corresponding to 1/12 of a rotation.
const RAD_TWELFTH = Math.PI / 6;

// Thickness of the lines.
const LINE_PROPORTION = .01;

// Dimensions of the beam.
const BEAM_PROPORTION = .13;

// Width of polygon borders to ensure overlap between fills.
const POLYBORDER_OVERLAP = 1;

// Color of the internal and external lines.
const LINE_COLOR = 'black';

// Multiplier for slightly dim color.
const DIM_FACTOR = .88;

// Multiplier for dark color.
const DARK_FACTOR = .8;

// Multiplier for darker color.
const DARKER_FACTOR = .6;

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

function resize() {
    const size = 1024;
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
function sixth(size: number, colbot: string, coltip: string, colhook: string) {
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
    polyborder([ttfa, ttfb, ttfc], coltip);

    // Hook fill.
    polyborder([left, tole, mba, ttfb, top, bfc, bfb, bfa], colmult(colhook, DARKER_FACTOR));

    // Transverse fill.
    polyborder([tole, ttfa, ttfc, mba], colmult(colbot, DIM_FACTOR));

    // Bottom fill.
    polyborder([bfa, bfb, bfc, bottom], colmult(colbot, DARK_FACTOR));

    ///////////
    // Lines //

    // Line settings.
    ctx.strokeStyle = LINE_COLOR;
    // ctx.strokeStyle = 'cyan';
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

function rgb(comp: string[]): string {
    return '#' + comp[0] + comp[1] + comp[2];
}

// Multiply a hex color component by the given factor.
function compmut(hex: string, factor: number): string {
    return Math.round(parseInt(hex, 16) * factor).toString(16).padStart(2, '0');
}

// Multiply a hex color by the given factor.
function colmult(hexcol: string, factor: number): string {
    const r = hexcol.slice(1, 3);
    const g = hexcol.slice(3, 5);
    const b = hexcol.slice(5, 7);
    return '#' + compmut(r, factor) + compmut(g, factor) + compmut(b, factor);
}

function logo() {
    const center = { x: canvas.width / 2, y: canvas.height / 2 }
    const size = Math.min(canvas.width, canvas.height) * (.5 - LINE_PROPORTION / 2);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Color components.
    const compa = '00', compb = 'bb', compc = 'ff';

    // Lime, fushia, turquoise.
    let cola = [compa, compb, compc];
    let colb = [compc, compa, compb];
    let colc = [compb, compc, compa];

    // Orange, purple, turquoise.
    cola = [compa, compb, compc];
    colb = [compb, compa, compc];
    colc = [compc, compb, compa];

    colmult(rgb(colb), .5)

    // Cyan, magenta, yellow.
    // cola = ['00', 'ff', 'ff'];
    // colb = ['ff', '00', 'ff'];
    // colc = ['ff', 'ff', '00'];

    // Greyscale.
    // cola = ['ff', 'ff', 'ff'];
    // colb = ['88', '88', '88'];
    // colc = ['00', '00', '00'];

    ctx.translate(center.x, center.y);
    third(size, rgb(cola), rgb(colb), rgb(colc));
    ctx.rotate(RAD_THIRD);
    third(size, rgb(colc), rgb(cola), rgb(colb));
    ctx.rotate(RAD_THIRD);
    third(size, rgb(colb), rgb(colc), rgb(cola));
}

window.addEventListener('resize', refresh);
refresh();
