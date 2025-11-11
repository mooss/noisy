// This file contains shader implementations extracted from //web/src/shaders/literate.org, modifications must therefore be made there.
// See //web/Makefile to regenerate this file.

export const shaders = {
    palette: {
        vs: {
            decl: 'varying float v_z;\nvarying vec3 v_normal;',
            impl: 'v_z = position.z;\nv_normal = normal;',
        },
        fs: {
            decl: 'uniform sampler2D u_palette;\nuniform float u_paletteWidth;\nuniform float u_colorLowShift;\nuniform float u_colorHighShift;\nuniform float u_colorSlope;\nvarying float v_z;\nvarying vec3 v_normal;\n\nfloat steepness() {\n  return (1.0 - v_normal.z);\n}\nfloat shiftedColor(float height) {\n  return mix(u_colorLowShift, 1.0 + u_colorHighShift, height);\n}',
            impl: 'float height = v_z + steepness() * u_colorSlope * 100.0;\nvec2 colorIdx = vec2(mix(0.5 / u_paletteWidth, 1.0 - 0.5 / u_paletteWidth, shiftedColor(height)), 0.5);\n\n#ifdef USE_MAP // Mix color and texture pattern.\ndiffuseColor.rgb *= texture2D(u_palette, colorIdx).rgb;\n#else // Use flat color.\ndiffuseColor.rgb = texture2D(u_palette, colorIdx).rgb;\n#endif',
        },
    },
};
