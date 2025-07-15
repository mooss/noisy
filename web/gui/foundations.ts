import { spawn } from "./html";
import { Style } from "./style";

export class Label {
    box: HTMLElement;
    label: HTMLLabelElement;

    constructor(parent: HTMLElement) {
        // Setup UI elements.
        this.box = spawn('div', parent, Style.label());
        this.label = spawn('label', this.box, Style.labelText());
    }

    // Sets the text content of the label.
    legend(name: string): this {
        this.label.textContent = name;
        return this;
    }
}

export class Param extends Label {
    valueContainer: HTMLElement;
    input: HTMLElement;

    constructor(parent: HTMLElement) {
        super(parent);
        this.valueContainer = spawn('div', this.box, Style.paramValueContainer());
        this.input = spawn(this.tag(), this.valueContainer, Style.input());
    }

    // Returns the tag name for the input element.
    tag(): string { return 'input'; }
}

// Abstract base input parameter, all concrete input parameters must implement the setup and value
// methods.
export class InputParam<T = any> extends Param {
    // Function to format the raw value into what is to be displayed.
    #format: (value: T) => any;
    // Optional callback for the change event.
    #onChange?: (value: T) => void;
    // Optional callback for the input event.
    #onInput?: (value: T) => void;

    // UI parameter attached to parent and tied to target.property.
    constructor(
        parent: HTMLElement,
        target: Record<string, T>,
        property: string,
        ...args: any[]
    ) {
        super(parent);
        this.#format = (x) => x;

        this.input.addEventListener('input', () => {
            const value = this.value();
            target[property] = value;
            this.update(this.#format(value));
            this.#onInput?.(value);
        })
        this.input.addEventListener('change', () => this.#onChange?.(this.value()));
        this.setup(target[property], ...args);
        this.update(this.#format(this.value()));

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

    // Makes the input read-only.
    readOnly() { this.input.disabled = true; return this; }

    // Registers a listener for the change event.
    onChange(fun) { this.#onChange = fun; return this; }

    // Registers a listener for the input event.
    onInput(fun) { this.#onInput = fun; return this; }

    // Sets the function that will format the raw value into the displayed value.
    formatter(fun) {
        this.#format = fun;
        this.update(fun(this.value()));
        return this;
    }

}
