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
        new Tooltip(this.elt, text);
        return this;
    }
}

export class Tooltip {
    private elt: HtmlCssElement;

    constructor(parent: HTMLElement, text: string) {
        this.elt = spawn('div', document.body, Gardener.tooltip);
        this.elt.textContent = text;
        this.elt.style.display = 'none';

        // Show and hide when hovering.
        parent.addEventListener('mouseenter', () => {
            const rect = parent.getBoundingClientRect();
            this.elt.style.left = `${rect.left}px`;
            this.elt.style.top = `${rect.bottom + window.scrollY}px`;
            this.elt.style.display = '';
        });
        parent.addEventListener('mouseleave', () => {
            this.elt.style.display = 'none';
        });
    }
}
