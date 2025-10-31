import * as THREE from 'three';
import { Palette } from '../palettes.js';
import { paletteShader } from './shaders.js';
import { KeyCache, Recycler } from './utils.js';

export type PainterStyle = 'Palette';
interface Renderer {
    painterStyle: PainterStyle;
    palette: Palette;
}

export class ReusablePainter {
    constructor(private renderer: Renderer) { }
    private cache = new Recycler<PainterStyle, Painter, []>({
        Palette: () => new PalettePainter(this.renderer),
    });

    paint(): THREE.Material {
        return this.cache.ensure(this.renderer.painterStyle).paint();
    }
}

/** Material builder. */
export interface Painter {
    paint(): THREE.Material;
}

/** Creates material from a palette, reuses the material when the palette stays the same. */
export class PalettePainter {
    constructor(private renderer: Renderer) { }
    private cache = new KeyCache<string, THREE.Material>(
        () => paletteShader(this.renderer.palette),
    );

    paint(): THREE.Material {
        return this.cache.value(this.renderer.paletteName);
    }
}

