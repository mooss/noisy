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
}
