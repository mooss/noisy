import * as THREE from 'three';
import { shaders } from '../../shaders/strings.js';
import { Palette } from "../palettes.js";

interface ShaderInjection { decl?: string; impl?: string; }
export function injectInShader(
    material: THREE.Material,
    vertex: ShaderInjection,
    fragment: ShaderInjection,
    uniforms: Record<string, any>,
): THREE.Material {
    material.onBeforeCompile = shader => {
        for (const [name, value] of Object.entries(uniforms))
            shader.uniforms[name] = { value };

        shader.vertexShader = inject(
            vertex.decl || '', vertex.impl || '',
            shader.vertexShader, `#include <begin_vertex>`,
        );

        shader.fragmentShader = inject(
            fragment.decl || '', fragment.impl || '',
            shader.fragmentShader, '#include <color_fragment>',
        );
    };
    return material;
}

/**
 * Create a mesh material that interpolates colors from height in the shaders by storing the color
 * palette in a texture.
 *
 * @param palette - The color palette used for shading.
 * @returns a material configured with custom shader logic for palette-based coloring.
 */
export function paletteShader(palette: Palette, texture?: THREE.Texture): THREE.Material {
    //TODO: Handle texture disposal.
    const paletteTex = palette2texture(palette);
    const opts = texture? {map: texture}: null;

    // The shader created by THREE.js contains a lot of useful things so it is simpler for now to
    // inject additional instructions rather than to write a shader from scratch.
    return injectInShader(
        new THREE.MeshStandardMaterial(opts),
        { decl: shaders.vs_palette_decl, impl: shaders.vs_palette_impl },
        { decl: shaders.fs_palette_decl, impl: shaders.fs_palette_impl },
        { u_palette: paletteTex, u_paletteWidth: palette.size },
    )
}

function palette2texture(palette: Palette): THREE.DataTexture {
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

function inject(prelude: string, content: string, shader: string, marker: string): string {
    return prelude + '\n' + shader.replace(marker, marker + '\n' + content);
}
