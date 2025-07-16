import { Label } from "./foundations.js";
import { InputControl } from "./input-control.js";
import { spawn } from "./html.js";
import { Style } from "./style.js";

//TODO: align params in doc.
//TODO: finish all comments with a dot.

/**
 * A widget that composes a Label and an InputControl together in the DOM, orchestrating value
 * binding, event listening, and initial layout.
 */
export class ControlWidget<PRIM> {
    private label: Label;
    private control: InputControl<PRIM>;
    private target: Record<string, PRIM>;
    private property: string;
    private onChangeCallback?: (value: PRIM) => void;
    private onInputCallback?: (value: PRIM) => void;

    /**
     * Creates a new ControlWidget instance.
     * @param parent The parent DOM element
     * @param target The target object to bind to
     * @param property The property name to bind to
     * @param labelText The label text
     * @param control The InputControl instance to use
     */
    constructor(
        parent: HTMLElement,
        target: Record<string, PRIM>,
        property: string,
        labelText: string,
        control: InputControl<PRIM>,
    ) {
        this.target = target;
        this.property = property;
        this.label = new Label(parent);
        this.label.legend(labelText);
        this.control = control;

        const valueContainer = spawn('div', this.label.box, Style.paramValueContainer());
        valueContainer.appendChild(control.element);

        ////////////////////////////
        // Set up event listeners //
        control.element.addEventListener('input', () => {
            const value = control.value;
            this.target[this.property] = value;
            this.onInputCallback?.(value);
        });

        control.element.addEventListener('change', () => {
            const value = control.value;
            this.target[this.property] = value;
            this.onChangeCallback?.(value);
        });

        control.value = target[property]; // Initial value.
    }

    /**
     * Sets the label text.
     * @param text The new label text
     * @returns this for chaining
     */
    legend(text: string): this {
        this.label.legend(text);
        return this;
    }

    /**
     * Registers a callback for change events.
     * @param callback Function to call when the value changes
     * @returns this for chaining
     */
    onChange(callback: (value: PRIM) => void): this {
        this.onChangeCallback = callback;
        return this;
    }

    /**
     * Registers a callback for input events.
     * @param callback Function to call when the value changes during input
     * @returns this for chaining
     */
    onInput(callback: (value: PRIM) => void): this {
        this.onInputCallback = callback;
        return this;
    }

    /**
     * Gets the current value.
     * @returns The current value
     */
    value(): PRIM {
        return this.control.value;
    }

    /**
     * Sets the value.
     * @param value The new value
     * @returns this for chaining
     */
    setValue(value: PRIM): this {
        this.control.value = value;
        this.target[this.property] = value;
        return this;
    }

    /**
     * Gets the underlying input control.
     * @returns The InputControl instance
     */
    getControl(): InputControl<PRIM> {
        return this.control;
    }

    /**
     * Gets the underlying label.
     * @returns The Label instance
     */
    getLabel(): Label {
        return this.label;
    }
}
