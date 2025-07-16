import { spawn } from "./html.js";
import { Style } from "./style.js";

/**
 * Base interface for input controls that encapsulate only an HTML input element
 * and standard value get/set methods, without labels or data binding.
 */
export abstract class InputControl<T> {
    protected element: HTMLElement;

    /**
     * Gets the underlying HTML element for this control.
     */
    getElement(): HTMLElement {
        return this.element;
    }

    /**
     * Gets the current value of the control.
     */
    abstract value(): T;

    /**
     * Sets the value of the control.
     */
    abstract setValue(value: T): void;
}

/**
 * Boolean checkbox control.
 */
export class BooleanControl extends InputControl<boolean> {
    private input: HTMLInputElement;

    constructor(parent: HTMLElement, initial: boolean = false) {
        super();
        this.input = spawn('input', parent, Style.checkbox()) as HTMLInputElement;
        this.input.type = 'checkbox';
        this.input.checked = initial;
        this.element = this.input;
    }

    value(): boolean {
        return this.input.checked;
    }

    setValue(value: boolean): void {
        this.input.checked = value;
    }
}

/**
 * Number input control.
 */
export class NumberControl extends InputControl<number> {
    private input: HTMLInputElement;

    constructor(parent: HTMLElement, initial: number = 0) {
        super();
        this.input = spawn('input', parent, Style.numberInput()) as HTMLInputElement;
        this.input.type = 'number';
        this.input.value = String(initial);
        this.element = this.input;

        this.input.addEventListener('wheel', (event) => {
            event.preventDefault();
            const delta = event.deltaY > 0 ? -1 : 1;
            const newValue = parseFloat(this.input.value) + delta;
            this.input.value = String(newValue);
            this.input.dispatchEvent(new Event('change'));
        });
    }

    value(): number {
        return parseFloat(this.input.value);
    }

    setValue(value: number): void {
        this.input.value = String(value);
    }
}

/**
 * Range slider control.
 */
export class RangeControl extends InputControl<number> {
    private input: HTMLInputElement;

    constructor(parent: HTMLElement, initial: number, min: number, max: number, step: number) {
        super();
        this.input = spawn('input', parent, Style.rangeInput()) as HTMLInputElement;
        this.input.type = 'range';
        this.input.min = String(min);
        this.input.max = String(max);
        this.input.step = String(step);
        this.input.value = String(initial);
        this.element = this.input;
    }

    value(): number {
        return parseFloat(this.input.value);
    }

    setValue(value: number): void {
        this.input.value = String(value);
    }
}

/**
 * Select dropdown control.
 */
export class SelectControl extends InputControl<any> {
    private input: HTMLSelectElement;
    private dictmode: boolean = false;

    constructor(parent: HTMLElement, initial: any, options: Record<string, any>) {
        super();
        this.input = spawn<HTMLSelectElement>('select', parent, Style.selectInput());

        const isKeyBased = Object.prototype.hasOwnProperty.call(options, initial);
        if (isKeyBased) {
            this.dictmode = true;
            for (const key of Object.keys(options)) {
                const option = spawn<HTMLOptionElement>('option', this.input);
                option.text = key;
                option.value = key;
                if (key === initial) option.selected = true;
            }
        } else {
            this.dictmode = false;
            for (const [key, value] of Object.entries(options)) {
                const option = spawn<HTMLOptionElement>('option', this.input);
                option.text = key;
                option.value = JSON.stringify(value);
                if (value === initial) option.selected = true;
            }
        }

        this.element = this.input;
    }

    value(): any {
        if (this.dictmode) {
            return this.input.value;
        }
        return JSON.parse(this.input.value);
    }

    setValue(value: any): void {
        if (this.dictmode) {
            this.input.value = value;
        } else {
            // For non-dict mode, we need to find the option with matching value.
            for (let i = 0; i < this.input.options.length; i++) {
                const option = this.input.options[i];
                if (JSON.parse(option.value) === value) {
                    this.input.selectedIndex = i;
                    break;
                }
            }
        }
    }
}
