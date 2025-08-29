import { Panel } from '../gui/gui.js';
import { vector3 } from '../utils/maths.js';
import { AutoAssign } from '../utils/objects.js';
import { GameCallbacks, register } from './state.js';

type CameraMode = 'Follow' | 'Free';

export class CameraState extends AutoAssign<CameraState> {
    class(): string { return 'CameraState' }
    declare cameraMode: CameraMode;
    declare position: vector3;
    declare focus: vector3;
}
register('CameraState', CameraState);

export function cameraUI(state: CameraState, root: Panel, cb: GameCallbacks) {
    root.select(state, 'cameraMode', {
        'Follow': 'Follow',
        'Free': 'Free',
    }).label('Camera mode').onChange(() => { cb.avatar.update(); cb.camera.update(); });
}
