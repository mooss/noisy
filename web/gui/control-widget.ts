import { Label } from "./foundations.js";
import { InputControl } from "./input-control.js";
import { spawn } from "./html.js";
import { Style } from "./style.js";

//TODO: align params in doc.
//TODO: finish all comments with a dot.

/**
 * A widget that composes a Label and an InputControl together in the DOM,
 * orchestrating value binding, event listening, and initial layout.
 */
export class ControlWidget<T> {
    private label: Label;
    private control: InputControl<T>;
    private target: Record<string, T>;
    private property: string;
    private onChangeCallback?: (value: T) => void;
    private onInputCallback?: (value: T) => void;

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
        target: Record<string, T>,
        property: string,
        labelText: string,
        control: InputControl<T>
    ) {
        this.target = target;
        this.property = property;
        this.label = new Label(parent);
        this.label.legend(labelText);
        this.control = control;

        const valueContainer = spawn('div', this.label.box, Style.paramValueContainer());
        valueContainer.appendChild(control.getElement());

        ////////////////////////////
        // Set up event listeners //
        const element = control.getElement();

        element.addEventListener('input', () => {
            const value = control.value();
            this.target[this.property] = value;
            this.onInputCallback?.(value);
        });

        element.addEventListener('change', () => {
            const value = control.value();
            this.target[this.property] = value;
            this.onChangeCallback?.(value);
        });

        control.setValue(target[property]); // Initial value.
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
    onChange(callback: (value: T) => void): this {
        this.onChangeCallback = callback;
        return this;
    }

    /**
     * Registers a callback for input events.
     * @param callback Function to call when the value changes during input
     * @returns this for chaining
     */
    onInput(callback: (value: T) => void): this {
        this.onInputCallback = callback;
        return this;
    }

    /**
     * Gets the current value.
     * @returns The current value
     */
    value(): T {
        return this.control.value();
    }

    /**
     * Sets the value.
     * @param value The new value
     * @returns this for chaining
     */
    setValue(value: T): this {
        this.control.setValue(value);
        this.target[this.property] = value;
        return this;
    }

    /**
     * Gets the underlying input control.
     * @returns The InputControl instance
     */
    getControl(): InputControl<T> {
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
