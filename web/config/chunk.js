export class ChunkConfig {
    constructor() {
        // Power of the chunk (one side is 2^n + 1).
        this.power = 5;
        // Chunks within this distance will be unloaded when entering a new chunk.
        this.loadRadius = 1;
        // Chunks beyond this distance *plus* the load radius will be unloaded when entering a new chunk.
        this.unloadRadius = 2;
    }

    get size() {
        return 2**this.power + 1;
    }

    ui(parent, resize, load) {
        parent.range(this, 'power', 1, 8, 1).legend('Grid size').onInput(resize);
        parent.range(this, 'loadRadius', 0, 8, 1).legend('Load radius').onInput(load);
        parent.range(this, 'unloadRadius', 0, 4, 1).legend('Unload radius');
    }
}
