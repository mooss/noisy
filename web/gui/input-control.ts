import { HtmlCssElement, spawn } from "./html.js";
import { Style } from "./style.js";

export interface InputControl<PRIM> {
    getElement(): HTMLElement;
    value(): PRIM;
    setValue(value: PRIM): void;
}

/**
 * Base interface for input controls that encapsulate only an HTML input element
 * and standard value get/set methods, without labels or data binding.
 */
abstract class InputControlImpl<PRIM, ELT extends HTMLElement> {
    protected elt: HtmlCssElement<ELT>;
    get element(): HtmlCssElement<ELT> { return this.elt }

    constructor(tag: string, parent: HTMLElement, style: Record<string, string | number>) {
        this.elt = spawn<ELT>(tag, parent, style);
    }

    /**
     * Gets the underlying HTML element for this control.
     */
    getElement(): HTMLElement {
        return this.elt;
    }

    /**
     * Gets the current value of the control.
     */
    abstract value(): PRIM;

    /**
     * Sets the value of the control.
     */
    abstract setValue(value: PRIM): void;
}

/**
 * Boolean checkbox control.
 */
export class BooleanControl extends InputControlImpl<boolean, HTMLInputElement> {
    constructor(parent: HTMLElement, initial: boolean = false) {
        super('input', parent, Style.checkbox());
        this.elt.type = 'checkbox';
        this.elt.checked = initial;
    }

    value(): boolean { return this.elt.checked }

    setValue(value: boolean): void {
        this.elt.checked = value;
    }
}

/**
 * Number input control.
 */
export class NumberControl extends InputControlImpl<number, HTMLInputElement> {
    constructor(parent: HTMLElement, initial: number = 0) {
        super('input', parent, Style.numberInput());
        this.elt.type = 'number';
        this.elt.value = String(initial);
        this.elt.addEventListener('wheel', (event) => {
            event.preventDefault();
            const delta = event.deltaY > 0 ? -1 : 1;
            const newValue = parseFloat(this.elt.value) + delta;
            this.elt.value = String(newValue);
            this.elt.dispatchEvent(new Event('change'));
        });
    }

    value(): number {
        return parseFloat(this.elt.value);
    }

    setValue(value: number): void {
        this.elt.value = String(value);
    }
}

/**
 * Range slider control.
 */
export class RangeControl extends InputControlImpl<number, HTMLInputElement> {
    constructor(parent: HTMLElement, initial: number, min: number, max: number, step: number) {
        super('input', parent, Style.rangeInput());
        this.elt.type = 'range';
        this.elt.min = String(min);
        this.elt.max = String(max);
        this.elt.step = String(step);
        this.elt.value = String(initial);
    }

    value(): number {
        return parseFloat(this.elt.value);
    }

    setValue(value: number): void {
        this.elt.value = String(value);
    }
}

/**
 * Select dropdown control.
 */
export class SelectControl extends InputControlImpl<any, HTMLSelectElement> {
    private dictmode: boolean = false;

    constructor(parent: HTMLElement, initial: any, options: Record<string, any>) {
        super('select', parent, Style.selectInput());

        const isKeyBased = Object.prototype.hasOwnProperty.call(options, initial);
        if (isKeyBased) {
            this.dictmode = true;
            for (const key of Object.keys(options)) {
                const option = spawn<HTMLOptionElement>('option', this.elt);
                option.text = key;
                option.value = key;
                if (key === initial) option.selected = true;
            }
        } else {
            this.dictmode = false;
            for (const [key, value] of Object.entries(options)) {
                const option = spawn<HTMLOptionElement>('option', this.elt);
                option.text = key;
                option.value = JSON.stringify(value);
                if (value === initial) option.selected = true;
            }
        }
    }

    value(): any {
        if (this.dictmode) {
            return this.elt.value;
        }
        return JSON.parse(this.elt.value);
    }

    setValue(value: any): void {
        if (this.dictmode) {
            this.elt.value = value;
        } else {
            // For non-dict mode, we need to find the option with matching value.
            for (let i = 0; i < this.elt.options.length; i++) {
                const option = this.elt.options[i];
                if (JSON.parse(option.value) === value) {
                    this.elt.selectedIndex = i;
                    break;
                }
            }
        }
    }
}
