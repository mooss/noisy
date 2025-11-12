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

    ////////////////
    // Containers //

    buttons(): ButtonBar {
        return new ButtonBar(this._elt);
    }

    deck(): Deck {
        return new Deck(this._elt);
    }

    folder(name: string): Folder {
        return new Folder(name, this._elt);
    }

    menu(): MenuBar {
        return new MenuBar(this._elt);
    }

    /////////////
    // Widgets //

    array(
        target: Record<string, any>, property: string, options: Array<string>,
    ): ControlWidget<any> {
        return ArrayWidget(this._elt, target, property, options);
    }

    bool(target: Record<string, any>, property: string): ControlWidget<boolean> {
        return BooleanWidget(this._elt, target, property);
    }

    graph(): GraphWidget {
        return new GraphWidget(this._elt);
    }

    number(target: Record<string, any>, property: string): ControlWidget<number> {
        return NumberWidget(this._elt, target, property);
    }

    map(
        target: Record<string, any>, property: string, options: Record<string, any>,
    ): ControlWidget<any> {
        return MapWidget(this._elt, target, property, options);
    }

    range(
        target: Record<string, any>, property: string, min: number, max: number, step: number,
    ): RangeControlWidget {
        return RangeWidget(this._elt, target, property, min, max, step);
    }

    static(content: any): StaticText {
        return StaticTextWidget(this._elt, content);
    }
}

///////////////////////////////////
// Circular dependency avoidance //
///////////////////////////////////
// Some panels are defined here as a cheap way to avoid a circular dependency.

///////////////////
// Deck of cards //

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

/////////////
// Folders //

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

///////////
// Menus //

/**
 * A menu bar that contains menu items, each of which can open a panel to the right when clicked.
 */
export class MenuBar {
    _elt: HtmlCssElement;
    private items: MenuItem[] = [];

    constructor(parent: HTMLElement) {
        this._elt = spawn('div', parent, Blawhi.menuBar);
    }

    /**
     * Adds a new menu item to the bar.
     * @param   label - Text to display on the item.
     * @returns the menu item for further configuration.
     */
    item(label: string): MenuItem {
        const item = new MenuItem(this._elt, label);
        this.items.push(item);
        return item;
    }
}

/**
 * An individual item in a menu bar.
 */
export class MenuItem {
    private elt: HtmlCssElement;
    private panel: MenuPanel | null = null;

    // Used to retract menu when there is a click outside.
    private panelClickListener: ((e: MouseEvent) => void) | null = null;

    constructor(parent: HTMLElement, label: string) {
        this.elt = spawn('div', parent, Blawhi.menuItem);
        this.elt.textContent = label;
        this.elt.addEventListener('click', () => this.open());
    }

    /**
     * Adds a sub-item to this menu item, which will appear in the panel when opened.
     * @param label    - Text to display on sub-item.
     * @param callback - The function to call when the sub-item is clicked.
     * @returns this for chaining.
     */
    subItem(label: string, callback: () => void): this {
        if (!this.panel) {
            // Attach the panel to the document body so hovering the panel does not
            // trigger hover on the parent menu item.
            this.panel = new MenuPanel(document.body);
        }
        this.panel.item(label, callback);
        return this;
    }

    private open(): void {
        if(!this.panel) return;
        const rect = this.elt.getBoundingClientRect();
        // Show the panel below the menu item (attached to the bottom), not to the right.
        this.panel.show(rect.left, rect.bottom);

        if (this.panelClickListener)
            document.removeEventListener('click', this.panelClickListener);

        this.panelClickListener = () => {
            this.panel?.hide();
            document.removeEventListener('click', this.panelClickListener!);
            this.panelClickListener = null;
        };

        setTimeout(() => document.addEventListener('click', this.panelClickListener), 0);
    }
}

/**
 * A panel that appears when a menu item is clicked, containing sub-items.
 */
export class MenuPanel {
    elt: HtmlCssElement;
    private container: HtmlCssElement;

    constructor(parent: HTMLElement) {
        this.elt = spawn('div', parent, Blawhi.menuPanel);
        this.container = spawn('div', this.elt);
        this.elt.style.display = 'none';
    }

    /**
     * Adds an item to the panel.
     * @param label    - Text to display the item.
     * @param callback - The function to call when the item is clicked.
     */
    item(label: string, callback: () => void): void {
        const itemElt = spawn('div', this.container, Blawhi.menuItem);
        itemElt.textContent = label;
        itemElt.addEventListener('click', callback);
    }

    /**
     * Shows the panel at the specified position.
     * @param x - The x-coordinate.
     * @param y - The y-coordinate.
     */
    show(x: number, y: number): void {
        // Use fixed positioning at show-time (instead of putting position in the stylesheet) so the
        // panel is positioned relative to the viewport, doesn't alter layout, and won't cause the
        // parent menu item to remain highlighted when the cursor is over the floating panel.
        this.elt.style.position = 'fixed';
        this.elt.style.left = `${x}px`;
        this.elt.style.top = `${y}px`;
        this.elt.style.display = 'block';
    }

    hide(): this { this.elt.style.display = 'none'; return this; }
}
