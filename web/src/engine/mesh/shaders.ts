import * as THREE from 'three';

export type Uniform = {
    value: any,
    type?: string,
}
export type Uniforms = Record<string, Uniform>;
type ImplDecl = {
    impl: string;
    decl: string;
}
type ShaderSpec = {
    vs: ImplDecl;
    fs: ImplDecl;
}

export function injectShader(
    shader: ShaderSpec,
    uniforms: Record<string, Uniform>,
    material = new THREE.MeshStandardMaterial(),
): THREE.MeshStandardMaterial {
    return injectInShader(
        material,
        { decl: shader.vs.decl, impl: shader.vs.impl },
        { decl: shader.fs.decl, impl: shader.fs.impl },
        uniforms,
    )
}

interface ShaderInjection { decl?: string; impl?: string; }
function injectInShader<Mat extends THREE.Material>(
    material: Mat,
    vertex: ShaderInjection,
    fragment: ShaderInjection,
    uniforms: Uniforms,
): Mat {
    material.onBeforeCompile = shader => {
        for (const [name, value] of Object.entries(uniforms))
            shader.uniforms[name] = value;

        shader.vertexShader = inject(
            vertex.decl || '', vertex.impl || '',
            shader.vertexShader, `#include <begin_vertex>`,
        );

        shader.fragmentShader = inject(
            fragment.decl || '', fragment.impl || '',
            shader.fragmentShader, '#include <color_fragment>',
        );

        material.userData.shader = shader;
    };
    return material;
}

function inject(prelude: string, content: string, shader: string, marker: string): string {
    return prelude + '\n' + shader.replace(marker, marker + '\n' + content);
}
