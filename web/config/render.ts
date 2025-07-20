import * as THREE from 'three';
import { Panel } from '../gui/gui.js';
import { createHexagonMesh, createSquareMesh, createSurfaceMesh } from '../mesh.js';
import { palettes } from '../palettes.js';
import type { HeightGenerator } from '../height-generator.js';
import { CHUNK_UNIT } from '../constants.js';

interface LightConfig {
    ambient: { intensity: number };
    directional: { intensity: number };
}

type RenderStyle = 'surface' | 'quadPrism' | 'hexPrism';

export class RenderConfig {
    style: RenderStyle;
    paletteName: string;
    light: LightConfig;
    heightMultiplier: number = 1; // Multiplier for the terrain height.

    constructor() {
        this.style = 'surface';              // How the terrain is rendered.
        this.paletteName = 'Bright terrain'; // Name of the color palette to use.
        this.light = {
            ambient: { intensity: .5 },
            directional: { intensity: 4 },
        }
    }

    ui(parent: Panel, regen: () => void, rerender: () => void): void {
        parent.select(this, 'style', {
            'Surface': 'surface',
            'Squares': 'quadPrism',
            'Hexagons': 'hexPrism',
        }).legend('Shape').onChange(regen);

        parent.select(this, 'paletteName', palettes)
            .legend('Palette').onChange(regen);

        parent.range(this.light.ambient, 'intensity', 0, 10, .2)
            .legend('Ambient Light').onChange(rerender);

        parent.range(this.light.directional, 'intensity', 0, 10, .2)
            .legend('Directional Light').onChange(rerender);

        parent.range(this, 'heightMultiplier', 0.1, 5.0, 0.05)
            .legend('Height multiplier')
            .onInput(rerender);
    }

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
