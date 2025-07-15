interface Colors {
    border: string;
    input: string;
    inputBg: string;
    label: string;
    param: string;
    text: string;
}

export const colors: Colors = {
    border: 'grey',
    input: 'steelblue',
    inputBg: '#2D3748',
    label: 'lightskyblue',
    param: 'gold',
    text: 'lightgray',
}

interface EnhancedHTMLElement extends HTMLElement {
    css: (attrs: Record<string, string | number>) => void;
}

/**
 * Spawns an HTML element below parent and assign it an optional style.
 *
 * A `css` method is added to the element to conveniently change the stile.
 *
 * @param {string}      tag         - The HTML tag name for the new element.
 * @param {HTMLElement} parent      - The parent DOM element.
 * @param {object}      [style]     - CSS properties of the new element.
 *
 * @returns {EnhancedHTMLElement} The newly created HTML element with css method.
 */
export function spawn(
    tag: string,
    parent: HTMLElement,
    style?: Record<string, string | number>,
): EnhancedHTMLElement {
    const res = document.createElement(tag) as EnhancedHTMLElement;
    res.css = function(attrs) { Object.assign(this.style, attrs); };
    if (style !== undefined) {
        res.css(style);
    }

    parent.appendChild(res);

    return res;
}
