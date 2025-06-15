export class ChunkConfig {
    constructor() {
        this.enabled = false; // Toggle chunk system on/off.
        // Chunks within this distance will be unloaded when entering a new chunk.
        this.loadRadius = 1;
        // Chunks beyond this distance will be unloaded when entering a new chunk.
        this.unloadRadius = 2;
    }
}
