import { Label } from "../foundations.js";
import { spawn } from "../html.js";
import { Blawhi } from "../style.js";
import { InputControl } from "./input-control.js";

/**
 * A widget that composes a Label and an InputControl together in the DOM, orchestrating value
 * binding, event listening, and initial layout.
 */
export class ControlWidget<PRIM> {
    private labelElt: Label;
    private onChangeCallback?: (value: PRIM) => void;
    private onInputCallback?: (value: PRIM) => void;

    /**
     * Creates a new ControlWidget instance.
     *
     * @param parent    - The parent DOM element.
     * @param target    - The target object to bind to.
     * @param property  - The property name to bind to.
     * @param control   - The InputControl instance to use.
     */
    constructor(
        parent: HTMLElement,
        private target: Record<string, PRIM>,
        private property: string,
        private control: InputControl<PRIM>,
    ) {
        this.labelElt = new Label(parent);

        const valueContainer = spawn('div', this.labelElt.box, Blawhi.paramValueContainer);
        valueContainer.appendChild(control.element);

        // Make the target property reactive: any assignment to it will update the control, not just
        // assignments made through the UI.
        let value = target[property];
        control.value = value;
        Object.defineProperty(target, property, {
            get: () => value,
            set: (newValue) => {
                if (newValue === value) return;
                value = newValue;
                control.value = newValue;
                control.update(newValue);
            },
            enumerable: true,
            configurable: true,
        });

        // Set up event listeners.
        control.element.addEventListener('input', () => {
            const value = this.update();
            this.onInputCallback?.(value);
        });
        control.element.addEventListener('change', () => {
            const value = this.update();
            this.onChangeCallback?.(value);
        });

        control.update(control.value); // Sets the initial value in the interface.
    }

    /**
     * Sets the label text.
     *
     * @param text - The new label text.
     * @returns this for chaining.
     */
    label(text: string): this {
        this.labelElt.label(text);
        return this;
    }

    /** Displays a tooltip when hovering over the label. */
    tooltip(text: string): this {
        this.labelElt.tooltip(text);
        return this;
    }

    /**
     * Registers a callback for change events.
     *
     * @param callback - Function to call when the value changes.
     * @returns this for chaining.
     */
    onChange(callback: (value: PRIM) => void): this {
        this.onChangeCallback = callback;
        return this;
    }

    /**
     * Registers a callback for input events.
     *
     * @param callback - Function to call when the value changes during input.
     * @returns this for chaining.
     */
    onInput(callback: (value: PRIM) => void): this {
        this.onInputCallback = callback;
        return this;
    }

    /**
     * Reads the current value from the control and writes it to the target property.
     * This is called automatically on user input.
     * @returns the new value.
     */
    private update(): PRIM {
        const value = this.control.value;
        this.target[this.property] = value;
        return value;
    }
}
