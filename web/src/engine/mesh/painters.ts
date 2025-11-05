import * as THREE from 'three';
import { KeyCache, Recycler } from '../../utils/reuse.js';
import { Palette } from '../palettes.js';
import { paletteShader } from './shaders.js';
import { GeometryStyle } from './weavers.js';

export type PainterStyle = 'Palette';
interface Parameters {
    geometryStyle: GeometryStyle,
    painterStyle: PainterStyle;
    paletteName: string;
    palette: Palette;
    colorLowShift: number;
    colorHighShift: number;
    texturePath: string;
}

export class ReusablePainter {
    constructor(private params: Parameters) { }
    private cache = new Recycler<PainterStyle, Painter, []>({
        Palette: () => new PalettePainter(this.params),
    });

    paint(): THREE.Material {
        return this.cache.ensure(this.params.painterStyle).paint();
    }
}

/** Material builder. */
export interface Painter {
    paint(): THREE.Material;
}

/** Creates material from a palette, reuses the material when the palette stays the same. */
export class PalettePainter {
    constructor(private renderer: Parameters) { }
    texloader = new THREE.TextureLoader();
    private cache = new KeyCache<string, THREE.MeshStandardMaterial>(
        () => this.mkshader(),
    );

    paint(): THREE.Material {
        return this.cache.value(this.cacheKey);
    }

    // When this value change, it means that the material has been invalidated and needs to be rebuilt.
    private get cacheKey(): string {
        return ['paletteName', 'texturePath', 'colorLowShift', 'colorHighShift']
            .map((key: string) => this.renderer[key])
            .join(' !! ');
    }

    private mkshader(): THREE.MeshStandardMaterial {
        return paletteShader(
            this.renderer.palette,
            this.loadtex(this.texturePath),
            {
                'u_colorLowShift': { value: this.renderer.colorLowShift, type: 'f' },
                'u_colorHighShift': { value: this.renderer.colorHighShift, type: 'f' },
            },
        );
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

