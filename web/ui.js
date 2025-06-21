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


export function setupKeyboard(avatar, chunksConfig, update) {
    document.addEventListener('keydown', (event) => {
        const size = chunksConfig.size;
        let moved = false;

        switch (event.code) {
        case 'KeyW': // Up.
            if (avatar.y < size - 1) {
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
            if (avatar.x < size - 1) {
                avatar.x++;
                moved = true;
            }
            break;
        }

        if (moved) update();
    });
}
