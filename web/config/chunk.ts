import { CHUNK_UNIT } from "../constants.js";
import { Panel } from "../gui/gui.js";

interface ChunkCallbackI {
    regenerateTerrain(): void;
    reloadTerrain(): void;
}
class ChunkCallback {
    constructor(private cb: ChunkCallbackI) { };
    get resize(): () => void { return () => this.cb.regenerateTerrain() }
    get reload(): () => void { return () => this.cb.reloadTerrain() }
}

export function chunksUI(conf: ChunkConfig, root: Panel, callbacks: ChunkCallbackI) {
    const cb = new ChunkCallback(callbacks);
    root.range(conf, 'power', 1, 8, 1).legend('Blocks in a chunk')
        .onInput(cb.resize)
        .formatter(() => conf.nblocks);
    root.select(conf, 'radiusType', {
        'Square': 'square',
        'Circle': 'circle',
    }).legend('Radius Type').onChange(cb.reload);
    root.range(conf, 'loadRadius', 0, 8, 1).legend('Load radius').onInput(cb.reload);
}

export class ChunkConfig {
    // Chunks within this distance will be unloaded when entering a new chunk.
    loadRadius: number = 1;
    // Shape of the loaded area around the center chunk.
    radiusType: 'square' | 'circle' = 'square';
    // Power of the chunk (one side is 2^n + 1).
    _power: number = 5;
    // The previous value of this.size.
    previousSize: number = undefined;
    // Chunks beyond this distance *plus* the load radius will be unloaded when entering a new chunk.
    // unloadRadius: number = 2;

    set power(value: number) {
        this.previousSize = this.nblocks;
        this._power = value;
    }
    get power(): number { return this._power }
    get nblocks(): number { return 2 ** this.power }
    get sampling(): number { return 1 / this.nblocks }
    get blockSize(): number { return CHUNK_UNIT / this.nblocks }
}
