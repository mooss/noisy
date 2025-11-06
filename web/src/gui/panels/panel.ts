import { ButtonBar } from "../components/buttons.js";
import { ControlWidget } from "../components/control-widget.js";
import { ArrayWidget, BooleanWidget, MapWidget, NumberWidget, RangeControlWidget, RangeWidget, StaticText, StaticTextWidget } from "../components/parameters.js";
import { GraphWidget } from "../components/widget.js";
import { Tooltip } from "../foundations.js";
import { HtmlCssElement, spawn } from "../html.js";
import { Blawhi, Facet } from "../style.js";
import { Deck } from "./deck.js";

/**
 * GUI panel that can display information and adjust parameters.
 */
export abstract class Panel {
    /**
     * The main container element for the panel.
     */
    _elt: HtmlCssElement<HTMLDivElement>;

    /**
     * Creates a new Panel instance.
     */
    constructor(parent: HTMLElement, style?: Facet) {
        this._elt = spawn('div', parent, style);
    }

    /** Displays a tooltip when hovering over the element. */
    abstract tooltip(text: string): this;

    /////////////////////////////
    // Parameters registration //

    bool(target: Record<string, any>, property: string): ControlWidget<boolean> {
        return BooleanWidget(this._elt, target, property);
    }

    folder(name: string): Folder {
        return new Folder(name, this._elt);
    }

    deck(): Deck {
        return new Deck(this._elt);
    }

    buttons(): ButtonBar {
        return new ButtonBar(this._elt);
    }

    graph(): GraphWidget {
        return new GraphWidget(this._elt);
    }

    number(target: Record<string, any>, property: string): ControlWidget<number> {
        return NumberWidget(this._elt, target, property);
    }

    range(
        target: Record<string, any>, property: string, min: number, max: number, step: number,
    ): RangeControlWidget {
        return RangeWidget(this._elt, target, property, min, max, step);
    }

    static(content: any): StaticText {
        return StaticTextWidget(this._elt, content);
    }

    map(
        target: Record<string, any>, property: string, options: Record<string, any>,
    ): ControlWidget<any> {
        return MapWidget(this._elt, target, property, options);
    }

    array(
        target: Record<string, any>, property: string, options: Array<string>,
    ): ControlWidget<any> {
        return ArrayWidget(this._elt, target, property, options);
    }
}

///////////////////////////////////
// Circular dependency avoidance //
// Some panels are defined here as a cheap way to avoid a circular dependency.

/**
 * Part of a Deck, essentially a focusable Panel with a title.
 */
export class Card extends Panel {
    name: string;                           // Displayed name of the card.
    private _deck: Deck;                    // The window to which the tab is attached.
    private _button: HtmlCssElement;        // The clickable tab sitting in the header bar.
    private _onClick: (card: Card) => void; // Callback for the card click event.

    constructor(deck: Deck, name: string) {
        super(deck._container);
        this._deck = deck;
        this.name = name;

        this._button = spawn('div', deck.headerBar, Blawhi.cardButton);
        this._button.textContent = name;
        this._button.addEventListener('click', () => this.focus());
        this.lowlight(); // Spawns the border.

        this.hide();
    }

    /** Displays a tooltip when hovering over the card. */
    tooltip(text: string): this {
        new Tooltip(this._button, text, this._deck.headerBar);
        return this;
    }

    // Highlight the header, putting an accent color on its border.
    highlight(): void {
        this._button.addFacet(Blawhi.cardHighlight);
        this._button.removeFacet(Blawhi.cardLowlight);
    }

    // Lowlight the header, enforcing a plain border.
    lowlight(): void {
        this._button.addFacet(Blawhi.cardLowlight);
        this._button.removeFacet(Blawhi.cardHighlight);
    }

    // Show the content.
    show(): void { this._elt.style.display = '' }
    // Hide the content.
    hide(): void { this._elt.style.display = 'none' }

    focus(): Card {
        const old = this._deck.changeFocus(this);
        if (old) {
            old.lowlight();
            old.hide();
        }
        this.highlight();
        this.show();
        this._onClick?.(this);
        return this;
    }

    onClick(fun: (card: Card) => void): this { this._onClick = fun; return this; }
}
/**
 * A collapsible folder within the GUI.
 */
export class Folder extends Panel {
    /** The collapsible header of the folder, containing the title. */
    private summary: HTMLElement;

    /** The details HTML element that wraps the folder content. */
    private details: HTMLDetailsElement;

    /**
     * Creates a new Folder instance.
     * @param title - The title of the folder.
     * @param parent - The parent DOM element.
     */
    constructor(title: string, parent: HTMLElement) {
        super(parent);

        const isNested = parent.closest('details') !== null;
        this.details = spawn('details', parent, Blawhi.folder(isNested));
        this.summary = spawn('summary', this.details, Blawhi.folderSummary(isNested));
        this.summary.textContent = title;
        const content = spawn('div', this.details, Blawhi.folderContent(isNested));

        this.details.open = true;
        this._elt.style.paddingLeft = '0';
        content.appendChild(this._elt); // Doesn't display properly without this.
    }

    /** Displays a tooltip when hovering over the folder. */
    tooltip(text: string): this {
        // Tooltips display at the very bottom of the panel without this.
        this.summary.style.position = 'relative';

        new Tooltip(this.summary, text);
        return this;
    }

    show(): this { this.details.style.display = ''; return this; }
    hide(): this { this.details.style.display = 'none'; return this; }
    open(): this { this.details.open = true; return this; }
    close(): this { this.details.open = false; return this; }
}
