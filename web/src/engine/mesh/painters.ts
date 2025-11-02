import * as THREE from 'three';
import { KeyCache, Recycler } from '../../utils/reuse.js';
import { Palette } from '../palettes.js';
import { paletteShader } from './shaders.js';
import { GeometryStyle } from './weavers.js';

export type PainterStyle = 'Palette';
interface Renderer {
    geometryStyle: GeometryStyle,
    painterStyle: PainterStyle;
    palette: Palette;
    paletteName: string;
    texturePath: string;
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
    texloader = new THREE.TextureLoader();
    private cache = new KeyCache<string, THREE.Material>(
        () => paletteShader(this.renderer.palette, this.loadtex(this.texturePath)),
    );

    paint(): THREE.Material {
        return this.cache.value(`p: ${this.renderer.paletteName} t: ${this.texturePath}`);
    }

    private loadtex(path: string): THREE.Texture | null {
        if (!path) return null;
        const tex = this.texloader.load(path);
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
    }

    /**
     * Returns the texture path only when using a surface geometry style.
     * The other styles have no support for textures.
     */
    private get texturePath(): string {
        if (this.renderer.geometryStyle === 'Surface') return this.renderer.texturePath;
        return '';
    }
}

