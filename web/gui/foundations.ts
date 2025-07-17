import { HtmlCssElement, spawn } from "./html.js";
import { Style } from "./style.js";

export class Label {
    box: HtmlCssElement;
    label: HtmlCssElement;

    constructor(parent: HTMLElement) {
        // Setup UI elements.
        this.box = spawn('div', parent, Style.label());
        this.label = spawn('label', this.box, Style.labelText());
    }

    // Sets the text content of the label.
    legend(name: string): this {
        this.label.textContent = name;
        return this;
    }
}
