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
     * All folders contained within this panel.
     * @type {Array<Folder>}
     */
    folders = [];

    /**
     * Creates a new Panel instance.
     *
     * @param {HTMLElement} parent  - The parent DOM element.
     * @param {object}      [style] - CSS properties of the new element.
     */
    constructor(parent, style) {
        this._elt = spawn('div', parent, style);
        this.folders = [];
    }

    /**
     * Adds a folder to the panel.
     *
     * @param {string} name - The name of the folder.
     *
     * @returns {Folder} The new folder.
     */
    addFolder(name) {
        const folder = new Folder(name, this._elt);
        this.folders.push(folder);
        return folder;
    }

    /////////////////////////////
    // Parameters registration //

    bool(target, property) {
        return new Boolean(this._elt, target, property);
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
