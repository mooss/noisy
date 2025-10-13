import { clamp } from "../../maths/maths.js";
import { HtmlCssElement, spawn } from "../html.js";
import { Facet, Gardener } from "../style.js";

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

        const style = spawn('style', document.head);
        style.textContent = Gardener.rangeThumb;
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

const SelectControlBase = InputControlImpl<any, HTMLSelectElement>;

/** Select control constructed from an array. */
export class ArrayControl extends SelectControlBase {
    constructor(
        parent: HTMLElement, initial: any,
        options: Array<string>,
    ) {
        super('select', parent, Gardener.selectInput);

        for (const value of options) {
            const option = spawn<HTMLOptionElement>('option', this.elt);
            option.text = value;
            option.value = value;
            if (value === initial) option.selected = true;
        }

        selectMouseWheelSupport(this.elt); // Mouse-wheel scrolling support.
    }

    get value(): any { return this.elt.value }
    set value(value: any) { this.elt.value = value }
}


/** Select control constructed from a map. */
export class MapControl extends SelectControlBase {
    // Lookup from option values to option keys, the goal is to support values of any type.
    // Just storing the values themselves is not possible because the DOM expects a string, not any
    // type.
    // So when setting the value, this lookup is used to store the key instead and when getting the
    // value, a reverse lookup is performed to transform the key stored into its proper value.
    private lookup = new Map<any, string>();

    constructor(
        parent: HTMLElement, initial: any,
        private options: Record<string, any>,
    ) {
        super('select', parent, Gardener.selectInput);

        for (const [key, value] of Object.entries(options)) {
            const option = spawn<HTMLOptionElement>('option', this.elt);
            option.text = key;
            option.value = key;
            this.lookup.set(value, key);
            if (value === initial) option.selected = true;
        }

        selectMouseWheelSupport(this.elt); // Mouse-wheel scrolling support.
    }

    get value(): any { return this.options[this.elt.value] }
    set value(value: any) { this.elt.value = this.lookup.get(value) }
}

function selectMouseWheelSupport(elt: HtmlCssElement<HTMLSelectElement>) {
    elt.addEventListener('wheel', (event) => {
        event.preventDefault();
        const delta = event.deltaY > 0 ? 1 : -1;
        const newIndex = clamp(elt.selectedIndex + delta, 0, elt.options.length - 1);
        if (newIndex === elt.selectedIndex) return;
        elt.selectedIndex = newIndex;
        elt.dispatchEvent(new Event('input'));
        elt.dispatchEvent(new Event('change'));
    });
}
