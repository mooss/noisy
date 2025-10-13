import { clone } from "../utils/objects.js";
import { ButtonBar } from "./components/buttons.js";
import { ControlWidget } from "./components/control-widget.js";
import { ArrayWidget, BooleanWidget, MapWidget, NumberWidget, RangeControlWidget, RangeWidget, StaticText, StaticTextWidget } from "./components/parameters.js";
import { GraphWidget } from "./components/widget.js";
import { Tooltip } from "./foundations.js";
import { HtmlCssElement, spawn } from "./html.js";
import { Facet, Gardener } from "./style.js";

/////////////////
// Foundations //

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

/**
 * Main element of the graphical user interface.
 */
export class GUI extends Panel {
    static POSITION_RIGHT = new Facet('gui-right', { right: '8px', left: 'auto' });
    static POSITION_LEFT = new Facet('gui-left', { left: '8px', right: 'auto' });

    private bar: HTMLDivElement;
    private _title: HTMLDivElement;

    /** Creates a GUI instance and attach it to the document body. */
    constructor(...appearanceOverride: Facet[]) {
        super(document.body, clone(Gardener.gui).merge(...appearanceOverride));
        this.bar = spawn('div', this._elt, Gardener.collapsibleBar);
        this._title = spawn('div', this._elt, Gardener.title);
    }

    /**
     * Displays a tooltip when hovering over the title.
     * Will not display without a title.
     */
    tooltip(text: string): this {
        new Tooltip(this._title, text);
        return this;
    }

    /**
     * Adds a very thin bar at the top of the GUI that toggles collapsing/unrolling the panel when
     * clicked.
     * It must be called only once.
     */
    collapsible(): this {
        // On click, toggle the visibility of all children except the bar.
        let isCollapsed = false;
        this.bar.addEventListener('click', () => {
            isCollapsed = !isCollapsed;
            for (let i = 0; i < this._elt.children.length; i++) {
                const child = this._elt.children[i] as HTMLElement;
                if (child !== this.bar) {
                    // This only collapses the root of each elements, thus not affecting the
                    // visibility of things like folders.
                    child.style.display = isCollapsed ? 'none' : '';
                }
            }
        });

        return this;
    }

    /**
     * Adds a centered title at the top of the GUI.
     * @param text - The title.
     */
    title(text: string): this {
        this._title.textContent = text;
        return this;
    }
}

////////////
// Folder //

/**
 * A collapsible folder within the GUI.
 */
class Folder extends Panel {
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
        this.details = spawn('details', parent, Gardener.folder(isNested));
        this.summary = spawn('summary', this.details, Gardener.folderSummary(isNested));
        this.summary.textContent = title;
        const content = spawn('div', this.details, Gardener.folderContent(isNested));

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

////////////////////
// Cards and deck //

/**
 * An array of cards that can be focused one at a time.
 * Meant to be used as a tabbing system.
 */
export class Deck {
    focusedCard: Card        // The card that is currently focused.
    _container: HTMLElement; // Where the parameters of the focused card are displayed.
    cards: Card[] = [];      // All the Cards contained in this Deck.

    private headerContainer: HTMLElement; // Contains the header and the scroll arrows.
    headerBar: HTMLElement;               // Scrollable bar where the clickable card headers are displayed.
    private leftArrow: HTMLElement;       // Scroll indicator on the left of the bar.
    private rightArrow: HTMLElement;      // Scroll indicator on the right of the bar.
    private _elt: HTMLElement;

    constructor(parent: HTMLElement) {
        this._elt = spawn('div', parent, Gardener.deck);

        this.headerContainer = spawn('div', this._elt, Gardener.deckHeaderContainer);
        this.headerBar = spawn('div', this.headerContainer, Gardener.deckHeaderBar);

        // Show "arrows" on the left and right of the bar to indicate scrollability.
        this.leftArrow = spawn('div', this.headerContainer, Gardener.deckArrowLeft);
        this.rightArrow = spawn('div', this.headerContainer, Gardener.deckArrowRight);

        this.headerBar.addEventListener('scroll', () => this._updateArrows());
        this.headerBar.addEventListener('wheel', (e: WheelEvent) => {
            e.preventDefault();
            this.headerBar.scrollLeft += e.deltaY * .1;
        });

        // The content of the card goes below the header bar.
        this._container = spawn('div', this._elt);
    }

    // Create a new card.
    card(name: string): Card {
        const card = new Card(this, name);
        if (!this.focusedCard) card.focus(); // Focus the first card.
        this._updateArrows();
        this.cards.push(card);
        return card;
    }

    // Enable or disable arrow visibility based on scroll position.
    private _updateArrows() {
        const scrollLeft = this.headerBar.scrollLeft;
        const maxScroll = this.headerBar.scrollWidth - this.headerBar.clientWidth;
        this.leftArrow.style.opacity = String(scrollLeft > 0 ? 1 : 0);
        this.rightArrow.style.opacity = String(scrollLeft < maxScroll ? 1 : 0);
    }

    // Change the focused card and return the previously focused card.
    changeFocus(card: Card): Card {
        const res = this.focusedCard;
        this.focusedCard = card;
        return res;
    }
}

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

        this._button = spawn('div', deck.headerBar, Gardener.cardButton);
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
        this._button.addFacet(Gardener.cardHighlight);
        this._button.removeFacet(Gardener.cardLowlight);
    }

    // Lowlight the header, enforcing a plain border.
    lowlight(): void {
        this._button.addFacet(Gardener.cardLowlight);
        this._button.removeFacet(Gardener.cardHighlight);
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
