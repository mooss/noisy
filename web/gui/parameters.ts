import { clamp } from '../utils.js';
import { ControlWidget } from "./control-widget.js";
import { InputParam, InteractiveParam, Param } from './foundations.js';
import { colors, spawn } from "./html.js";
import { BooleanControl, NumberControl } from "./input-control.js";

export function BooleanWidget(
    parent: HTMLElement, target: Record<string, boolean>,
    property: string, label: string,
): ControlWidget<boolean> {
    const control = new BooleanControl(parent, target[property]);

    const checkbox = control.getElement() as HTMLInputElement;
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

export class Range extends InputParam<number> {
    scroll(up: boolean) {
        let delta = -parseFloat(this.input.step);
        if (up) delta = -delta;
        this.input.value = String(clamp(
            this.value() + delta,
            parseFloat(this.input.min), parseFloat(this.input.max),
        ));
    }

    setup(initial: number, min: number, max: number, step: number) {
        this.input.css({
            width: '100%',
            height: '16px',
            appearance: 'none',
            background: colors.inputBg,
            outline: 'none',
            cursor: 'pointer',
            padding: '0',
            margin: '0',
        });
        this.setInput({
            type: 'range',
            min: min,
            max: max,
            step: step,
            value: initial,
        })
        this.valueSpan = spawn('span', this.valueContainer, {
            width: '40px',
            marginLeft: '5px',
        });

        // Style the slider thumb as a vertical bar.
        const style = spawn('style', document.head);
        style.textContent = `
            input[type="range"]::-webkit-slider-thumb {
                appearance: none;
                width: 4px;
                height: 16px;
                background: ${colors.input};
                cursor: pointer;
            }
            input[type="range"]::-moz-range-thumb {
                width: 3px;
                height: 16px;
                background: ${colors.input};
                cursor: pointer;
                border: none;
                border-radius: 0;
            }
        `;
    }

    update(value: number) { this.valueSpan.textContent = String(value) }
    value() { return parseFloat(this.input.value); }
}

export class ReadOnly extends Param<HTMLLabelElement> {
    constructor(parent: HTMLElement, content: any) {
        super(parent);
        this.update(content);
    }

    tag() { return 'label' }

    update(content: any) {
        this.input.textContent = String(content);
    }
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
