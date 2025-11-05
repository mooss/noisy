import { CHUNK_HEIGHT_DENOMINATOR, CHUNK_UNIT } from '../../config/constants.js';
import { PainterStyle } from '../engine/mesh/painters.js';
import { GeometryStyle } from '../engine/mesh/weavers.js';
import { Palette, palettes } from '../engine/palettes.js';
import { Panel } from '../gui/gui.js';
import { tips } from '../ui/tips.js';
import { AutoAssign } from '../utils/objects.js';
import { GameCallbacks, register } from './state.js';

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

    declare light: LightConfig;

    //TIP: height_multiplier Multiplier applied to the terrain height. \nSet to zero to display a flat terrain.
    declare heightMultiplier: number;

    //TIP: render_texture Texture applied to the terrain. Only compatible with the surface geometry style.
    declare texturePath: string;
}

export class RenderState extends RenderStateP {
    class(): string { return 'RenderState' };
    get palette(): Palette { return palettes[this.paletteName] }

    get verticalUnit(): number {
        return (CHUNK_UNIT / CHUNK_HEIGHT_DENOMINATOR) * this.heightMultiplier;
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
        .label('Shape')
        .onChange(cb.terrain.recompute)
        .tooltip(tips.render_geometry);

    root.array(state, 'paletteName', Object.keys(palettes))
        .label('Palette')
        .onChange(cb.terrain.recompute)
        .tooltip(tips.render_palette);

    const texmap: Record<string, string> = {
        'None': '',
        'Cobbly': 'https://mooss.github.io/noisy/textures/cobbly.png',
        'Foggy': 'https://mooss.github.io/noisy/textures/foggy.png',
    }
    root.map(state, 'texturePath', texmap)
        .label('Texture')
        .onChange(cb.terrain.recompute)
        .tooltip(tips.render_texture);

    root.range(state, 'colorLowShift', -1, 1, .01)
        .label('Low color shift')
        .onInput(cb.render.uniform('u_colorLowShift'))
        .tooltip(tips.color_low_shift);

    root.range(state, 'colorHighShift', -1, 1, .01)
        .label('High color shift')
        .onInput(cb.render.uniform('u_colorHighShift'))
        .tooltip(tips.color_high_shift);

    root.range(state, 'heightMultiplier', 0, 5.0, 0.02)
        .label('Height multiplier')
        .onInput(cb.render.update)
        .tooltip(tips.height_multiplier);

    root.range(state.light.ambient, 'intensity', 0, 10, .2)
        .label('Ambient light')
        .onInput(cb.render.update)
        .tooltip(tips.light_ambient);

    root.range(state.light.directional, 'intensity', 0, 10, .2)
        .label('Directional light')
        .onInput(cb.render.update)
        .tooltip(tips.light_directional);
}
