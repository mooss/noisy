import { HtmlCssElement, spawn } from "./html.js";
import { Gardener } from "./style.js";

export class Label {
    box: HtmlCssElement;
    elt: HtmlCssElement;

    constructor(parent: HTMLElement) {
        // Setup UI elements.
        this.box = spawn('div', parent, Gardener.label);
        this.elt = spawn('label', this.box, Gardener.labelText);
    }

    // Sets the text content of the label.
    label(name: string): this {
        this.elt.textContent = name;
        return this;
    }

    // Displays a tooltip when hovering over the label.
    tooltip(text: string): this {
        new Tooltip(this.box, text);
        return this;
    }
}

export class Tooltip {
    private elt: HtmlCssElement;

    constructor(parent: HTMLElement, text: string) {
        this.elt = spawn('div', parent, Gardener.tooltip);
        this.elt.textContent = text;
        this.elt.style.display = 'none';

        // Show and hide when hovering.
        parent.addEventListener('mouseenter', () => {
            this.elt.style.display = '';
        });
        parent.addEventListener('mouseleave', () => {
            this.elt.style.display = 'none';
        });
    }
}
