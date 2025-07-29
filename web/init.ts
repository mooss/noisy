import { VERSION, Version } from "./constants.js";
import { NoiseMakerI } from "./noise/foundations.js";
import { noiseAlgorithms } from "./noise/init.js";
import { AvatarState } from "./state/avatar.js";
import { ChunkState } from "./state/chunk.js";
import { RenderState } from "./state/render.js";

export interface GameState {
    chunks: ChunkState;
    avatar: AvatarState;
    render: RenderState;
    noise: NoiseMakerI;
    version: Version;
}

export function initialState(): GameState {
    return {
        chunks: new ChunkState({
            _power: 6,
            loadRadius: 1,
            radiusType: 'square',
        }),
        avatar: new AvatarState({
            size: 3,
            heightOffset: 0,
            cameraMode: 'Follow',
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
