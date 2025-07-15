import type { Panel } from '../gui/gui';
import type { InputParam } from '../gui/parameters';

type CameraMode = 'Follow' | 'Free';

export class AvatarConfig {
    size: number;              // Avatar sphere radius (cell size multiplier).
    heightOffset: number;      // How high above the terrain the avatar floats (cell size multiplier).
    cameraMode: CameraMode;    // Camera mode: 'Free' or 'Follow'.

    constructor() {
        this.size = 3;
        this.heightOffset = 0;
        this.cameraMode = 'Follow';
    }

    ui(parent: Panel, update: () => void): void {
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
