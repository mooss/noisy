import { Registry } from "../encoding/self-encoder.js";
import { Ctor } from "../utils/objects.js";

export const StateRegistry = new Registry();
export function register(name: string, ctor: Ctor<any>) {
    if (!StateRegistry.register(name, ctor))
        console.error(`Duplicated state registration attempt for ${name}`);
}

interface GameCallbacksI {
    recomputeTerrain(): void;
    ensureTerrainLoaded(): void;
    updateAvatar(): void;
    updateRender(): void;
    updateCamera(): void;
    updateUniform(key: string, value: any): void;
    repaintTerrain(): void;
}
export class GameCallbacks {
    constructor(private cb: GameCallbacksI) { };
    readonly terrain = {
        recompute: () => this.cb.recomputeTerrain(),
        ensureLoaded: () => this.cb.ensureTerrainLoaded(),
        repaint: () => this.cb.repaintTerrain(),
    }
    readonly avatar = {
        update: () => this.cb.updateAvatar(),
    }
    readonly render = {
        update: () => this.cb.updateRender(),
        uniform: (key: string) => (value: any) => {this.cb.updateUniform(key, value)},
    }
    readonly camera = {
        update: () => this.cb.updateCamera(),
    }
}
