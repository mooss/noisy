import { clamp } from "../utils/maths.js";
import { HtmlCssElement, spawn } from "./html.js";
import { Facet, Gardener } from "./style.js";

/**
 * Interface required from graphical input controllers.
 */
export interface InputControl<PRIM> {
    /** Underlying HTML element for this control. */
    readonly element: HTMLElement;

    /** Current value of the control. */
    value: PRIM;

    /** Notify the control that a change of value occured. */
    update(value: PRIM): void;
}

/**
 * Base implementation for graphical input controls that stores an input element and requires its
 * concrete implementation to provide a value property in order to satisfy the InputControl<PRIM>
 * interface.
 */
abstract class InputControlImpl<PRIM, ELT extends HTMLElement> {
    protected elt: HtmlCssElement<ELT>;
    get element(): HtmlCssElement<ELT> { return this.elt }

    constructor(tag: string, parent: HTMLElement, style: Facet) {
        this.elt = spawn<ELT>(tag, parent, style);
    }

    abstract value: PRIM;
    update(_: PRIM): void { }
}

/**
 * Boolean checkbox control.
 */
export class BooleanControl extends InputControlImpl<boolean, HTMLInputElement> {
    constructor(parent: HTMLElement, initial: boolean = false) {
        super('input', parent, Gardener.checkbox);
        this.elt.type = 'checkbox';
        this.elt.checked = initial;
    }

    get value(): boolean { return this.elt.checked }
    set value(value: boolean) { this.elt.checked = value }
}

/**
 * Number input control.
 */
export class NumberControl extends InputControlImpl<number, HTMLInputElement> {
    constructor(parent: HTMLElement, initial: number = 0) {
        super('input', parent, Gardener.numberInput);
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

    get value(): number { return parseFloat(this.elt.value) }
    set value(value: number) { this.elt.value = String(value) }
}

/**
 * Range slider control.
 */
export class RangeControl extends InputControlImpl<number, HTMLDivElement> {
    private slider: HtmlCssElement<HTMLInputElement>;
    private valueSpan: HtmlCssElement<HTMLSpanElement>;
    private format: (v: number) => number = (v) => v;

    constructor(parent: HTMLElement, initial: number, min: number, max: number, step: number) {
        super('div', parent, Gardener.rangeControlContainer);

        this.slider = spawn<HTMLInputElement>('input', this.elt, Gardener.rangeInput);
        this.slider.type = 'range';
        this.slider.min = String(min);
        this.slider.max = String(max);
        this.slider.step = String(step);
        this.slider.value = String(initial);

        this.valueSpan = spawn('span', this.elt, Gardener.rangeValueSpan);

        this.slider.addEventListener('wheel', (event) => {
            event.preventDefault();
            const stepValue = parseFloat(this.slider.step) || 1;
            const delta = event.deltaY > 0 ? -stepValue : stepValue;
            const newValue = clamp(
                this.value + delta,
                parseFloat(this.slider.min),
                parseFloat(this.slider.max)
            );
            if (newValue === this.value) return;
            this.value = newValue;
            this.elt.dispatchEvent(new Event('input'));
            this.elt.dispatchEvent(new Event('change'));
        });

        // Style the slider thumb as a vertical bar.
        const style = spawn('style', document.head);
        style.textContent = `
            input[type="range"]::-webkit-slider-thumb {
                appearance: none;
                width: 4px;
                height: 16px;
                background: ${Gardener.colors.input};
                cursor: pointer;
            }
            input[type="range"]::-moz-range-thumb {
                width: 3px;
                height: 16px;
                background: ${Gardener.colors.input};
                cursor: pointer;
                border: none;
                border-radius: 0;
            }
        `;
    }

    get value(): number { return parseFloat(this.slider.value) }
    set value(value: number) { this.slider.value = String(value) }

    update(value: number): void {
        this.valueSpan.textContent = String(this.format(value));
    }

    set formatter(fun: (v: number) => number) {
        this.format = fun;
        this.update(this.value);
    }
}

/**
 * Select dropdown control.
 */
export class SelectControl extends InputControlImpl<any, HTMLSelectElement> {
    private dictmode: boolean = false;

    constructor(parent: HTMLElement, initial: any, options: Record<string, any>) {
        super('select', parent, Gardener.selectInput);

        this.dictmode = Object.prototype.hasOwnProperty.call(options, initial);
        if (this.dictmode) {
            for (const key of Object.keys(options)) {
                const option = spawn<HTMLOptionElement>('option', this.elt);
                option.text = key;
                option.value = key;
                if (key === initial) option.selected = true;
            }
        } else {
            for (const [key, value] of Object.entries(options)) {
                const option = spawn<HTMLOptionElement>('option', this.elt);
                option.text = key;
                option.value = JSON.stringify(value);
                if (value === initial) option.selected = true;
            }
        }

        // Mouse-wheel scrolling support.
        this.elt.addEventListener('wheel', (event) => {
            event.preventDefault();
            const delta = event.deltaY > 0 ? 1 : -1;
            const newIndex = clamp(
                this.elt.selectedIndex + delta,
                0,
                this.elt.options.length - 1
            );
            if (newIndex === this.elt.selectedIndex) return;
            this.elt.selectedIndex = newIndex;
            this.elt.dispatchEvent(new Event('input'));
            this.elt.dispatchEvent(new Event('change'));
        });
    }

    get value(): any {
        if (this.dictmode) {
            return this.elt.value;
        }
        return JSON.parse(this.elt.value);
    }

    set value(value: any) {
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
