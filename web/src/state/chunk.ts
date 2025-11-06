import { CHUNK_UNIT } from "../../config/constants.js";
import { Panel } from "../gui/panels/panel.js";
import { tips } from "../ui/tips.js";
import { AutoAssign } from "../utils/objects.js";
import { GameCallbacks, register } from "./state.js";

//TIP: chunks Square sections of terrain loaded around the avatar.
abstract class ChunkStateP extends AutoAssign<ChunkStateP> {
    // Chunks within this distance will be unloaded when entering a new chunk.
    //TIP: chunk_load_radius Distance from the player at which chunks are loaded.
    declare loadRadius: number;

    // Shape of the loaded area around the center chunk.
    //TIP: chunk_radius_type Shape of the chunk loading area around the avatar.
    declare radiusType: 'square' | 'circle';

    // Power of the chunk (one side is 2^n + 1).
    //TIP: chunk_size Number of blocks in a chunk. Increasing this increases the terrain resolution but makes the terrain slower to load.
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

export function chunksUI(conf: ChunkState, root: Panel, cb: GameCallbacks) {
    root.range(conf, 'power', 1, 7, 1).label('Blocks in a chunk')
        .onInput(cb.terrain.recompute)
        .formatter(() => conf.nblocks)
        .tooltip(tips.chunk_size);

    root.map(conf, 'radiusType', {
        'Square': 'square',
        'Circle': 'circle',
    })
        .label('Radius type')
        .onChange(cb.terrain.ensureLoaded)
        .tooltip(tips.chunk_radius_type);

    root.range(conf, 'loadRadius', 0, 8, 1)
        .label('Load radius')
        .onInput(cb.terrain.ensureLoaded)
        .tooltip(tips.chunk_load_radius);
}
