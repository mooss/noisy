import { InputEditor } from "./editors.js";
import { Label } from "./foundations.js";
import { spawn } from "./html.js";
import { Gardener } from "./style.js";

/**
 * A widget that composes a Label and an InputControl together in the DOM, event listening, and
 * initial layout.
 */
export class Field<PRIM> {
    private labelElt: Label;
    private onChangeCallback?: (value: PRIM) => void;
    private onInputCallback?: (value: PRIM) => void;

    /**
     * Creates a new Field instance.
     *
     * @param parent  - The parent DOM element.
     * @param control - The InputControl instance to use.
     */
    constructor(
        parent: HTMLElement,
        protected control: InputEditor<PRIM>,
    ) {
        this.labelElt = new Label(parent);

        const valueContainer = spawn('div', this.labelElt.box, Gardener.paramValueContainer);
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

        this.update();
    }

    protected update(): PRIM {
        const value = this.control.value;
        this.control.update(value);
        return value;
    }

    get(): PRIM { return this.control.value }

    //////////////////////
    // Chaining methods //

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
}

/**
 * A Field with added persistence.
 */
export class DataField<PRIM> extends Field<PRIM> {

    /**
     * Creates a new DataField instance.
     *
     * @param parent   - The parent DOM element.
     * @param target   - The target object to bind to.
     * @param property - The property name to bind to.
     * @param control  - The InputControl instance to use.
     */
    constructor(
        parent: HTMLElement,
        private target: Record<string, PRIM>,
        private property: string,
        control: InputEditor<PRIM>,
    ) {
        super(parent, control);
    }

    protected update(): PRIM {
        const res = super.update();
        if (this.target && this.property)
            this.target[this.property] = res;
        return res;
    }
}
