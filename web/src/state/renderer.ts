import { CHUNK_HEIGHT_DENOMINATOR, CHUNK_UNIT } from '../../config/constants.js';
import { PainterStyle } from '../engine/mesh/painters.js';
import { GeometryStyle } from '../engine/mesh/weavers.js';
import { Palette, palettes } from '../engine/palettes.js';
import { Panel } from '../gui/panels/panel.js';
import { tips } from '../ui/tips.js';
import { AutoAssign } from '../utils/objects.js';
import { GameCallbacks, register } from './state.js';



export const textures = {
    None: '',
    Cobbly: 'https://mooss.github.io/noisy/textures/cobbly.png',
    Foggy: 'https://mooss.github.io/noisy/textures/foggy.png',
};

interface LightConfig {
    //TIP: light_ambient Ambient light intensity.
    ambient: { intensity: number };

    //TIP: light_directional Directional light intensity.
    directional: { intensity: number };
}

class RenderStateP extends AutoAssign<RenderStateP> {
    //TIP: render_geometry Fundamental shape the terrain is made of.
    declare geometryStyle: GeometryStyle;

    //TIP: render_painter How the terrain will be rendered.
    declare painterStyle: PainterStyle;

    //TIP: render_palette Color palette of the terrain.
    declare paletteName: string;

    //TIP: color_low_shift Adjustement to the mapping between low heights and color. \nHigher values will shift the colors of the low heights upwards.
    declare colorLowShift: number;

    //TIP: color_high_shift Adjustement to the mapping between high heights and color. \nHigher values will shift the colors of the high heights downwards.
    declare colorHighShift: number;

    //TIP: color_slope How much the terrain slope modifies the color. \nHigher values makes the color shift upwards in the palette when the terrain slope is more pronounced.
    declare _colorSlope: number;

    declare light: LightConfig;

    //TIP: height_multiplier Multiplier applied to the terrain height. \nSet to zero to display a flat terrain.
    declare heightMultiplier: number;

    //TIP: render_texture Texture applied to the terrain. Only compatible with the surface geometry style.
    declare texturePath: string;

    //TIP: render_texture_repeat Number of time that the texture repeats on the X and Y axis.
    declare textureRepeat: number;

    //TIP: render_texture_bump_scale Apply the texture as a bump map.
    declare textureBumpScale: number;
}

export class RenderState extends RenderStateP {
    class(): string { return 'RenderState' };
    get palette(): Palette { return palettes[this.paletteName] }

    get verticalUnit(): number {
        return (CHUNK_UNIT / CHUNK_HEIGHT_DENOMINATOR) * this.heightMultiplier;
    }

    get colorSlope(): number {
        // This parameter only makes sense for surface geometry because it is linked to the
        // steepness of the terrain (and therefore only works with proper normals).
        return this.geometryStyle === 'Surface' ? this._colorSlope : 0;
    }
}
register('RenderState', RenderState);

export function renderUI(state: RenderState, root: Panel, cb: GameCallbacks) {
    const geomap: Record<string, GeometryStyle> = {
        'Surface': 'Surface',
        'Boxes': 'Box',
        'Pixels': 'Pixel',
    };
    root.map(state, 'geometryStyle', geomap)
        .label('Geometry')
        .onChange(cb.terrain.recompute)
        .tooltip(tips.render_geometry);

    const deck = root.deck();

    ////////////
    // Colors //
    const colors = deck.card('Colors');

    colors.array(state, 'paletteName', Object.keys(palettes))
        .label('Palette')
        .onChange(cb.terrain.repaint)
        .tooltip(tips.render_palette);

    colors.range(state, 'colorLowShift', -1, 1, .01)
        .label('Low color shift')
        .onInput(cb.terrain.repaint)
        .tooltip(tips.color_low_shift);

    colors.range(state, 'colorHighShift', -1, 1, .01)
        .label('High color shift')
        .onInput(cb.terrain.repaint)
        .tooltip(tips.color_high_shift);

    colors.range(state, '_colorSlope', 0, 5, .2)
        .label('Color slope')
        .onInput(cb.terrain.repaint)
        .tooltip(tips.color_slope);

    //////////////
    // Textures //
    const texs = deck.card('Textures');

    texs.map(state, 'texturePath', textures)
        .label('Texture')
        .onChange(cb.terrain.recompute)
        .tooltip(tips.render_texture);

    texs.range(state, 'textureRepeat', 1, 10, 1)
        .label('Repeat')
        .onInput(cb.terrain.repaint)
        .tooltip(tips.render_texture_repeat);

    texs.range(state, 'textureBumpScale', 0, 20, 0.5)
        .label('Texture bump scale')
        .onInput(cb.terrain.repaint)
        .tooltip(tips.render_texture_bump_scale);

    //////////////
    // Lighting //
    const lighting = deck.card('Lighting & Scale');

    lighting.range(state.light.ambient, 'intensity', 0, 10, .2)
        .label('Ambient light')
        .onInput(cb.render.update)
        .tooltip(tips.light_ambient);

    lighting.range(state.light.directional, 'intensity', 0, 10, .2)
        .label('Directional light')
        .onInput(cb.render.update)
        .tooltip(tips.light_directional);

    lighting.range(state, 'heightMultiplier', 0, 5.0, 0.02)
        .label('Height multiplier')
        .onInput(cb.render.update)
        .tooltip(tips.height_multiplier);
}
