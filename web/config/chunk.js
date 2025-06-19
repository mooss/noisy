export class ChunkConfig {
    constructor() {
        // Chunks within this distance will be unloaded when entering a new chunk.
        this.loadRadius = 1;
        // Chunks beyond this distance *plus* the load radius will be unloaded when entering a new chunk.
        this.unloadRadius = 2;
    }

    ui(parent, load) {
        parent.range(this, 'loadRadius', 0, 8, 1).legend('Load radius').onInput(load);
        parent.range(this, 'unloadRadius', 0, 4, 1).legend('Unload radius');
    }
}
