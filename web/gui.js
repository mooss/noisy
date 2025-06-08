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
     * Adds a control to the Panel.
     *
     * The type of control created depends on the type of the property.
     *
     * @param {object} target - The object containing the property to control.
     * @param {string} prop   - The name of the property to control.
     * @param {...*}   args   - Additional arguments for control specification (e.g., min, max, step, options).
     *
     * @returns {HTMLElement} The new control element.
     */
    add(target, prop, ...args) {
        return createControl(this._elt, target, prop, args);
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

    show() {
        this.#details.style.display = '';
    }

    hide() {
        this.#details.style.display = 'none';
    }
}

/////////////////////
// Parameter types //

// Abstract base parameter class, all concrete parameters must implement the setup and value
// methods.
class Param {
    // UI parameter attached to parent and tied to target.property.
    constructor(parent, target, property, ...args) {
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
        this.input = spawn(this.tag(), this.box);
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

    // Assign to the properties of this.input.
    setInput(fields) { Object.assign(this.input, fields); }

    //////////////////////////
    // Overrideable methods //
    // The methods below define behaviors that are shared by some parameter types, but still need to
    // be redefined by others.

    // Returns the tag name for the input element.
    tag() { return 'input'; }

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

    // Set the text content of the label.
    legend(name) { this.label.textContent = name; return this; }

    // Register a listener for the change event.
    onChange(fun) { this._onChange = fun; return this; }

    // Register a listener for the input event.
    onInput(fun) { this._onInput = fun; return this; }
}

class Boolean extends Param {
    setup(initial) { this.setInput({type: 'checkbox', checked: initial}); }
    value() { return this.input.checked; }
}

class Range extends Param {
    setup(initial, min, max, step) {
        this.setInput({
            type: 'range',
            min: min,
            max: max,
            step: step,
            value: initial,
        })
        this.valueSpan = spawn('span', this.box, {'marginLeft': '8px'});
    }

    update(value) { this.valueSpan.textContent = value; }
    value() { return parseFloat(this.input.value); }
}

class Select extends Param {
    setup(initial, options) {
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

class Number extends Param {
    setup(initial) { this.setInput({type: 'number', value: initial}); }
    value() { return parseFloat(this.input.value); }
}

class Controller {
    constructor(labelEl, inputEl, valueSpan) {
        this._labelEl = labelEl;
        this._inputEl = inputEl;
        this._valueSpan = valueSpan;
        this._onChangeCb = null;
        this._onFinishChangeCb = null;
    }

    name(name) {
        this._labelEl.textContent = name;
        return this;
    }

    disable() {
        this._inputEl.disabled = true;
        return this;
    }

    onChange(fn) {
        this._onChangeCb = fn;
        return this;
    }

    onFinishChange(fn) {
        this._onFinishChangeCb = fn;
        return this;
    }

    setValue(val) {
        if (this._inputEl.type === 'checkbox') {
            this._inputEl.checked = val;
        } else if (this._inputEl.tagName.toLowerCase() === 'select') {
            this._inputEl.value = JSON.stringify(val);
        } else {
            this._inputEl.value = val;
        }
        if (this._valueSpan) {
            this._valueSpan.textContent = val;
        }
        return this;
    }
}

function createControl(parent, target, prop, args) {
    const wrapper = spawn('div', parent, {
        display: 'flex',
        alignItems: 'center',
        marginBottom: '4px',
    });

    const labelEl = spawn('label', wrapper, {
        flex: '1',
        marginRight: '6px',
    });

    let inputEl, valueSpan;
    const initial = target[prop];

    if (args.length === 0) {
        if (typeof initial === 'boolean') {
            inputEl = document.createElement('input');
            inputEl.type = 'checkbox';
            inputEl.checked = initial;
            wrapper.appendChild(inputEl);
        } else if (typeof initial === 'number') {
            inputEl = document.createElement('input');
            inputEl.type = 'number';
            inputEl.value = initial;
            wrapper.appendChild(inputEl);
        } else {
            inputEl = document.createElement('input');
            inputEl.type = 'text';
            inputEl.value = initial;
            wrapper.appendChild(inputEl);
        }
    } else if (args.length === 1 && typeof args[0] === 'object') {
        const mapping = args[0];
        inputEl = document.createElement('select');
        for (const [key, val] of Object.entries(mapping)) {
            const option = document.createElement('option');
            option.text = key;
            option.value = JSON.stringify(val);
            if (val === initial) option.selected = true;
            inputEl.appendChild(option);
        }
        wrapper.appendChild(inputEl);
    } else if (args.length >= 3 && typeof args[0] === 'number') {
        const [min, max, step] = args;
        inputEl = document.createElement('input');
        inputEl.type = 'range';
        inputEl.min = min;
        inputEl.max = max;
        inputEl.step = step;
        inputEl.value = initial;
        wrapper.appendChild(inputEl);

        valueSpan = document.createElement('span');
        valueSpan.style.marginLeft = '8px';
        valueSpan.textContent = initial;
        wrapper.appendChild(valueSpan);
    } else {
        inputEl = document.createElement('input');
        inputEl.type = 'text';
        inputEl.value = initial;
        wrapper.appendChild(inputEl);
    }

    const controller = new Controller(labelEl, inputEl, valueSpan);

    inputEl.addEventListener('input', () => {
        let val;
        if (inputEl.type === 'checkbox') {
            val = inputEl.checked;
        } else if (inputEl.tagName.toLowerCase() === 'select') {
            val = JSON.parse(inputEl.value);
        } else if (inputEl.type === 'range') {
            val = parseFloat(inputEl.value);
            if (valueSpan) valueSpan.textContent = val;
        } else if (inputEl.type === 'number') {
            val = parseFloat(inputEl.value);
        } else {
            val = inputEl.value;
        }
        target[prop] = val;
        if (controller._onChangeCb) controller._onChangeCb(val);
    });

    inputEl.addEventListener('change', () => {
        let val;
        if (inputEl.type === 'checkbox') {
            val = inputEl.checked;
        } else if (inputEl.tagName.toLowerCase() === 'select') {
            val = JSON.parse(inputEl.value);
        } else if (inputEl.type === 'range' || inputEl.type === 'number') {
            val = parseFloat(inputEl.value);
        } else {
            val = inputEl.value;
        }
        if (controller._onFinishChangeCb) controller._onFinishChangeCb(val);
    });

    return controller;
}
