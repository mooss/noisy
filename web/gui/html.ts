import { Facet } from "./style.js";

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

// A HTMLElement type extended with a css method that can update the style of the element.
export type HtmlCssElement<T extends HTMLElement = HTMLElement> = T & {
    addFacet(props: Facet): void;
    removeFacet(props: Facet): void;
}

function addCss<T extends HTMLElement>(el: T): HtmlCssElement<T> {
    (el as HtmlCssElement<T>).addFacet = function(style: Facet) {
        this.classList.add(...style.classes);
    };
    (el as HtmlCssElement<T>).removeFacet = function(style: Facet) {
        this.classList.remove(...style.classes);
    };

    return el as HtmlCssElement<T>;
}

/**
 * Spawns an HTML element below parent and assign it an optional style.
 *
 * A `css` method is added to the element to conveniently change the stile.
 *
 * @param tag     - The HTML tag name for the new element.
 * @param parent  - The parent DOM element.
 * @param [style] - CSS properties of the new element.
 *
 * @returns The newly created HTML element with css method.
 */
export function spawn<T extends HTMLElement = HTMLElement>(
    tag: string,
    parent: HTMLElement,
    style?: Facet,
): HtmlCssElement<T> {
    const res = addCss(document.createElement(tag) as T);
    if (style !== undefined) {
        res.addFacet(style);
    }

    parent.appendChild(res);

    return res;
}
