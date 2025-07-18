import { HtmlCssElement, spawn } from "./html.js";
import { LemonCloak } from "./style.js";

export class Label {
    box: HtmlCssElement;
    label: HtmlCssElement;

    constructor(parent: HTMLElement) {
        // Setup UI elements.
        this.box = spawn('div', parent, LemonCloak.label);
        this.label = spawn('label', this.box, LemonCloak.labelText);
    }

    // Sets the text content of the label.
    legend(name: string): this {
        this.label.textContent = name;
        return this;
    }
}
