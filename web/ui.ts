import { ReadOnly } from './gui/parameters.js';
import { Panel } from './gui/gui.js';

class FpsCounter {
    #delta = 0; #frames = 0; #interval = .1; #fps = 0;

    update(delta: number): number {
        this.#frames++;
        this.#delta += delta;

        if (this.#delta >= this.#interval) {
            this.#fps = (this.#frames / this.#delta);
            this.#frames = 0;
            this.#delta = 0;
        }

        return this.#fps;
    }
}

export class FpsWidget {
    #fps: FpsCounter;
    #fpsUI: ReadOnly;

    constructor(parent: Panel) {
        this.#fps = new FpsCounter();
        this.#fpsUI = parent.readOnly(0).legend('FPS');
    }

    update(delta: number) { this.#fpsUI.update(Math.round(this.#fps.update(delta))) }
}

export class Keyboard {
    #pressedKeys: Set<string>;

    constructor() {
        this.#pressedKeys = new Set();
        document.addEventListener('keydown', (e) => this.#pressedKeys.add(e.code));
        document.addEventListener('keyup', (e) => this.#pressedKeys.delete(e.code));
    }

    isPressed(code: string): boolean { return this.#pressedKeys.has(code) }
    checkFocus(): void { if (!document.hasFocus()) this.#pressedKeys = new Set() }
}
