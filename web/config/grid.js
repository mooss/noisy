export class GridConfig {
    constructor() {
        this.power = 5;               // Power of the grid (one side is 2^n + 1).
        this.heightMultiplier = 1.0;  // Multiplier for the terrain height.
    }

    get size() {
        return 2**this.power + 1;
    }
}
