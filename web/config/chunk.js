import { CHUNK_UNIT } from "../constants.ts";

export class ChunkConfig {
    // Chunks within this distance will be unloaded when entering a new chunk.
    loadRadius = 1;
    // Shape of the loaded area around the center chunk.
    radiusType = 'square';
    // Power of the chunk (one side is 2^n + 1).
    #power = 5;
    // The previous value of this.size.
    previousSize = undefined;
    // Chunks beyond this distance *plus* the load radius will be unloaded when entering a new chunk.
    // unloadRadius = 2;

    set power(value) {
        this.previousSize = this.nblocks;
        this.#power = value;
    }
    get power() { return this.#power }
    get nblocks() { return 2**this.power }
    get sampling() { return 1/this.nblocks }
    get blockSize() { return CHUNK_UNIT / this.nblocks }

    ui(parent, resize, load) {
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
