import { Facet } from "./style.js";

/**
 * A HTMLElement extended with utility methods for managing CSS facets.
 * @template T - The base HTMLElement type to extend (defaults to HTMLElement)
 */
export type HtmlCssElement<T extends HTMLElement = HTMLElement> = T & {
    /**
     * Adds CSS classes of a facet to the element.
     * @param props - The classes to add
     */
    addFacet(props: Facet): void;

    /**
     * Removes CSS classes of a facet from the element.
     * @param props - The classes to remove
     */
    removeFacet(props: Facet): void;

    /**
     * Creates and returns a new HtmlCssElement with the given tag name.
     *
     * @template U - The type of HTMLElement being created (defaults to HTMLElement)
     * @param tag - The HTML tag name for the new element
     * @param parent - The parent element to append the new element to
     * @param style - Optional facet containing CSS classes to apply to the new element
     * @returns The newly created HtmlCssElement
     */
    spawn<U extends HTMLElement = HTMLElement>(
        tag: string,
        parent: HTMLElement,
        style?: Facet,
    ): HtmlCssElement<U>;
}

function wrapToCss<T extends HTMLElement>(el: T): HtmlCssElement<T> {
    (el as HtmlCssElement<T>).addFacet = function(style: Facet) {
        this.classList.add(...style.classes);
    };
    (el as HtmlCssElement<T>).removeFacet = function(style: Facet) {
        this.classList.remove(...style.classes);
    };
    (el as HtmlCssElement<T>).spawn = function<U extends HTMLElement = HTMLElement>(
        tag: string,
        parent: HTMLElement,
        style?: Facet,
    ): HtmlCssElement<U> {
        return spawn<U>(tag, parent, style);
    }

    return el as HtmlCssElement<T>;
}

/**
 * Spawns an HTML element below parent and assign it an optional style.
 *
 * `addFacet` and `removeFacet` method is added to the element to conveniently change the style.
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
    const res = wrapToCss(document.createElement(tag) as T);
    if (style !== undefined) {
        res.addFacet(style);
    }

    parent.appendChild(res);

    return res;
}
