import { HtmlCssElement, spawn } from "./html.js";
import { LemonCloak } from "./style.js";

/**
 * A horizontal bar containing clickable buttons.
 * Similar to Deck but without the card content switching behavior.
 */
export class ButtonBar {
    private container: HTMLElement;
    private buttons: Button[] = [];

    constructor(parent: HTMLElement) {
        this.container = spawn('div', parent, LemonCloak.buttonBar);
    }

    /**
     * Creates a new button in the bar.
     * @param label - Text to display on the button
     */
    button(label: string): Button {
        const button = new Button(this.container, label);
        this.buttons.push(button);
        return button;
    }
}

/**
 * A clickable button element.
 * Shares styling with Card buttons but without the deck functionality.
 */
export class Button {
    private _elt: HtmlCssElement;
    private _onClick?: (() => void);

    constructor(parent: HTMLElement, label: string) {
        this._elt = spawn('div', parent, LemonCloak.button);
        this._elt.textContent = label;
        this._elt.addEventListener('click', () => this._onClick?.());
    }

    onClick(callback: () => void): this {
        this._onClick = callback;
        return this;
    }
}
