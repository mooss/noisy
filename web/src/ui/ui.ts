import { StaticText } from '../gui/components/parameters.js';
import { Panel } from '../gui/panels/panel.js';

class FpsCounter {
    private delta: number = 0;
    private frames: number = 0;
    private interval: number = .1;
    private fps: number = 0;

    update(delta: number): number {
        this.frames++;
        this.delta += delta;

        if (this.delta >= this.interval) {
            this.fps = (this.frames / this.delta);
            this.frames = 0;
            this.delta = 0;
        }

        return this.fps;
    }
}

export class FpsWidget {
    private fps: FpsCounter;
    private fpsUI: StaticText;

    constructor(parent: Panel) {
        this.fps = new FpsCounter();
        this.fpsUI = parent.static(0).label('FPS');
    }

    update(delta: number): void { this.fpsUI.update(Math.round(this.fps.update(delta))) }
}

export class Keyboard {
    private pressedKeys: Set<string>;

    constructor() {
        this.pressedKeys = new Set();
        document.addEventListener('keydown', (e) => this.pressedKeys.add(e.code));
        document.addEventListener('keyup', (e) => this.pressedKeys.delete(e.code));
    }

    isPressed(code: string): boolean { return this.pressedKeys.has(code) }
    checkFocus(): void { if (!document.hasFocus()) this.pressedKeys = new Set() }
}
