export class AvatarConfig {
    constructor() {
        this.x = undefined;
        this.y = undefined;
        this.size = 0.5;       // Avatar sphere radius (cell size multiplier).
        this.heightOffset = 0; // How high above the terrain the avatar floats (cell size multiplier).
    }
}
