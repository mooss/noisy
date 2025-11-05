// This file contains shader implementations extracted from //web/src/shaders/literate.org, modifications must therefore be made there.
// See //web/Makefile to regenerate this file.

export const shaders = {
    palette: {
        vs: {
            decl: 'varying float v_z;',
            impl: 'v_z = position.z;',
        },
        fs: {
            decl: 'uniform sampler2D u_palette;\nuniform float u_paletteWidth;\nuniform float u_colorLowShift;\nuniform float u_colorHighShift;\nvarying float v_z;\n\nfloat shiftedColor() { return mix(u_colorLowShift, 1.0 + u_colorHighShift, v_z); }',
            impl: 'vec2 colorIdx = vec2(mix(0.5 / u_paletteWidth, 1.0 - 0.5 / u_paletteWidth, shiftedColor()), 0.5);\n#ifdef USE_MAP // Mix color and texture pattern.\ndiffuseColor.rgb *= texture2D(u_palette, colorIdx).rgb;\n#else // Use flat color.\ndiffuseColor.rgb = texture2D(u_palette, colorIdx).rgb;\n#endif',
        },
    },
};
