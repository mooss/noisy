import { BlockCoordinates } from "../coordinates.js";

export class AvatarConfig {
    constructor() {
        this.x = undefined;
        this.y = undefined;
        this.size = 0.5;       // Avatar sphere radius (cell size multiplier).
        this.heightOffset = 0; // How high above the terrain the avatar floats (cell size multiplier).
    }

    ui(parent, update) {
        parent.range(this, 'size', 0.1, 2.0, 0.1)
            .legend('Size')
            .onInput(update);
        parent.range(this, 'heightOffset', 0.0, 2.0, 0.1)
            .legend('Height offset')
            .onInput(update);
    }

    /** @returns {BlockCoordinates} the global position*/
    get position() {
        return new BlockCoordinates(this.x, this.y);
    }
}
