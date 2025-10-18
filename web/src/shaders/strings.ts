export const shaders = {
    vs_palette_decl: 'varying float v_z;',
    vs_palette_impl: 'v_z = position.z;',
    fs_palette_decl: 'uniform sampler2D u_palette;\nuniform float u_paletteWidth;\nvarying float v_z;',
    fs_palette_impl: 'vec2 colorIdx = vec2(mix(0.5 / u_paletteWidth, 1.0 - 0.5 / u_paletteWidth, v_z), 0.5);\ndiffuseColor.rgb = texture2D(u_palette, colorIdx).rgb;',
};