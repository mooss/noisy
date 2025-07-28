import { HtmlCssElement, spawn } from "./html.js";
import { Gardener } from "./style.js";

export class Label {
    box: HtmlCssElement;
    label: HtmlCssElement;

    constructor(parent: HTMLElement) {
        // Setup UI elements.
        this.box = spawn('div', parent, Gardener.label);
        this.label = spawn('label', this.box, Gardener.labelText);
    }

    // Sets the text content of the label.
    legend(name: string): this {
        this.label.textContent = name;
        return this;
    }
}
