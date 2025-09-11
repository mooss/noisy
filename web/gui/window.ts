import { vec2 } from "../utils/maths.js";
import { spawn, HtmlCssElement } from "./html.js";
import { Gardener } from "./style.js";

/**
 * A closeable window floating in the foreground.
 */
export class Window {
    private container: HtmlCssElement<HTMLDivElement>;
    private header: HtmlCssElement<HTMLDivElement>;
    private closeButton: HtmlCssElement<HTMLButtonElement>;
    private content: HtmlCssElement<HTMLDivElement>;

    constructor(title: string, html: string) {
        this.container = spawn('div', document.body, Gardener.window);

        // Dress up the header.
        this.header = spawn('div', this.container, Gardener.windowHeader);
        const titleSpan = spawn('span', this.header, Gardener.windowTitle);
        titleSpan.textContent = title;
        this.closeButton = spawn('button', this.header, Gardener.windowCloseButton);
        this.closeButton.textContent = '🗙';
        this.closeButton.addEventListener('click', () => this.close());

        this.content = spawn('div', this.container, Gardener.windowContent);
        this.content.innerHTML = html;
        this.center();
    }

    draggable(): this {
        let dragging = false;
        const mouse = vec2.zero();
        const window = vec2.zero();

        this.header.addEventListener('mousedown', (e: MouseEvent) => {
            dragging = true;
            mouse.x = e.clientX;
            mouse.y = e.clientY;
            window.x = this.container.offsetLeft;
            window.y = this.container.offsetTop;
            e.preventDefault(); // Prevent text selection
        });

        document.addEventListener('mousemove', (e: MouseEvent) => {
            if (dragging) {
                const dx = e.clientX - mouse.x;
                const dy = e.clientY - mouse.y;
                this.container.style.left = `${window.x + dx}px`;
                this.container.style.top = `${window.y + dy}px`;
            }
        });

        document.addEventListener('mouseup', () => {
            dragging = false;
        });

        return this;
    }

    private center(): this {
        const bounds = this.container.getBoundingClientRect();
        this.container.style.left = `${(window.innerWidth - bounds.width) / 2}px`;
        this.container.style.top = `${(window.innerHeight - bounds.height) / 2}px`;
        return this;
    }

    close(): void {
        this.container.remove();
    }
}
