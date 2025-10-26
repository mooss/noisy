import * as THREE from 'three';
import { NoiseFun } from '../../noise/foundations.js';
import { Palette } from '../palettes.js';
import { fillSurfaceHeights } from './materials.js';
import { paletteShader } from './shaders.js';
import { Recycler, ReusableArray } from './utils.js';
import { GeometryStyle } from './weavers.js';

export type PainterStyle = 'Palette';
interface Renderer {
    painterStyle: PainterStyle;
    geometryStyle: GeometryStyle;
    palette: Palette;
    paletteName: string;
}

export class ReusablePainter {
    constructor(
        private renderer: Renderer,
    ) { }

    private painter = new Recycler<PainterStyle, Painter, []>({
        Palette: () => new PalettePainter(this.renderer),
    });

    // Only MappedSurface requires post-processing and is cached to reuse the height array.
    private _previousStyle: GeometryStyle;
    private _postProcess: MaterialPostProcess;
    private postProcessor(fun: NoiseFun, resolution: number): MaterialPostProcess {
        const now = this.renderer.geometryStyle, then = this._previousStyle;
        if (now != then || then === undefined) {
            if (now === 'MappedSurface') // From * to MappedSurface.
                this._postProcess = new MappedPostProcess(fun, resolution);
            else // From MappedSurface to *.
                this._postProcess = new NoOpPostProcess();
        }
        return this._postProcess;
    }

    paint(fun: NoiseFun, resolution: number): THREE.MeshStandardMaterial {
        const res = this.painter.ensure(this.renderer.painterStyle).paint();
        return this.postProcessor(fun, resolution).process(res);
    }
}

//////////////
// Painters //

/** Material builder. */
interface Painter {
    paint(): THREE.MeshStandardMaterial;
    renderer: Renderer;
}

/** Creates material from a palette, reuses the material when the palette stays the same. */
class PalettePainter {
    constructor(public renderer: Renderer) { }
    paint(): THREE.MeshStandardMaterial {
        return paletteShader(this.renderer.palette)
    }
}

//////////////////////////////
// Material post-processing //

interface MaterialPostProcess {
    process(mesh: THREE.MeshStandardMaterial): THREE.MeshStandardMaterial;
}

class NoOpPostProcess {
    process(mesh: THREE.MeshStandardMaterial): THREE.MeshStandardMaterial { return mesh }
}

class MappedPostProcess {
    private paddedHeightCache = new ReusableArray();
    private displacementHeightCache = new ReusableArray();
    constructor(private fun: NoiseFun, private resolution: number) { }

    process(mesh: THREE.MeshStandardMaterial): THREE.MeshStandardMaterial {
        fillSurfaceHeights(
            this.displacementHeightCache, this.paddedHeightCache,
            this.fun, this.resolution,
        );

        mesh.displacementMap = new THREE.DataTexture(
            this.displacementHeightCache.array,
            this.resolution + 1, this.resolution + 1,
            THREE.RedFormat, THREE.FloatType,
        );
        mesh.displacementMap.needsUpdate = true;
        mesh.displacementScale = 1;

        return mesh;
    }
}
