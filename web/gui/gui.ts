import { colors, spawn } from "./html.js";
import { BooleanWidget, NumberWidget, RangeWidget, ReadOnlyWidget, SelectWidget } from './parameters.js';
import { Style } from "./style.js";
import { GraphWidget } from "./widget.js";

/////////////////
// Foundations //

/**
 * GUI panel that can display information and adjust parameters.
 */
export class Panel {
    /**
     * The main container element for the panel.
     */
    _elt: HTMLElement;

    /**
     * Creates a new Panel instance.
     */
    constructor(parent: HTMLElement, style?: Record<string, string | number>) {
        this._elt = spawn('div', parent, style);
    }

    /////////////////////////////
    // Parameters registration //

    bool(target, property) {
        return BooleanWidget(this._elt, target, property);
    }

    folder(name) {
        return new Folder(name, this._elt);
    }

    deck() {
        return new Deck(this._elt);
    }

    graph() {
        return new GraphWidget(this._elt);
    }

    number(target, property) {
        return NumberWidget(this._elt, target, property);
    }

    range(target, property, min, max, step) {
        return RangeWidget(this._elt, target, property, min, max, step);
    }

    readOnly(content) {
        return ReadOnlyWidget(this._elt, content);
    }

    select(target, property, options) {
        return SelectWidget(this._elt, target, property, options);
    }
}

/**
 * Main element of the graphical user interface.
 */
export class GUI extends Panel {
    static POSITION_RIGHT = { right: '8px', left: 'auto' };
    /**
     * Creates a GUI instance and attach it to the document body.
     */
    constructor(...styleOverride) {
        super(document.body, Object.assign(Style.gui(), ...styleOverride));
    }

    /**
     * Adds a very thin bar at the top of the GUI that toggles collapsing/unrolling the panel when
     * clicked.
     * It must be called only once.
     * @returns {this}
     */
    collapsible() {
        // Create the thin bar element.
        const bar = document.createElement('div');
        Object.assign(bar.style, Style.collapsibleBar());

        // Insert the bar as the first child of the panel container.
        this._elt.insertBefore(bar, this._elt.firstChild);

        // On click, toggle the visibility of all children except the bar.
        let isCollapsed = false;
        bar.addEventListener('click', () => {
            isCollapsed = !isCollapsed;
            for (let i = 0; i < this._elt.children.length; i++) {
                const child = this._elt.children[i];
                if (child !== bar) {
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
     * @param {string} text - The title.
     * @returns {this}
     */
    title(text) {
        const title = spawn('div', this._elt, Style.title());
        title.textContent = text;
        return this;
    }
}

////////////
// Folder //

/**
 * A collapsible folder within the GUI.
 */
class Folder extends Panel {
    title;

    /**
     * The details HTML element that wraps the folder content.
     * @type {HTMLDetailsElement}
     */
    #details;

    /**
     * Creates a new Folder instance.
     * @param {HTMLElement} parent  - The parent DOM element.
     * @param {string}      title   - The title of the folder.
     */
    constructor(title, parent) {
        super(parent);

        const isNested = parent.closest('details') !== null;
        const left = 6;

        this.#details = spawn('details', parent, {
            marginTop: '4px',
            padding: '0',
            paddingLeft: isNested ? `${left}px` : '0',
        });
        spawn('summary', this.#details, {
            cursor: 'pointer',
            fontWeight: 600,
            padding: '4px 0',
            marginLeft: isNested ? `-${left}px` : '0',
            paddingLeft: isNested ? `${left - 2}px` : '0',
        }).textContent = title;
        const content = spawn('div', this.#details, {
            borderLeft: isNested ? `3px solid ${colors.border}` : 'none',
            paddingLeft: isNested ? `${left}px` : '0',
        });

        this.#details.open = true;
        this.title = title;
        this._elt.style.paddingLeft = '0';
        content.appendChild(this._elt); // Doesn't display properly without this.
    }

    show() { this.#details.style.display = ''; return this; }
    hide() { this.#details.style.display = 'none'; return this; }
    open() { this.#details.open = true; return this; }
    close() { this.#details.open = false; return this; }
}

////////////////////
// Cards and deck //

/**
 * An array of cards that can be focused one at a time.
 * Meant to be used as a tabbing system.
 */
class Deck extends Panel {
    focusedCard; // The card that is currently focused.
    _container;   // Where the parameters of the focused card are displayed.
    cards = [];        // All the Cards contained in this Deck.

    _headerContainer; // Contains the header and the scroll arrows.
    _headerBar;       // Scrollable bar where the clickable card headers are displayed.
    #leftArrow;       // Scroll indicator on the left of the bar.
    #rightArrow;      // Scroll indicator on the right of the bar.

    constructor(parent) {
        super(parent);
        this._elt.css({
            marginTop: '6px',
            display: 'flex',
            flexDirection: 'column',
        });

        this._headerContainer = spawn('div', this._elt, Style.deckHeaderContainer());
        this._headerBar = spawn('div', this._headerContainer, Style.deckHeaderBar());

        // Show "arrows" on the left and right of the bar to indicate scrollability.
        const arrow = {
            position: 'absolute',
            width: '32px',
            pointerEvents: 'none',
            opacity: 0,
            transition: 'opacity 0.2s',
        }
        const arrowback = (deg) => `linear-gradient(${deg}deg, rgba(20,25,35,0.9) 0%, rgba(20,25,35,0) 100%)`;

        this.#leftArrow = spawn('div', this._headerContainer, Object.assign({
            left: 0, top: 0, bottom: 0,
            background: arrowback(90),
        }, arrow));
        this.#rightArrow = spawn('div', this._headerContainer, Object.assign({
            right: 0, top: 0, bottom: 0,
            background: arrowback(270),
        }, arrow));

        this._headerBar.addEventListener('scroll', () => this._updateArrows());
        this._headerBar.addEventListener('wheel', (e) => {
            e.preventDefault();
            this._headerBar.scrollLeft += e.deltaY * .1;
        });

        // The content of the card goes below the header bar.
        this._container = spawn('div', this._elt);
    }

    // Create a new card.
    card(name) {
        const card = new Card(this, name);
        if (!this.focusedCard) card.focus(); // Focus the first card.
        this._updateArrows();
        this.cards.push(card);
        return card;
    }

    // Enable or disable arrow visibility based on scroll position.
    _updateArrows() {
        const scrollLeft = this._headerBar.scrollLeft;
        const maxScroll = this._headerBar.scrollWidth - this._headerBar.clientWidth;
        this.#leftArrow.style.opacity = scrollLeft > 0 ? 1 : 0;
        this.#rightArrow.style.opacity = scrollLeft < maxScroll ? 1 : 0;
    }

    // Change the focused card and return the previously focused card.
    changeFocus(card) {
        const res = this.focusedCard;
        this.focusedCard = card;
        return res;
    }
}

/**
 * Part of a Deck, essentially a focusable Panel with a title.
 */
class Card extends Panel {
    name: string;                             // Displayed name of the card.
    private _deck: Deck;                      // The window to which the tab is attached.
    private _button: HTMLElement;             // The clickable tab sitting in the header bar.
    private _onClick: ((card: Card) => void); // Callback for the card click event.

    constructor(deck: Deck, name: string) {
        super(deck._container);
        this._deck = deck;
        this.name = name;

        this._button = spawn('div', deck._headerBar, Style.cardButton());
        this._button.textContent = name;
        this._button.addEventListener('click', () => this.focus());

        this.hide();
    }

    // Highlight the header, putting an accent color on its border.
    highlight() {
        this._button.style.backgroundColor = colors.inputBg;
        this._button.style.border = `2px solid ${colors.param}`;
    }

    // Lowlight the header, enforcing a plain border.
    lowlight() {
        this._button.style.backgroundColor = '';
        this._button.style.border = `1px solid ${colors.input}`;
    }

    // Show the content.
    show() { this._elt.style.display = '' }
    // Hide the content.
    hide() { this._elt.style.display = 'none' }

    focus() {
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

    onClick(fun: (card: Card) => void) { this._onClick = fun; return this; }
}
