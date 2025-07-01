import { Boolean, Number, Range, ReadOnly, Select } from "./parameters.js";
import { GraphWidget } from "./widget.js";
import { spawn, colors } from "./html.js";

/**
 * GUI panel that can display information and adjust parameters.
 */
class Panel {
    /**
     * The main container element for the panel.
     * @type {HTMLDivElement}
     */
    _elt;

    /**
     * Creates a new Panel instance.
     *
     * @param {HTMLElement} parent  - The parent DOM element.
     * @param {object}      [style] - CSS properties of the new element.
     */
    constructor(parent, style) {
        this._elt = spawn('div', parent, style);
    }

    /////////////////////////////
    // Parameters registration //

    bool(target, property) {
        return new Boolean(this._elt, target, property);
    }

    folder(name) {
        return new Folder(name, this._elt);
    }

    graph() {
        return new GraphWidget(this._elt);
    }

    number(target, property) {
        return new Number(this._elt, target, property);
    }

    range(target, property, min, max, step) {
        return new Range(this._elt, target, property, min, max, step);
    }

    readOnly(content) {
        return new ReadOnly(this._elt, content);
    }

    select(target, property, options) {
        return new Select(this._elt, target, property, options);
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
        super(document.body, Object.assign({
            // Top left default position.
            position: 'absolute',
            top: '8px',     // Distance from the top to the nearest ancestor.
            left: '8px',    // Distance from the right of the nearest positioned ancestor.
            zIndex: '1000', // Ensure element is on top.

            // Dimensions.
            width: '230px',
            maxHeight: '90vh',

            // Inner style.
            padding: '4px',
            backgroundColor: 'rgba(20, 25, 35, 0.85)',
            color: colors.text,
            fontSize: '12px',
            borderRadius: '4px',

            // Behavior.
            overflowY: 'auto', // Adds a scrollbar if content overflows vertically.
        }, ...styleOverride));
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
        bar.style.height = '4px';
        bar.style.width = '100%';
        bar.style.cursor = 'pointer';
        bar.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        bar.style.borderRadius = '2px 2px 0 0';
        bar.style.marginBottom = '4px';
        bar.style.userSelect = 'none';

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
        const title = spawn('div', this._elt, {
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: '14px',
            padding: '4px 0',
            marginBottom: '4px',
            color: colors.text,
        });
        title.textContent = text;
        return this;
    }
}

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
            paddingLeft: isNested ? `${left-2}px` : '0',
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
