import { spawn, colors } from "./html.js";
import { Label } from "./foundations.js";

export class GraphWidget extends Label {
    constructor(parent) {
        super(parent);
        this.canvas = spawn('canvas', this.box, Style.graphCanvas());
        this.ctx = this.canvas.getContext('2d');

        // Put the label on top of the graph (instead of putting it left).
        this.box.style.flexDirection = 'column';
        this.box.style.alignItems = 'flex-start';
        this.label.style.marginBottom = '4px';
        this.label.style.cursor = 'pointer';

        // Toggle graph visibility when label is clicked
        this.label.addEventListener('click', () => {
            this.#visible(!this.opened())
            if (this.opened()) this.#draw();
        });
    }

    get width() { return this.canvas.clientWidth; }
    get height() { return this.canvas.clientHeight; }

    /** Updates the plot with new data points. */
    update(values) {
        this.values = values;
        this.#draw();
    }

    #visible(show) {
        this.canvas.style.display = show ? '': 'none';
        this.label.style.textDecoration = show ? 'none': 'underline';
    }

    close() { this.#visible(false); return this; }
    open() { this.#visible(true); this.#draw(); return this; }
    opened() { return this.canvas.style.display === ''; }

    /////////////////////////////
    // Private drawing methods //

    /** Draws the plot (graph and ticks). */
    #draw() {
        if (this.values.length <= 1) { console.error("Cannot draw", this.values); return; }
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        const min = Math.min(...this.values);
        const max = Math.max(...this.values);
        const range = max - min || 1;

        this.ctx.clearRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
        this.#drawTicks(min, max, range);
        this.#drawGraph(min, range);
    }

    /** Draws the graph line. */
    #drawGraph(min, range) {
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
    #drawTicks(min, max, range) {
        const ctx = this.ctx;
        ctx.fillStyle = colors.label;
        ctx.font = '8px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        const tickRange = this.#calculateTickRange(min, max);
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
    #calculateTickRange(min, max) {
        const range = max - min;
        const magnitude = Math.pow(10, Math.floor(Math.log10(range)));
        const step = magnitude * (range / magnitude < 2 ? 0.2 : range / magnitude < 5 ? 0.5 : 1);
        const precision = Math.max(0, -Math.floor(Math.log10(step)));
        return { step, precision };
    }
}
