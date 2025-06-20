import { rangeMapper } from "../utils.js";

export class GridConfig {
    constructor() {
        this.power = 5;               // Power of the grid (one side is 2^n + 1).
        this.heightMultiplier = 1.0;  // Multiplier for the terrain height.
    }

    get size() {
        return 2**this.power + 1;
    }

    ui(parent, chunk, avatar, updateTerrain) {
        parent.range(this, 'power', 1, 8, 1)
            .legend('Grid size')
            .onInput(() => {
                // Update avatar position and scale based on new grid size.
                const oldSize = chunk.size;
                const conv = rangeMapper(0, oldSize, 0, this.size);
                avatar.x = Math.round(conv(avatar.x));
                avatar.y = Math.round(conv(avatar.y));

                updateTerrain();
            });

        parent.range(this, 'heightMultiplier', 0.1, 5.0, 0.05)
            .legend('Height multiplier')
            .onInput(updateTerrain);
    }
}
