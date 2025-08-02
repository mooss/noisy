import { CHUNK_UNIT, VERSION, Version } from "./constants.js";
import { NoiseMakerI } from "./noise/foundations.js";
import { noiseAlgorithms } from "./noise/init.js";
import { AvatarState } from "./state/avatar.js";
import { CameraState } from "./state/camera.js";
import { ChunkState } from "./state/chunk.js";
import { RenderState } from "./state/render.js";

export interface GameState {
    avatar: AvatarState;
    camera: CameraState;
    chunks: ChunkState;
    noise: NoiseMakerI;
    render: RenderState;
    version: Version;
}

export function initialState(): GameState {
    const camDist = CHUNK_UNIT * 1.2 + 50;
    const center = CHUNK_UNIT / 2;

    return {
        camera: new CameraState({
            cameraMode: 'Follow',
            position: { x: center, y: center - camDist * 0.7, z: camDist * 0.7 },
            focus: { x: center, y: center, z: 0 },
        }),
        chunks: new ChunkState({
            _power: 6,
            loadRadius: 1,
            radiusType: 'square',
        }),
        avatar: new AvatarState({
            size: 3,
            heightOffset: 0,
            position: {x: .5, y: .5, z: 0}, // Middle of the first chunk.
        }),
        render: new RenderState({
            style: 'surface',
            paletteName: 'Bright terrain',
            light: {
                ambient: { intensity: .5 },
                directional: { intensity: 4 },
            },
            heightMultiplier: 1,
        }),
        noise: noiseAlgorithms(),
        version: VERSION,
    }
}
