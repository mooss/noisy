import { spawn } from "../html.js";
import { Blawhi } from "../style.js";
import { Card } from "./panel.js";

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
        this._elt = spawn('div', parent, Blawhi.deck);

        this.headerContainer = spawn('div', this._elt, Blawhi.deckHeaderContainer);
        this.headerBar = spawn('div', this.headerContainer, Blawhi.deckHeaderBar);

        // Show "arrows" on the left and right of the bar to indicate scrollability.
        this.leftArrow = spawn('div', this.headerContainer, Blawhi.deckArrowLeft);
        this.rightArrow = spawn('div', this.headerContainer, Blawhi.deckArrowRight);

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
