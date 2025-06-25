import { CHUNK_UNIT } from "../constants.js";

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
    get power() { return this.#power }
    get size() { return 2**this.power + 1 }
    get sampling() { return 1/this.size }
    get blockSize() { return CHUNK_UNIT / this.size }
    get converter() { return new CoordinatesConverter(this) }

    ui(parent, resize, load) {
        parent.range(this, 'power', 1, 8, 1).legend('Grid size').onInput(resize);
        parent.range(this, 'loadRadius', 0, 8, 1).legend('Load radius').onInput(load);
        parent.range(this, 'unloadRadius', 0, 4, 1).legend('Unload radius');
    }
}

export class CoordinatesConverter {
    #config;
    constructor(config) { this.#config = config; }
    toChunk(global) { return global.toChunk(this.#config.size); }
    toLocal(global) { return global.toLocal(this.#config.size); }
    toGlobal(chunk, local) { return local.toGlobal(chunk); }
    toWorld(global) { return global.toWorld(this.#config.blockSize); }
}
