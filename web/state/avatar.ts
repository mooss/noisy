import type { Panel } from '../gui/gui.js';

type CameraMode = 'Follow' | 'Free';

export class AvatarState {
    size: number = 3;                  // Avatar sphere radius (cell size multiplier).
    heightOffset: number = 0;          // How high above the terrain the avatar floats (cell size multiplier).
    cameraMode: CameraMode = 'Follow'; // Camera mode: 'Free' or 'Follow'.

    constructor() { }

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
