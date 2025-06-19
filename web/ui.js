import { GUI } from './gui.js';

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

export class UI {
    #config;
    #fps;
    #fpsController;
    #gui;
    #updateAvatar;

    constructor(config, updateAvatar) {
        this.#config = config;
        this.#updateAvatar = updateAvatar;

        this.#gui = new GUI();
        this.#setupFPS();
        this.#setupKeyboard();
    }

    ///////////////////
    // Setup methods //

    #setupFPS() {
        this.#fps = new FpsCounter();
        this.#fpsController = this.#gui.readOnly(0).legend('FPS');
    }

    #setupKeyboard() {
        document.addEventListener('keydown', (event) => {
            let moved = false;
            const avatar = this.#config.avatar;
            const gridSize = this.#config.grid.size;

            switch (event.code) {
            case 'KeyW': // Up.
                if (avatar.y < gridSize - 1) {
                    avatar.y++;
                    moved = true;
                }
                break;
            case 'KeyS': // Down.
                if (avatar.y > 0) {
                    avatar.y--;
                    moved = true;
                }
                break;
            case 'KeyA': // Left.
                if (avatar.x > 0) {
                    avatar.x--;
                    moved = true;
                }
                break;
            case 'KeyD': // Right.
                if (avatar.x < gridSize - 1) {
                    avatar.x++;
                    moved = true;
                }
                break;
            }

            if (moved) {
                this.#updateAvatar();
            }
        });
    }

    ////////////////////
    // Update methods //

    updateFPS() {
        this.#fpsController.update(Math.round(this.#fps.update()));
    }

    ///////////////////////
    // Stop gap measures //
    get root() {
        return this.#gui;
    }
}
