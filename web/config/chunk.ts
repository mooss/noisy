import { CHUNK_UNIT } from "../constants.js";

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

    ui(parent: any, resize: (value: number) => void, load: () => void): void {
        parent.range(this, 'power', 1, 8, 1).legend('Blocks in a chunk')
            .onInput(resize)
            .formatter(() => this.nblocks);
        parent.select(this, 'radiusType', {
            'Square': 'square',
            'Circle': 'circle',
        }).legend('Radius Type').onChange(load);
        parent.range(this, 'loadRadius', 0, 8, 1).legend('Load radius').onInput(load);
        // parent.range(this, 'unloadRadius', 0, 4, 1).legend('Unload radius');
    }
}
