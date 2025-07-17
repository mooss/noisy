import { Label } from "./foundations.js";
import { InputControl } from "./input-control.js";
import { spawn } from "./html.js";
import { Style } from "./style.js";

/**
 * A widget that composes a Label and an InputControl together in the DOM, orchestrating value
 * binding, event listening, and initial layout.
 */
export class ControlWidget<PRIM> {
    private label: Label;
    private onChangeCallback?: (value: PRIM) => void;
    private onInputCallback?: (value: PRIM) => void;

    /**
     * Creates a new ControlWidget instance.
     *
     * @param parent    - The parent DOM element.
     * @param target    - The target object to bind to.
     * @param property  - The property name to bind to.
     * @param labelText - The label text.
     * @param control   - The InputControl instance to use.
     */
    constructor(
        parent: HTMLElement,
        private target: Record<string, PRIM>,
        private property: string,
        private control: InputControl<PRIM>,
    ) {
        this.label = new Label(parent);

        const valueContainer = spawn('div', this.label.box, Style.paramValueContainer());
        valueContainer.appendChild(control.element);

        ////////////////////////////
        // Set up event listeners //
        control.element.addEventListener('input', () => {
            const value = this.update();
            this.onInputCallback?.(value);
        });

        control.element.addEventListener('change', () => {
            const value = this.update();
            this.onChangeCallback?.(value);
        });

        control.value = target[property]; // Initial value.
        this.update();
    }

    /**
     * Sets the label text.
     *
     * @param text - The new label text.
     * @returns this for chaining.
     */
    legend(text: string): this {
        this.label.legend(text);
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

    private update(): PRIM {
        const value = this.control.value;
        this.target[this.property] = value;
        this.control.update(value);
        return value;
    }
}
