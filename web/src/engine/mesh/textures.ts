import * as THREE from 'three';
import { Palette } from "../palettes.js";

export function palette2texture(palette: Palette): THREE.DataTexture {
    const res = new THREE.DataTexture(
        palette.toArray(),
        palette.size, // Width.
        1,            // Height.
        THREE.RGBAFormat,
        THREE.FloatType,
    );
    res.needsUpdate = true;
    res.magFilter = THREE.LinearFilter;
    res.minFilter = THREE.LinearMipMapLinearFilter;
    res.wrapS = THREE.ClampToEdgeWrapping;
    return res;
}
