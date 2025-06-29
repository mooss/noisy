class FpsCounter {
    #delta = 0; #frames = 0; #interval = .1; #fps = 0;

    update(delta) {
        this.#frames++;
        this.#delta += delta;

        if (this.#delta >= this.#interval) {
            this.#fps = (this.#frames / this.#delta).toFixed(1);
            this.#frames = 0;
            this.#delta = 0;
        }

        return this.#fps;
    }
}

export class FpsWidget {
    #fps;
    #fpsUI;

    constructor(parent) {
        this.#fps = new FpsCounter();
        this.#fpsUI = parent.readOnly(0).legend('FPS');
    }

    update(delta) { this.#fpsUI.update(Math.round(this.#fps.update(delta))) }
}

export class Keyboard {
    #pressedKeys = new Set();

    constructor() {
        document.addEventListener('keydown', (e) => this.#pressedKeys.add(e.code));
        document.addEventListener('keyup', (e) => this.#pressedKeys.delete(e.code));
    }

    isPressed(code) { return this.#pressedKeys.has(code) }
    checkFocus() { if (!document.hasFocus()) this.#pressedKeys = new Set() }
}
