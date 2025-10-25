import * as THREE from 'three';
import { NoiseFun } from "../../noise/foundations.js";
import { heightMatrix } from './foundations.js';
import { ReusableArray } from './utils.js';

export function buildDisplacement(height: ReusableArray, fun: NoiseFun, resolution: number): THREE.DataTexture {
    const textureResolution = resolution +1;
    const data = heightMatrix(height, fun, resolution, {up:0, down:1, left:0, right:1});
    const texture = new THREE.DataTexture(
        data, textureResolution, textureResolution,
        THREE.RedFormat, THREE.FloatType,
    );
    texture.needsUpdate = true;
    return texture;
}
