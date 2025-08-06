import { BooleanEditor, NumberEditor, RangeEditor, SelectEditor } from './editors.js';
import { DataField } from './fields.js';
import { Label } from './foundations.js';
import { HtmlCssElement, spawn } from "./html.js";
import { BooleanSpec } from "./specs/specs.js";
import { Gardener } from './style.js';

export function BooleanWidget(
    parent: HTMLElement, target: Record<string, boolean>, property: string,
    spec: BooleanSpec,
): DataField<boolean> {
    const control = new BooleanEditor(parent, spec.params.default);
    control.element.addFacet(Gardener.checkbox);

    const style = spawn('style', document.head);
    style.textContent = Gardener.checkboxIndicator;

    return new DataField(parent, target, property, control);
}

export function NumberWidget(
    parent: HTMLElement, target: Record<string, number>, property: string,
): DataField<number> {
    const control = new NumberEditor(parent, target[property]);
    return new DataField(parent, target, property, control);
}

// A number control widget with a formatter field dictating how the number can be transformed for
// display purposes.
export type RangeControlWidget = DataField<number> & {
    formatter: (fun: (value: number) => number) => RangeControlWidget;
};

export function RangeWidget(
    parent: HTMLElement, target: Record<string, number>, property: string,
    min: number, max: number, step: number
): RangeControlWidget {
    const control = new RangeEditor(parent, target[property], min, max, step);
    const widget = new DataField(parent, target, property, control);

    const result = widget as RangeControlWidget;
    result.formatter = (fun: (value: number) => number) => {
        control.formatter = fun;
        return result;
    };

    return result;
}

export class StaticText extends Label {
    private value: HtmlCssElement;

    constructor(parent: HTMLElement, content: any) {
        super(parent);
        this.value = spawn('div', this.box, Gardener.paramValueContainer);
        this.update(content);
    }

    update(content: any) {
        this.value.textContent = String(content);
    }
}

export function StaticTextWidget(parent: HTMLElement, content: any): StaticText {
    return new StaticText(parent, content);
}

export function SelectWidget(
    parent: HTMLElement, target: Record<string, any>,
    property: string, options: Record<string, any>
): DataField<any> {
    const control = new SelectEditor(parent, target[property], options);
    return new DataField(parent, target, property, control);
}
