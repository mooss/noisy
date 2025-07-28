import { CHUNK_UNIT } from "../constants.js";
import { Panel } from "../gui/gui.js";
import { AutoAssign } from "../utils/objects.js";
import { register, StateCallbacks } from "./state.js";

abstract class ChunkStateP extends AutoAssign<ChunkStateP> {
    // Chunks within this distance will be unloaded when entering a new chunk.
    declare loadRadius: number;
    // Shape of the loaded area around the center chunk.
    declare radiusType: 'square' | 'circle';
    // Power of the chunk (one side is 2^n + 1).
    declare _power: number;
    // The previous value of this.size.
    declare previousSize?: number;
    // Chunks beyond this distance *plus* the load radius will be unloaded when entering a new chunk.
    // unloadRadius: number = 2;
}

export class ChunkState extends ChunkStateP {
    class(): string { return 'ChunkState' }
    set power(value: number) {
        this.previousSize = this.nblocks;
        this._power = value;
    }
    get power(): number { return this._power }
    get nblocks(): number { return 2 ** this.power }
    get sampling(): number { return 1 / this.nblocks }
    get blockSize(): number { return CHUNK_UNIT / this.nblocks }
}
register('ChunkState', ChunkState);

export function chunksUI(conf: ChunkState, root: Panel, cb: StateCallbacks) {
    root.range(conf, 'power', 1, 8, 1).legend('Blocks in a chunk')
        .onInput(cb.terrain.recompute)
        .formatter(() => conf.nblocks);
    root.select(conf, 'radiusType', {
        'Square': 'square',
        'Circle': 'circle',
    }).legend('Radius type').onChange(cb.terrain.ensureLoaded);
    root.range(conf, 'loadRadius', 0, 8, 1).legend('Load radius').onInput(cb.terrain.ensureLoaded);
}
