import { spawn, colors } from "./html.js";
import { Label } from "./foundations.js";

export class GraphWidget extends Label {
    constructor(parent) {
        super(parent);
        this.canvas = spawn('canvas', this.box, {
            width: '100%',
            height: '80px',
            backgroundColor: colors.inputBg,
        });
        this.ctx = this.canvas.getContext('2d');

        // Put the label on top of the graph (instead of putting it left).
        this.box.style.flexDirection = 'column';
        this.box.style.alignItems = 'flex-start';
        this.label.style.marginBottom = '4px';
    }

    get width() { return this.canvas.clientWidth; }
    get height() { return this.canvas.clientHeight; }

    /**
     * Update the graph with new data points
     * @param {number[]} values - Array of values to plot
     * @param {string} [color] - Optional line color
     */
    update(values, color = colors.param) {
        this.ctx.clearRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
        this.#draw(values, color);
    }

    #draw(values, color) {
        if (values.length <= 1) { console.error("Cannot draw", values); return; }

        this.canvas.width = this.width;
        this.canvas.height = this.height;
        const maxVal = Math.max(...values);
        const minVal = Math.min(...values);
        const range = maxVal - minVal || 1;

        const ctx = this.ctx;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();

        // Draw the line.
        values.forEach((value, i) => {
            const x = (i / (values.length - 1)) * this.width;
            const y = this.height - ((value - minVal) / range) * this.height;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();
    }
}
