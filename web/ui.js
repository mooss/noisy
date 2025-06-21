class FpsCounter {
    constructor() {
        this.previous = performance.now();
        this.frames = 0;
        this.updateIntervalMs = 100; // Update FPS display every 100 milliseconds.
        this.fps = 0;
    }

    update() {
        const current = performance.now();
        this.frames++;
        const delta = current - this.previous;

        if (delta >= this.updateIntervalMs) {
            this.fps = (this.frames / (delta / 1000)).toFixed(1);
            this.frames = 0;
            this.previous = current;
        }

        return this.fps;
    }
}

export class FpsWidget {
    #fps;
    #fpsUI;

    constructor(parent) {
        this.#fps = new FpsCounter();
        this.#fpsUI = parent.readOnly(0).legend('FPS');
    }

    update() {
        this.#fpsUI.update(Math.round(this.#fps.update()));
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
