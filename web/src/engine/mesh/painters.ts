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
    textureRepeat: number;
    textureBumpScale: number;
}

export class ReusablePainter {
    constructor(private params: Parameters) { }
    private cache = new Recycler<PainterStyle, Painter, []>({
        Palette: () => new PalettePainter(this.params),
    });

    paint(): THREE.MeshStandardMaterial {
        return this.cache.ensure(this.params.painterStyle).paint();
    }
}

/** Material builder. */
export interface Painter {
    paint(): THREE.MeshStandardMaterial;
}

/** Creates material from a palette, reuses the material when the palette stays the same. */
export class PalettePainter {
    constructor(private params: Parameters) { }
    texloader = new THREE.TextureLoader();
    private cache = new KeyCache<string, THREE.MeshStandardMaterial>(
        () => this.mkshader(),
    );

    paint(): THREE.MeshStandardMaterial {
        return this.cache.value(this.cacheKey);
    }

    // When this value change, it means that the material has been invalidated and needs to be rebuilt.
    private get cacheKey(): string {
        const keys = [
            'paletteName', 'texturePath', 'colorLowShift', 'colorHighShift', 'textureRepeat',
            'textureBump', 'textureBumpScale',
        ];
        return keys
            .map((key: string) => this.params[key])
            .join(' !! ');
    }

    private mkshader(): THREE.MeshStandardMaterial {
        const tex = this.loadtex(this.texturePath);
        const res = paletteShader(
            this.params.palette,
            tex,
            {
                'u_colorLowShift': { value: this.params.colorLowShift, type: 'f' },
                'u_colorHighShift': { value: this.params.colorHighShift, type: 'f' },
            },
        );

        if (this.params.textureBumpScale) {
            res.bumpMap = tex;
            res.bumpScale = this.params.textureBumpScale;
        }

        return res;
    }

    private loadtex(path: string): THREE.Texture | null {
        if (!path) return null;
        const tex = this.texloader.load(path);
        tex.colorSpace = THREE.SRGBColorSpace;

        const rep = this.params.textureRepeat;
        tex.repeat.x = rep;
        tex.repeat.y = rep;
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;

        return tex;
    }

    /**
     * Returns the texture path only when using a surface geometry style.
     * The other styles have no support for textures.
     */
    private get texturePath(): string {
        if (this.params.geometryStyle === 'Surface') return this.params.texturePath;
        return '';
    }
}

