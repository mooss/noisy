import { spawn, colors } from "./html.js";

export class Label {
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
    }

    // Sets the text content of the label.
    legend(name) { this.label.textContent = name; return this; }
}

export class Param extends Label {
    constructor(parent) {
        super(parent);
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

    // Returns the tag name for the input element.
    tag() { return 'input'; }
}

// Abstract base input parameter, all concrete input parameters must implement the setup and value
// methods.
export class InputParam extends Param {
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
