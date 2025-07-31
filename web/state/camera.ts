import { Panel } from '../gui/gui.js';
import { AutoAssign } from '../utils/objects.js';
import { GameCallbacks, register } from './state.js';

type CameraMode = 'Follow' | 'Free';
interface vector3 { x: number; y: number; z: number; }

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
    }).legend('Camera mode').onChange(() => { cb.avatar.update(); cb.camera.update(); });
}
