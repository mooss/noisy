import { clone } from "../../utils/objects.js";
import { HtmlCssElement } from "../html.js";
import { Blawhi, Facet } from "../style.js";
import { Panel } from "./panel.js";

/**
 * An element that stacks vertically existing Panel instances.
 */
export class VerticalStack extends Panel {
    constructor(parent: HTMLElement, position: Facet, ...panels: HtmlCssElement[]) {
        super(parent, clone(Blawhi.verticalContainer).merge(position));
        panels.forEach(p => {
            this._elt.appendChild(p);
            p.addFacet(Blawhi.verticalChild); // Shadows some unwanted attributes.
        });
    }

    tooltip(): this { return this }
}
