import { Label } from "../foundations.js";
import { HtmlCssElement, spawn } from "../html.js";
import { Blawhi } from "../style.js";
import { ControlWidget } from "./control-widget.js";
import { ArrayControl, BooleanControl, MapControl, NumberControl, RangeControl } from "./input-control.js";

export function BooleanWidget(
    parent: HTMLElement, target: Record<string, boolean>, property: string,
): ControlWidget<boolean> {
    const control = new BooleanControl(parent, target[property]);

    const checkbox = control.element;
    checkbox.addFacet(Blawhi.checkbox);
    const style = spawn('style', document.head);
    style.textContent = Blawhi.checkboxIndicator;

    return new ControlWidget(parent, target, property, control);
}

export function NumberWidget(
    parent: HTMLElement, target: Record<string, number>, property: string,
): ControlWidget<number> {
    const control = new NumberControl(parent, target[property]);
    return new ControlWidget(parent, target, property, control);
}

// A number control widget with a formatter field dictating how the number can be transformed for
// display purposes.
export type RangeControlWidget = ControlWidget<number> & {
    formatter: (fun: (value: number) => number) => RangeControlWidget;
};

export function RangeWidget(
    parent: HTMLElement, target: Record<string, number>, property: string,
    min: number, max: number, step: number
): RangeControlWidget {
    const control = new RangeControl(parent, target[property], min, max, step);
    const widget = new ControlWidget(parent, target, property, control);

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
        this.value = spawn('div', this.box, Blawhi.paramValueContainer);
        this.update(content);
    }

    update(content: any) {
        this.value.textContent = String(content);
    }

    // Displays a tooltip when hovering over the text.
    tooltip(text: string): this {
        super.tooltip(text);
        return this;
    }
}

export function StaticTextWidget(parent: HTMLElement, content: any): StaticText {
    return new StaticText(parent, content);
}

export function MapWidget(
    parent: HTMLElement, target: Record<string, any>, property: string,
    options: Record<string, any>,
): ControlWidget<any> {
    const control = new MapControl(parent, target[property], options);
    return new ControlWidget(parent, target, property, control);
}

export function ArrayWidget(
    parent: HTMLElement, target: Record<string, any>, property: string,
    options: Array<string>,
): ControlWidget<any> {
    const control = new ArrayControl(parent, target[property], options);
    return new ControlWidget(parent, target, property, control);
}
