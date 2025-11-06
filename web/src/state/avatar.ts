import { Panel } from '../gui/panels/panel.js';
import { vector3 } from '../maths/maths.js';
import { GameCallbacks, register } from '../state/state.js';
import { tips } from '../ui/tips.js';
import { AutoAssign } from '../utils/objects.js';

export class AvatarState extends AutoAssign<AvatarState> {
    class(): string { return 'AvatarState' }

    // Avatar sphere radius (cell size multiplier).
    //TIP: avatar_size Size of the red sphere.
    declare size: number;

    // How high above the terrain the avatar floats (cell size multiplier).
    //TIP: avatar_offset Height at which the red sphere floats above the terrain.
    declare heightOffset: number;

    declare position: vector3;
}
register('AvatarState', AvatarState);

export function avatarUI(state: AvatarState, root: Panel, cb: GameCallbacks) {
    root.range(state, 'size', 1, 10, 1)
        .label('Size')
        .onInput(cb.avatar.update)
        .tooltip(tips.avatar_size);
    root.range(state, 'heightOffset', 0, 0.2, 0.01)
        .label('Height offset')
        .onInput(cb.avatar.update)
        .tooltip(tips.avatar_offset);
}
