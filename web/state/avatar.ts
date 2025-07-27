import type { Panel } from '../gui/gui.js';
import { AutoAssign } from '../utils/objects.js';
import { register, StateCallbacks } from './state.js';

type CameraMode = 'Follow' | 'Free';

export class AvatarState extends AutoAssign<AvatarState> {
    class(): string { return 'AvatarState' }
    size: number;           // Avatar sphere radius (cell size multiplier).
    heightOffset: number;   // How high above the terrain the avatar floats (cell size multiplier).
    cameraMode: CameraMode; // Camera mode: 'Free' or 'Follow'.
}
register('AvatarState', AvatarState);

export function avatarUI(state: AvatarState, root: Panel, cb: StateCallbacks) {
    root.range(state, 'size', 1, 10, 1)
        .legend('Size')
        .onInput(cb.avatar.update);
    root.range(state, 'heightOffset', 0, 0.2, 0.01)
        .legend('Height offset')
        .onInput(cb.avatar.update);
    root.select(state, 'cameraMode', {
        'Follow': 'Follow',
        'Free': 'Free',
    }).legend('Camera mode').onChange(cb.avatar.update);
}
