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
            top: '10px',          // Distance from the top to the nearest ancestor.
            left: '10px',         // Distance from the right of the nearest positioned ancestor
            zIndex: '1000',       // Ensure element is on top.

            // Dimensions.
            width: '300px',
            maxHeight: '90vh',

            // Inner style.
            padding: '10px',
            backgroundColor: 'rgba(0, 0, 0, .7)',
            color: '#fff',
            fontFamily: 'sans-serif',
            fontSize: '14px',

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
        super(parent, {marginLeft: '10px'});

        this.#details = spawn('details', parent, {
            border: '1px solid #888',
            marginBottom: '5px',
            padding: '5px',
        });
        this.#details.open = true;

        spawn('summary', this.#details, {cursor: 'pointer'}).textContent = title;
        this.title = title;
        this.#details.appendChild(this._elt); // Doesn't display properly without this.
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
            marginBottom: '4px',
        });
        this.label = spawn('label', this.box, {
            flex: '1',
            marginRight: '6px',
        });
        this.valueContainer = spawn('div', this.box, { // Aligns inputs.
            width: '120px',
            display: 'flex',
        });
        this.input = spawn(this.tag(), this.valueContainer);
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
        this.input.css({width: 'auto'});
        this.setInput({type: 'checkbox', checked: initial});
    }
    value() { return this.input.checked; }
}

class Range extends InputParam {
    setup(initial, min, max, step) {
        this.input.css({width: '100%'});
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
    }

    update(value) { this.valueSpan.textContent = value; }
    value() { return parseFloat(this.input.value); }
}

class Select extends InputParam {
    setup(initial, options) {
        this.input.css({width: '100%'});
        for (const [key, value] of Object.entries(options)) {
            const option = spawn('option', this.input);
            option.text = key;
            option.value = JSON.stringify(value);
            if (value === initial) option.selected = true;
        }
    }

    tag() { return 'select'; }
    value() { return JSON.parse(this.input.value); }
}

class Number extends InputParam {
    setup(initial) {
        this.input.css({width: '100%'});
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
