import { clone } from "../utils/objects.js";
import { Tooltip } from "./foundations.js";
import { spawn } from "./html.js";
import { Panel } from "./panels/panel.js";
import { Blawhi, Facet } from "./style.js";

/**
 * Main element of the graphical user interface.
 */
export class GUI extends Panel {
    private bar: HTMLDivElement;
    private _title: HTMLDivElement;

    /** Creates a GUI instance and attach it to the document body. */
    constructor(parent: HTMLElement = document.body, ...appearanceOverride: Facet[]) {
        super(parent, clone(Blawhi.gui).merge(...appearanceOverride));
        this.bar = spawn('div', this._elt, Blawhi.collapsibleBar);
        this._title = spawn('div', this._elt, Blawhi.title);
    }

    /**
     * Displays a tooltip when hovering over the title.
     * Will not display without a title.
     */
    tooltip(text: string): this {
        new Tooltip(this._title, text);
        return this;
    }

    /**
     * Adds a very thin bar at the top of the GUI that toggles collapsing/unrolling the panel when
     * clicked.
     * It must be called only once.
     */
    collapsible(): this {
        // On click, toggle the visibility of all children except the bar.
        let isCollapsed = false;
        this.bar.addEventListener('click', () => {
            isCollapsed = !isCollapsed;
            for (let i = 0; i < this._elt.children.length; i++) {
                const child = this._elt.children[i] as HTMLElement;
                if (child !== this.bar) {
                    // This only collapses the root of each elements, thus not affecting the
                    // visibility of things like folders.
                    child.style.display = isCollapsed ? 'none' : '';
                }
            }
        });

        return this;
    }

    /**
     * Adds a centered title at the top of the GUI.
     * @param text - The title.
     */
    title(text: string): this {
        this._title.textContent = text;
        return this;
    }
}
