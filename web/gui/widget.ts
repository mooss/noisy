import { spawn, HtmlCssElement } from "./html.js";
import { Label } from "./foundations.js";
import { Gardener } from "./style.js";

const colors = Gardener.colors;

export class GraphWidget extends Label {
    private canvas: HtmlCssElement<HTMLCanvasElement>;
    private ctx: CanvasRenderingContext2D;
    private values: number[] = [];

    constructor(parent: HTMLElement) {
        super(parent);
        this.canvas = spawn('canvas', this.box, Gardener.graphCanvas);
        this.ctx = this.canvas.getContext('2d');

        // Put the label on top of the graph (instead of putting it left).
        this.box.addFacet(Gardener.graphBox);
        this.elt.addFacet(Gardener.graphLabel);

        // Toggle graph visibility when label is clicked
        this.elt.addEventListener('click', () => {
            this.visible(!this.opened())
            if (this.opened()) this.draw();
        });
    }

    private get width():  number { return this.canvas.clientWidth }
    private get height(): number { return this.canvas.clientHeight }

    /** Updates the plot with new data points. */
    update(values: number[]): void {
        this.values = values;
        this.draw();
    }

    visible(show: boolean): void {
        this.canvas.style.display = show ? '': 'none';
        this.elt.style.textDecoration = show ? 'none': 'underline';
    }

    close():  GraphWidget { this.visible(false); return this; }
    open():   GraphWidget { this.visible(true); this.draw(); return this; }
    opened(): boolean     { return this.canvas.style.display === '' }

    // Displays a tooltip when hovering over the graph.
    tooltip(text: string): this {
        super.tooltip(text);
        return this;
    }

    /////////////////////////////
    // Private drawing methods //

    /** Draws the plot (graph and ticks). */
    private draw(): void {
        if (this.values.length <= 1) { console.error("Cannot draw", this.values); return; }
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        const min = Math.min(...this.values);
        const max = Math.max(...this.values);
        const range = max - min || 1;

        this.ctx.clearRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
        this.drawTicks(min, max, range);
        this.drawGraph(min, range);
    }

    /** Draws the graph line. */
    private drawGraph(min: number, range: number): void {
        const ctx = this.ctx;
        ctx.strokeStyle = colors.param;
        ctx.lineWidth = 1;
        ctx.beginPath();
        this.values.forEach((value, i) => {
            const x = (i / (this.values.length - 1)) * this.width;
            const y = this.height - ((value - min) / range) * this.height;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
    }

    /** Draws horizontal tick marks and labels for the Y axis. */
    private drawTicks(min: number, max: number, range: number): void {
        const ctx = this.ctx;
        ctx.fillStyle = colors.label;
        ctx.font = '8px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        const tickRange = this.calculateTickRange(min, max);
        const step = tickRange.step;
        let tick = Math.ceil(min / step) * step;

        for (; tick <= max; tick += step) {
            const y = this.height - ((tick - min) / range) * this.height;
            // Draw the horizontal tick line.
            ctx.strokeStyle = colors.input;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.width, y);
            ctx.stroke();

            // Draw the tick label.
            ctx.fillText(tick.toFixed(tickRange.precision), 4, y);
        }
    }

    /** Calculates optimal tick spacing and precision for the Y axis. */
    private calculateTickRange(min: number, max: number): { step: number; precision: number } {
        const range = max - min;
        const magnitude = Math.pow(10, Math.floor(Math.log10(range)));
        const step = magnitude * (range / magnitude < 2 ? 0.2 : range / magnitude < 5 ? 0.5 : 1);
        const precision = Math.max(0, -Math.floor(Math.log10(step)));
        return { step, precision };
    }
}
