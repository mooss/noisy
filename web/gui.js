class Panel {
    /**
     * The main container element for the GUI.
     * @type {HTMLDivElement}
     */
    _elt;

    /**
     * All folders contained in the GUI.
     * @type {Array<Folder>}
     */
    folders = [];

    constructor(parent) {
        this._elt = document.createElement('div');
        this.folders = [];
        parent.appendChild(this._elt);
    }


    /**
     * Adds a control to the GUI.
     *
     * The type of control created depends on the type of the property.
     *
     * @param {object} target - The object containing the property to control.
     * @param {string} prop   - The property to control.
     * @param {...*}   args   - Specification of the control (min, max, step, options).
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
}

export class GUI extends Panel {
    /**
     * Creates a GUI instance and adds it to the document body.
     */
    constructor() {
        super(document.body);
        Object.assign(this._elt.style, {
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

class Folder extends Panel {
    constructor(title, parent) {
        super(parent);
        this._title = title;

        this._details = document.createElement('details');
        this._details.open = true;
        Object.assign(this._details.style, {
            border: '1px solid #888',
            marginBottom: '5px',
            padding: '5px',
        });
        parent.appendChild(this._details);

        this._summary = document.createElement('summary');
        this._summary.textContent = title;
        this._summary.style.cursor = 'pointer';
        this._details.appendChild(this._summary);

        this._elt = document.createElement('div');
        this._elt.style.marginLeft = '10px';
        this._details.appendChild(this._elt);
    }

    show() {
        this._details.style.display = '';
    }

    hide() {
        this._details.style.display = 'none';
    }
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
    const wrapper = document.createElement('div');
    Object.assign(wrapper.style, {
        display: 'flex',
        alignItems: 'center',
        marginBottom: '4px',
    });
    parent.appendChild(wrapper);

    const labelEl = document.createElement('label');
    Object.assign(labelEl.style, {
        flex: '1',
        marginRight: '6px',
    });
    wrapper.appendChild(labelEl);

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
