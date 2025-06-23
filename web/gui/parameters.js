import { Param, InputParam } from './foundations.js'
import { spawn, colors } from "./html.js";
import { clamp } from '../utils.js'

export class Boolean extends InputParam {
    setup(initial) {
        this.input.css({
            margin: 0,
            width: 'auto',
            // Add custom styling:
            appearance: 'none',
            WebkitAppearance: 'none',
            width: '14px',
            height: '14px',
            backgroundColor: colors.inputBg,
            border: `1px solid ${colors.input}`,
            position: 'relative',
            cursor: 'pointer',
        });

        // Add checkmark styling using ::before pseudo-element
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

        this.setInput({type: 'checkbox', checked: initial});
    }
    value() { return this.input.checked; }
}

export class Number extends InputParam {
    scroll(up) {
        let delta = -1;
        if (up) delta = -delta;
        this.input.value = this.value() + delta;
    }

    setup(initial) {
        this.input.css({
            width: '100%',
            background: 'rgba(45, 55, 72, 0.8)',
            border: `1px solid ${colors.input}`,
            paddingLeft: '2px',
        });
        this.setInput({type: 'number', value: initial});
    }

    value() { return parseFloat(this.input.value); }
}

export class Range extends InputParam {
    scroll(up) {
        let delta = parseFloat(-this.input.step);
        if (up) delta = -delta;
        this.input.value = clamp(
            this.value() + delta,
            parseFloat(this.input.min), parseFloat(this.input.max),
        );
    }

    setup(initial, min, max, step) {
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

    update(value) { this.valueSpan.textContent = value; }
    value() { return parseFloat(this.input.value); }
}

export class ReadOnly extends Param {
    constructor(parent, content) {
        super(parent);
        this.update(content);
    }

    tag() { return 'label'; }

    update(content) {
        this.input.textContent = content;
    }
}

export class Select extends InputParam {
    scroll(up) {
        let delta = 1;
        if (up) delta = -1;
        this.input.selectedIndex = clamp(
            this.input.selectedIndex + delta,
            0, this.input.options.length -1,
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
