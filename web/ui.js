class FpsCounter {
    #delta = 0; #frames = 0; #interval = 100; #fps = 0;

    update(delta) {
        this.#frames++;
        this.#delta += delta;

        if (this.#delta >= this.#interval) {
            this.#fps = (this.#frames / (this.#delta / 1000)).toFixed(1);
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

    update(delta) {
        this.#fpsUI.update(Math.round(this.#fps.update(delta)));
    }
}

export class Keyboard {
    /** @type {Map<string, function(): void>} Keysdown codes to callback. */
    #keydownCallbacks = new Map();

    constructor() {
        document.addEventListener('keydown', (event) => {
            this.#keydownCallbacks.get(event.code)?.();
        });
    }

    /** Register a keydown callback, overrides the previous callback. */
    down(code, callback) { this.#keydownCallbacks.set(code, callback); }
}
