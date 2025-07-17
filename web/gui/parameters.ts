import { clamp } from '../utils.js';
import { ControlWidget } from "./control-widget.js";
import { InteractiveParam, Label, Param } from './foundations.js';
import { colors, HtmlCssElement, spawn } from "./html.js";
import { BooleanControl, NumberControl, RangeControl } from "./input-control.js";
import { Style } from './style.js';

export function BooleanWidget(
    parent: HTMLElement, target: Record<string, boolean>,
    property: string, label: string,
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

    return new ControlWidget(parent, target, property, label, control);
}

export function NumberWidget(
    parent: HTMLElement, target: Record<string, number>,
    property: string, label: string,
): ControlWidget<number> {
    const control = new NumberControl(parent, target[property]);
    return new ControlWidget(parent, target, property, label, control);
}

// A number control widget with a formatter field dictating how the number can be transformed for
// display purposes.
export type RangeControlWidget = ControlWidget<number> & {
    formatter: (fun: (value: number) => number) => RangeControlWidget;
};

export function RangeWidget(
    parent: HTMLElement, target: Record<string, number>,
    property: string, label: string,
    min: number, max: number, step: number
): RangeControlWidget {
    const control = new RangeControl(parent, target[property], min, max, step);
    const widget = new ControlWidget(parent, target, property, label, control);

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

export class Select extends InteractiveParam<any, HTMLSelectElement> {
    scroll(up: boolean) {
        let delta = 1;
        if (up) delta = -delta;
        this.input.selectedIndex = clamp(
            this.input.selectedIndex + delta,
            0, this.input.options.length - 1,
        );
    }

    setup(initial, options) {
        this.input.css({
            width: '100%',
            background: colors.inputBg,
            border: `1px solid ${colors.input}`,
            height: '16px',
            paddingLeft: '2px',
            boxSizing: 'border-box',
        });

        const isKeyBased = Object.prototype.hasOwnProperty.call(options, initial);
        if (isKeyBased) {
            this._dictMode = true; // Can't be private because of JS schenanigans.
            for (const key of Object.keys(options)) {
                const option = spawn('option', this.input);
                option.text = key;
                option.value = key;
                if (key === initial) option.selected = true;
            }
        } else {
            this._dictMode = false;
            for (const [key, value] of Object.entries(options)) {
                const option = spawn('option', this.input);
                option.text = key;
                option.value = JSON.stringify(value);
                if (value === initial) option.selected = true;
            }
        }
    }

    tag() { return 'select'; }

    value() {
        if (this._dictMode) {
            return this.input.value;
        }
        return JSON.parse(this.input.value);
    }
}
