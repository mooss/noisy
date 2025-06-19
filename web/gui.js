import { clamp } from './utils.js'

const colors = {
    border: 'grey',
    input: 'steelblue',
    inputBg: '#2D3748',
    label: 'lightskyblue',
    param: 'orchid',
    text: 'lightgray',
}

/**
 * Spawns an HTML element below parent and assign it an optional style.
 *
 * A `css` method is added to the element to conveniently change the stile.
 *
 * @param {string}      tag         - The HTML tag name for the new element.
 * @param {HTMLElement} parent      - The parent DOM element.
 * @param {object}      [style]     - CSS properties of the new element.
 *
 * @returns {HTMLElement} The newly created HTML element.
 */
function spawn(tag, parent, style) {
    let res = document.createElement(tag);
    res.css = function(attrs) { Object.assign(res.style, attrs); };
    if (style !== undefined) {
        res.css(style);
    }

    parent.appendChild(res);

    return res;
}

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

    number(target, property) {
        return new Number(this._elt, target, property);
    }

    range(target, property, min, max, step) {
        return new Range(this._elt, target, property, min, max, step);
    }

    select(target, property, options) {
        return new Select(this._elt, target, property, options);
    }

    readOnly(content) {
        return new ReadOnly(this._elt, content);
    }
}

/**
 * Main element of the graphical user interface.
 */
export class GUI extends Panel {
    /**
     * Creates a GUI instance and attach it to the document body.
     */
    constructor() {
        super(document.body, {
            // Top left position.
            position: 'absolute',
            top: '8px',          // Distance from the top to the nearest ancestor.
            left: '8px',         // Distance from the right of the nearest positioned ancestor.
            zIndex: '1000',       // Ensure element is on top.

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
        });
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

/////////////////////
// Parameter types //

class Param {
    constructor(parent) {
        // Setup UI elements.
        this.box = spawn('div', parent, {
            display: 'flex',
            alignItems: 'center',
            padding: '4px 0 0 0',
        });
        this.label = spawn('label', this.box, {
            flex: '1',
            marginRight: '8px',
            color: colors.label,
        });
        this.valueContainer = spawn('div', this.box, { // Aligns inputs.
            width: '110px',
            display: 'flex',
            color: colors.param,
        });
        this.input = spawn(this.tag(), this.valueContainer, {
            color: colors.param,
            padding: '0',
            boxSizing: 'border-box',
            fontSize: '10px',
        });
    }

    // Sets the text content of the label.
    legend(name) { this.label.textContent = name; return this; }

    // Returns the tag name for the input element.
    tag() { return 'input'; }
}

// Abstract base input parameter, all concrete input parameters must implement the setup and value
// methods.
class InputParam extends Param {
    // UI parameter attached to parent and tied to target.property.
    constructor(parent, target, property, ...args) {
        super(parent);

        this.input.addEventListener('input', () => {
            const value = this.value();
            this.update(value);
            target[property] = value;
            if (this._onInput) this._onInput(value);
        })
        this.input.addEventListener('change', () => {
            if (this._onChange) this._onChange(this.value());
        });
        this.setup(target[property], ...args);
        this.update(this.value());

        if (this.scroll) { // Parameter with mouse scroll support.
            this.input.addEventListener('wheel', (event) => {
                if (event.deltaY == 0) return; // Only process vertical scroll.
                event.preventDefault(); // No zoom.
                const before = this.value();
                this.scroll(event.deltaY < 0);
                if (this.value() == before) return; // No change.
                this.input.dispatchEvent(new Event('input'));
                this.input.dispatchEvent(new Event('change'));
            })
        }
    }

    // Assigns to the properties of this.input.
    setInput(fields) { Object.assign(this.input, fields); }

    //////////////////////////
    // Overrideable methods //
    // The methods below define behaviors that are shared by some parameter types, but still need to
    // be redefined by others.

    // Initialisation of the parameter given the initial value, must be defined in the concrete
    // subclass.
    setup() { throw new Error('Method "setup()" must be implemented.'); }

    // Returns the current value of the parameter in the UI, must be defined in the concrete
    // subclass.
    value() { throw new Error('Method "value()" must be implemented.'); }

    // Update the UI given the new value.
    update() {}

    //////////////////////////////////
    // Chainable definition methods //

    // Make the input read-only.
    readOnly() { this.input.disabled = true; return this; }

    // Register a listener for the change event.
    onChange(fun) { this._onChange = fun; return this; }

    // Register a listener for the input event.
    onInput(fun) { this._onInput = fun; return this; }
}

class Boolean extends InputParam {
    setup(initial) {
        this.input.css({
            margin: 0,
            width: 'auto',
            // Add custom styling:
            appearance: 'none',
            WebkitAppearance: 'none',
            width: '14px',
            height: '14px',
            backgroundColor: colors.inputBg,
            border: `1px solid ${colors.input}`,
            position: 'relative',
            cursor: 'pointer',
        });

        // Add checkmark styling using ::before pseudo-element
        const style = spawn('style', document.head);
        style.textContent = `
            input[type="checkbox"]:checked::before {
                content: '';
                position: absolute;
                left: 4px;
                top: 1px;
                width: 4px;
                height: 7px;
                border: solid ${colors.param};
                border-width: 0 2px 2px 0;
                transform: rotate(45deg);
            }
        `;

        this.setInput({type: 'checkbox', checked: initial});
    }
    value() { return this.input.checked; }
}

class Range extends InputParam {
    scroll(up) {
        let delta = parseFloat(-this.input.step);
        if (up) delta = -delta;
        this.input.value = clamp(
            this.value() + delta,
            parseFloat(this.input.min), parseFloat(this.input.max),
        );
    }

    setup(initial, min, max, step) {
        this.input.css({
            width: '100%',
            height: '16px',
            appearance: 'none',
            background: colors.inputBg,
            outline: 'none',
            cursor: 'pointer',
            padding: '0',
            margin: '0',
        });
        this.setInput({
            type: 'range',
            min: min,
            max: max,
            step: step,
            value: initial,
        })
        this.valueSpan = spawn('span', this.valueContainer, {
            width: '40px',
            marginLeft: '5px',
        });
        
        // Style the slider thumb as a vertical bar.
        const style = spawn('style', document.head);
        style.textContent = `
            input[type="range"]::-webkit-slider-thumb {
                appearance: none;
                width: 4px;
                height: 16px;
                background: ${colors.input};
                cursor: pointer;
            }
            input[type="range"]::-moz-range-thumb {
                width: 3px;
                height: 16px;
                background: ${colors.input};
                cursor: pointer;
                border: none;
                border-radius: 0;
            }
        `;
    }

    update(value) { this.valueSpan.textContent = value; }
    value() { return parseFloat(this.input.value); }
}

class Select extends InputParam {
    scroll(up) {
        let delta = 1;
        if (up) delta = -1;
        this.input.selectedIndex = clamp(
            this.input.selectedIndex + delta,
            0, this.input.options.length -1,
        );
    }

    setup(initial, options) {
        this.input.css({
            width: '100%',
            background: colors.inputBg,
            border: `1px solid ${colors.input}`,
            height: '16px',
            paddingLeft: '2px',
            boxSizing: 'border-box',
        });

        const isKeyBased = Object.prototype.hasOwnProperty.call(options, initial);
        if (isKeyBased) {
            this._dictMode = true; // Can't be private because of JS schenanigans.
            for (const key of Object.keys(options)) {
                const option = spawn('option', this.input);
                option.text = key;
                option.value = key;
                if (key === initial) option.selected = true;
            }
        } else {
            this._dictMode = false;
            for (const [key, value] of Object.entries(options)) {
                const option = spawn('option', this.input);
                option.text = key;
                option.value = JSON.stringify(value);
                if (value === initial) option.selected = true;
            }
        }
    }

    tag() { return 'select'; }

    value() {
        if (this._dictMode) {
            return this.input.value;
        }
        return JSON.parse(this.input.value);
    }
}

class Number extends InputParam {
    scroll(up) {
        let delta = -1;
        if (up) delta = -delta;
        this.input.value = this.value() + delta;
    }

    setup(initial) {
        this.input.css({
            width: '100%',
            background: 'rgba(45, 55, 72, 0.8)',
            border: `1px solid ${colors.input}`,
            paddingLeft: '2px',
        });
        this.setInput({type: 'number', value: initial});
    }

    value() { return parseFloat(this.input.value); }
}

class ReadOnly extends Param {
    constructor(parent, content) {
        super(parent);
        this.update(content);
    }

    tag() { return 'label'; }

    update(content) {
        this.input.textContent = content;
    }
}
