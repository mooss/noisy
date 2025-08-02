import * as THREE from 'three';
import { CHUNK_UNIT } from '../constants.js';
import { Panel } from '../gui/gui.js';
import type { HeightGenerator } from '../height-generator.js';
import { createHexagonMesh, createSquareMesh, createSurfaceMesh } from '../mesh.js';
import { palettes } from '../palettes.js';
import { AutoAssign } from '../utils/objects.js';
import { GameCallbacks, register } from './state.js';

interface LightConfig {
    ambient: { intensity: number };
    directional: { intensity: number };
}

type RenderStyle = 'surface' | 'quadPrism' | 'hexPrism';

class RenderStateP extends AutoAssign<RenderStateP> {
    declare style: RenderStyle;
    declare paletteName: string;
    declare light: LightConfig;
    declare heightMultiplier: number;
}

export class RenderState extends RenderStateP {
    class(): string { return 'RenderState' };
    get verticalUnit(): number { return (CHUNK_UNIT / 5) * this.heightMultiplier }
    get palette(): THREE.Color[] { return palettes[this.paletteName] }

    mesh(heights: HeightGenerator): THREE.Mesh {
        switch (this.style) {
            case 'hexPrism':
                return createHexagonMesh(heights, this.palette);
            case 'quadPrism':
                return createSquareMesh(heights, this.palette);
            case 'surface':
                return createSurfaceMesh(heights, this.palette);
        }
    }
}
register('RenderState', RenderState);

export function renderUI(state: RenderState, root: Panel, cb: GameCallbacks) {
    root.select(state, 'style', {
        'Surface': 'surface',
        'Squares': 'quadPrism',
        // 'Hexagons': 'hexPrism', //TODO: decide whether to fix or remove it.
    }).label('Shape').onChange(cb.terrain.recompute);

    root.select(state, 'paletteName', palettes)
        .label('Palette').onChange(cb.terrain.recompute);

    root.range(state.light.ambient, 'intensity', 0, 10, .2)
        .label('Ambient light').onChange(cb.render.update);

    root.range(state.light.directional, 'intensity', 0, 10, .2)
        .label('Directional light').onChange(cb.render.update);

    root.range(state, 'heightMultiplier', 0, 5.0, 0.02)
        .label('Height multiplier')
        .onInput(cb.render.update);
}
