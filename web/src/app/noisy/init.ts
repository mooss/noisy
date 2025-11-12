import { CHUNK_UNIT, VERSION } from "../../../config/constants.js";
import { noiseAlgorithms, NoiseState } from "../../noise/init.js";
import { AvatarState } from "../../state/avatar.js";
import { CameraState } from "../../state/camera.js";
import { ChunkState } from "../../state/chunk.js";
import { RenderState, textures } from "../../state/renderer.js";
import { StateRegistry } from "../../state/state.js";

/**
 * The reference state used to compress the state when saving to URL.
 * Useful to maintain the validity of URLs when only minor things change between versions.
 *
 * It is necessary to keep track of this because it is used as a dictionary to create the state
 * codec, so changing this reference state creates a completely different encoder, which is not
 * backwards compatible.
 */
export const REFERENCE_STATE = {
    camera: mkCamState(),
    chunks: new ChunkState({
        _power: 7,
        loadRadius: 1,
        radiusType: 'square',
    }),
    avatar: new AvatarState({
        size: 3,
        heightOffset: 0,
        position: { x: .5, y: .5, z: 0 }, // Middle of the first chunk.
    }),
    render: new RenderState({
        geometryStyle: 'Surface',
        painterStyle: 'Palette',
        paletteName: 'Savanna',
        colorLowShift: 0,
        colorHighShift: 0,
        _colorSlope: 3,
        light: {
            ambient: { intensity: 2 },
            directional: { intensity: 3 },
        },
        heightMultiplier: 1,
        texturePath: textures.Cobbly,
        textureRepeat: 5,
        textureBumpScale: 4,
    }),
    noise: null as NoiseState,

    // The last version with a URL-compatible state.
    version: VERSION,
};

REFERENCE_STATE.noise = noiseAlgorithms(REFERENCE_STATE.chunks);

export type GameState = typeof REFERENCE_STATE;

function mkCamState() {
    const camDist = CHUNK_UNIT * 1.2 + 50;
    const center = CHUNK_UNIT / 2;
    return new CameraState({
        cameraMode: 'Follow',
        position: { x: center, y: center - camDist * 0.7, z: camDist * 0.7 },
        focus: { x: center, y: center, z: 0 },
    });
}

/**
 * The initial game state, i.e. the reference state updated with what changed between the last
 * compatible version and this version.
 * Will just default to the reference state when breaking compatibility.
 */
export const INITIAL_STATE: GameState = StateRegistry.roundtrip(REFERENCE_STATE);
