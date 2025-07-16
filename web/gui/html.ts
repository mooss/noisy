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

export type HtmlCssElement = HTMLElement & {
    css(props: Record<string, string | number>): void;
}

function addCss(el: HTMLElement): HtmlCssElement {
  // if this element was already wrapped, return it
  if ('css' in el) return el as HtmlCssElement;

  (el as HtmlCssElement).css = function (props) {
    Object.assign(this.style, props);
    return this as HtmlCssElement;
  };

  return el as HtmlCssElement;
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
export function spawn(
    tag: string,
    parent: HTMLElement,
    style?: Record<string, string | number>,
): HtmlCssElement {
    const res = addCss(document.createElement(tag));
    if (style !== undefined) {
        res.css(style);
    }

    parent.appendChild(res);

    return res;
}
