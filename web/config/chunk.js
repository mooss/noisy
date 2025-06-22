import { CHUNK_UNIT } from "../height-generation.js";

export class ChunkConfig {
    // Chunks within this distance will be unloaded when entering a new chunk.
    loadRadius = 1;
    // Power of the chunk (one side is 2^n + 1).
    #power = 5;
    // The previous value of this.size.
    previousSize = undefined;
    // Chunks beyond this distance *plus* the load radius will be unloaded when entering a new chunk.
    unloadRadius = 2;

    set power(value) {
        this.previousSize = this.size;
        this.#power = value;
    }
    get power() { return this.#power; }
    get size() { return 2**this.power + 1; }
    get cellSize() { return CHUNK_UNIT / this.size; }

    ui(parent, resize, load) {
        parent.range(this, 'power', 1, 8, 1).legend('Grid size').onInput(resize);
        parent.range(this, 'loadRadius', 0, 8, 1).legend('Load radius').onInput(load);
        parent.range(this, 'unloadRadius', 0, 4, 1).legend('Unload radius');
    }
}
