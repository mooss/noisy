export class GridConfig {
    constructor() {
        this.heightMultiplier = 1.0;  // Multiplier for the terrain height.
    }

    ui(parent, updateTerrain) {
        parent.range(this, 'heightMultiplier', 0.1, 5.0, 0.05)
            .legend('Height multiplier')
            .onInput(updateTerrain);
    }
}
