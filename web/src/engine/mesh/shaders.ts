import * as THREE from 'three';
import { Palette } from "../palettes.js";

/**
 * Create a mesh material that interpolates colors from height in the shaders by storing the color
 * palette in a texture.
 *
 * @param palette - The color palette used for shading.
 * @returns a material configured with custom shader logic for palette-based coloring.
 */
export function paletteShader(palette: Palette): THREE.MeshStandardMaterial {
    //TODO: turn into a class and handle texture disposal.
    // The color palette is stored as a texture.
    const paletteTex = new THREE.DataTexture(
        palette.toArray(),
        palette.size, // Width.
        1,            // Height.
        THREE.RGBAFormat,
        THREE.FloatType,
    );
    paletteTex.needsUpdate = true;
    paletteTex.magFilter = THREE.LinearFilter;
    paletteTex.minFilter = THREE.LinearMipMapLinearFilter;
    paletteTex.wrapS = THREE.ClampToEdgeWrapping;

    // The shader created by THREE.js contains a lot of useful things so it is simpler for now to
    // inject additional instructions rather than to write a shader from scratch.
    const material = new THREE.MeshStandardMaterial();
    material.onBeforeCompile = shader => {
        // Vertex shader: forward the vertex height to the fragment shader.
        const vertexWithMeshPosition = shader.vertexShader.replace(
            `#include <begin_vertex>`,
            `#include <begin_vertex>
v_z = position.z;`
        );
        shader.vertexShader = `varying float v_z;
${vertexWithMeshPosition}`;

        // Fragment shader: smoothly interpolate the color from the height using the palette.
        // Without this, the transition between two colors is too fast, which is particularly
        // visible with a bicolor palette.
        const injectColor = `#include <color_fragment>
vec2 colorIdx = vec2(mix(0.5 / u_paletteWidth, 1.0 - 0.5 / u_paletteWidth, v_z), 0.5);
diffuseColor.rgb = texture2D(u_palette, colorIdx).rgb;`
        const fragmentWithColor = shader.fragmentShader.replace('#include <color_fragment>', injectColor);
        shader.uniforms.u_palette = { value: paletteTex };
        shader.uniforms.u_paletteWidth = { value: palette.size };
        shader.fragmentShader = `uniform sampler2D u_palette;

uniform float u_paletteWidth;
varying float v_z;
${fragmentWithColor}`;
    };

    return material;
}
