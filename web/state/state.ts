import { Ctor, Registry } from "../encoding/self-encoder.js";

export const StateRegistry = new Registry();
export function register(name: string, ctor: Ctor<any>) {
    if (!StateRegistry.register(name, ctor))
        console.error(`Duplicated state registration attempt for ${name}`);
}

interface StateCallbacksI {
    recomputeTerrain(): void;
    ensureTerrainLoaded(): void;
    updateAvatar(): void;
    updateRender(): void;
}
export class StateCallbacks {
    constructor(private cb: StateCallbacksI) { };
    readonly terrain = {
        recompute: () => this.cb.recomputeTerrain(),
        ensureLoaded: () => this.cb.ensureTerrainLoaded(),
    }
    readonly avatar = {
        update: () => this.cb.updateAvatar(),
    }
    readonly render = {
        update: () => this.cb.updateRender(),
    }
}
