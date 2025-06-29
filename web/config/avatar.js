export class AvatarConfig {
    constructor() {
        this.size = 3;         // Avatar sphere radius (cell size multiplier).
        this.heightOffset = 0; // How high above the terrain the avatar floats (cell size multiplier).
    }

    ui(parent, update) {
        parent.range(this, 'size', 1, 10, 1)
            .legend('Size')
            .onInput(update);
        parent.range(this, 'heightOffset', 0, 0.2, 0.01)
            .legend('Height offset')
            .onInput(update);
    }
}
