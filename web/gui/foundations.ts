import { HtmlCssElement, spawn } from "./html.js";
import { Style } from "./style.js";

export class Label {
    box: HtmlCssElement;
    label: HtmlCssElement;

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

export abstract class Param<ELT extends HTMLElement> extends Label {
    valueContainer: HtmlCssElement;
    input: HtmlCssElement<ELT>;

    constructor(parent: HTMLElement) {
        super(parent);
        this.valueContainer = spawn('div', this.box, Style.paramValueContainer());
        this.input = spawn<ELT>(this.tag(), this.valueContainer, Style.input());
    }

    // Returns the tag name for the input element.
    abstract tag(): string;
}

// Abstract base interactive parameter, all concrete interactive parameters must implement the setup
// and value methods.
export abstract class InteractiveParam<PRIM, ELT extends HTMLElement> extends Param<ELT> {
    // Function to format the raw value into what is to be displayed.
    #format: (value: PRIM) => any;
    // Optional callback for the change event.
    #onChange?: (value: PRIM) => void;
    // Optional callback for the input event.
    #onInput?: (value: PRIM) => void;

    // UI parameter attached to parent and tied to target.property.
    constructor(
        parent: HTMLElement,
        target: Record<string, PRIM>,
        property: string,
        ...args: any[]
    ) {
        super(parent);
        this.#format = (x) => x;

        this.input.addEventListener('input', () => {
            const value = this.value();
            target[property] = value;
            this.update?.(this.#format(value));
            this.#onInput?.(value);
        })
        this.input.addEventListener('change', () => this.#onChange?.(this.value()));
        this.setup(target[property], ...args);
        this.update?.(this.#format(this.value()));

        if (this.scroll !== undefined) { // Parameter with mouse scroll support.
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
    setInput(fields: Record<string, unknown>): void { Object.assign(this.input, fields) }

    //////////////////////////
    // Overrideable methods //
    // The methods below define behaviors that are shared by some parameter types, but still need to
    // be redefined by others.

    // Initialisation of the parameter given the initial value, must be defined in the concrete
    // subclass.
    abstract setup(...args: any[]): void;

    // Returns the current value of the parameter in the UI, must be defined in the concrete
    // subclass.
    abstract value(): PRIM;

    // Respond to a scroll event.
    scroll?(up :boolean): void;

    // Update the UI given the new value.
    update?(value: any): void;

    //////////////////////////////////
    // Chainable definition methods //

    // Registers a listener for the change event.
    onChange(fun: (value: PRIM) => void): this { this.#onChange = fun; return this; }

    // Registers a listener for the input event.
    onInput(fun: (value: PRIM) => void): this { this.#onInput = fun; return this; }

    // Sets the function that will format the raw value into the displayed value.
    formatter(fun: (value: PRIM) => any): this {
        this.#format = fun;
        this.update?.(fun(this.value()));
        return this;
    }
}

export abstract class InputParam<PRIM> extends InteractiveParam<PRIM, HTMLInputElement> {
    tag(): string { return 'input' }
}
