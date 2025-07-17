import { ControlWidget } from "./control-widget.js";
import { Label } from './foundations.js';
import { colors, HtmlCssElement, spawn } from "./html.js";
import { BooleanControl, NumberControl, RangeControl, SelectControl } from "./input-control.js";
import { Style } from './style.js';

export function BooleanWidget(
    parent: HTMLElement, target: Record<string, boolean>, property: string,
): ControlWidget<boolean> {
    const control = new BooleanControl(parent, target[property]);

    const checkbox = control.element;
    checkbox.style.margin = '0';
    checkbox.style.appearance = 'none';
    checkbox.style.width = '14px';
    checkbox.style.height = '14px';
    checkbox.style.backgroundColor = colors.inputBg;
    checkbox.style.border = `1px solid ${colors.input}`;
    checkbox.style.position = 'relative';
    checkbox.style.cursor = 'pointer';

    const style = spawn('style', document.head);
    style.textContent = `
        input[type="checkbox"]:checked::before {
            content: '';
            position: absolute;
            left: 4px;
            top: 1px;
            width: 4px;
            height: 7px;
            border: solid ${colors.param};
            border-width: 0 2px 2px 0;
            transform: rotate(45deg);
        }
    `;

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

export class ReadOnly extends Label {
    private value: HtmlCssElement;

    constructor(parent: HTMLElement, content: any) {
        super(parent);
        this.value = spawn('div', this.box, Style.paramValueContainer());
        this.update(content);
    }

    update(content: any) {
        this.value.textContent = String(content);
    }
}

export function ReadOnlyWidget(parent: HTMLElement, content: any): ReadOnly {
    return new ReadOnly(parent, content);
}

/**
 * Factory that creates a ControlWidget wrapping a SelectControl.
 * Replaces the former Select class.
 */
export function SelectWidget(
    parent: HTMLElement, target: Record<string, any>,
    property: string, options: Record<string, any>
): ControlWidget<any> {
    const control = new SelectControl(parent, target[property], options);
    return new ControlWidget(parent, target, property, control);
}
