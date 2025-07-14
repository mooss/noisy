export class AvatarConfig {
    constructor() {
        this.size = 3;              // Avatar sphere radius (cell size multiplier).
        this.heightOffset = 0;      // How high above the terrain the avatar floats (cell size multiplier).
        this.cameraMode = 'Follow'; // Camera mode: 'Free' or 'Follow'
    }

    ui(parent, update) {
        parent.range(this, 'size', 1, 10, 1)
            .legend('Size')
            .onInput(update);
        parent.range(this, 'heightOffset', 0, 0.2, 0.01)
            .legend('Height offset')
            .onInput(update);
        parent.select(this, 'cameraMode', {
            'Follow': 'Follow',
            'Free': 'Free',
        }).legend('Camera mode').onChange(update);
    }
}
