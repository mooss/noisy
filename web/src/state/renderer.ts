import * as THREE from 'three';
import { CHUNK_HEIGHT_DENOMINATOR, CHUNK_UNIT } from '../../config/constants.js';
import { CachedMesher, MeshStyle } from '../engine/mesh/mesher.js';
import { paletteShader } from '../engine/mesh/shaders.js';
import { Palette, palettes } from '../engine/palettes.js';
import { Panel } from '../gui/gui.js';
import { HeightGenerator } from '../noise/noise.js';
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
    //TIP: render_style Fundamental shape the terrain is made of.
    declare style: MeshStyle;

    //TIP: render_palette Color palette of the terrain.
    declare paletteName: string;

    declare light: LightConfig;

    //TIP: height_multiplier Multiplier applied to the terrain height. Set to zero to display flat terrain.
    declare heightMultiplier: number;
}

export class RenderState extends RenderStateP {
    class(): string { return 'RenderState' };
    get verticalUnit(): number { return (CHUNK_UNIT / CHUNK_HEIGHT_DENOMINATOR) * this.heightMultiplier }
    get palette(): Palette { return palettes[this.paletteName] }

    mesh(heights: HeightGenerator): THREE.Mesh {
        return new CachedMesher().weave(this.style, heights.at, heights.nblocks, paletteShader(this.palette));
    }
}
register('RenderState', RenderState);

export function renderUI(state: RenderState, root: Panel, cb: GameCallbacks) {
    root.map(state, 'style', {
        'Surface': 'Surface',
        'Boxes': 'Box',
    })
        .label('Shape')
        .onChange(cb.terrain.recompute)
        .tooltip(tips.render_style);

    root.array(state, 'paletteName', Object.keys(palettes))
        .label('Palette')
        .onChange(cb.terrain.recompute)
        .tooltip(tips.render_palette);

    root.range(state.light.ambient, 'intensity', 0, 10, .2)
        .label('Ambient light')
        .onInput(cb.render.update)
        .tooltip(tips.light_ambient);

    root.range(state.light.directional, 'intensity', 0, 10, .2)
        .label('Directional light')
        .onInput(cb.render.update)
        .tooltip(tips.light_directional);

    root.range(state, 'heightMultiplier', 0, 5.0, 0.02)
        .label('Height multiplier')
        .onInput(cb.render.update)
        .tooltip(tips.height_multiplier);
}
