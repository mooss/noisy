import { CHUNK_HEIGHT_DENOMINATOR } from "../../config/constants.js";
import { fracpart, lerp, smoothunit } from "../maths/maths.js";
import { ChunkState } from "../state/chunk.js";
import { register } from "../state/state.js";
import { AlgoPicker } from "./containers.js";
import { NoiseClass, NoiseFun, NoiseMakerBase, NoiseMakerI } from "./foundations.js";

function quantize(value: number, delta: number) {
    return delta * Math.floor(value / delta + .5);
}
function terrace(value: number, steps: number) {
    return Math.round(value * (steps - 1)) / steps;
}

////////////////////
// Noise wrappers //

// Applies pre-processing and/or post-processing to a noise algorithm.
// Meant to be used as part of a NoisePipeline, otherwise the wrapped noise must be set manually and
// it will anyway not encode/decode properly.
abstract class NoiseWrapper<Params = any> extends NoiseMakerBase<Params> {
    wrapped: NoiseMakerI;
    get low(): number { return this.wrapped.low }
    get high(): number { return this.wrapped.high }
    recompute(): void { this.wrapped.recompute() }
}

export class IdentityWrapper extends NoiseWrapper {
    get class(): NoiseClass { return 'Identity' }
    make() { return this.wrapped.make() }
}
register('Identity', IdentityWrapper);

//TIP: terracing Adds steps in the terrain, creating terraces.
//TIP: terracing_constant Use the same amount of terraces everywhere. \nCreates a blocky terrain with evenly-spaced terrain.
interface TerracingP {
    //TIP: terracing_steps Number of terraces used in the terrain. \nMore terraces will create a smoother terrain.
    steps: number;
}
export class Terracing extends NoiseWrapper<TerracingP> {
    get class(): NoiseClass { return 'Terracing' }
    make(): NoiseFun {
        const fun = this.wrapped.make();
        if (this.p.steps == 0) return fun;
        return (x, y) => terrace(fun(x, y), this.p.steps);
    }
}
register('Terracing', Terracing);

//TIP: terracing_voxels Make the number of terraces proportional to the chunk resolution. \nCreates square blocks reminiscent of Minecraft.
interface VoxelTerracingP {
    chunks: ChunkState;
}
export class VoxelTerracing extends NoiseWrapper<VoxelTerracingP> {
    get class(): NoiseClass { return 'VoxelTerracing' }
    make(): NoiseFun {
        const fun = this.wrapped.make();
        const range = (this.high - this.low);
        const delta = range / this.p.chunks.nblocks * CHUNK_HEIGHT_DENOMINATOR;
        return (x, y) => quantize(fun(x, y), delta);
    }
}
register('VoxelTerracing', VoxelTerracing);

//TIP: warping Distorts the coordinates to hide straight lines in the terrain, introducing vortex-like perturbations.
interface WarpingP {
    //TIP: warping_frequency Scale factor for the warping coordinates, dictating how dense the warping is. \nHigher values will make the warping effect repeat more frequently, making the effect more visible.
    frequency: number;

    //TIP: warping_strength How much the warping effect distorts the coordinates. \nHigher values will make the terrain more swirly, making the effect more visible.
    strength: number;

    //TIP: warper Noise dictating the magnitude of the warping effect.
    warper: NoiseMakerI;
}
export class Warping extends NoiseWrapper<WarpingP> {
    get class(): NoiseClass { return 'Warping' }

    make(): NoiseFun {
        const fun = this.wrapped.make();
        if (this.p.strength == 0) return fun;
        const warp = this.p.warper.normalised(0, 1);
        return (x, y) => {
            const xoff = warp(x * this.p.frequency, y * this.p.frequency) * this.p.strength;
            // Using a different y offset computed at a different location reduces linear artifacts
            // visible near the origin.
            const yoff = warp(x * this.p.frequency, y * this.p.frequency + 100) * this.p.strength;
            return fun(x + xoff, y + yoff);
        }
    }

    recompute(): void {
        this.wrapped.recompute();
        this.p.warper.recompute();
    }
}
register('Warping', Warping);

//TIP: clustering Groups neighboring coordinates together to form chunks of uniform height. \nCreates shapes looking like continents, camouflage pattern or biomes.
interface ClusteringP {
    //TIP: clustering_coorscale Multiplier for the tile coordinates, dictates the tile density. \nHigher values will result in more tiles packed into a chunk.
    coorscale: number;

    //TIP: clustering_enabled Toggles clustering on or off.
    enabled: boolean;

    //TIP: clustering_noisescale Magnitude of the distortion applied to each tile. \nHigher values will make the tiles less square and more chaotic.
    noisescale: number;
}
export class Clustering extends NoiseWrapper<ClusteringP> {
    get class(): NoiseClass { return 'Clustering' }
    make(): NoiseFun {
        const fun = this.wrapped.normalised(0, 1);
        if (!this.p.enabled) return fun;
        return (x, y) => {
            const raw = fun(x, y);
            x = this.p.coorscale * x + this.p.noisescale * raw;
            y = this.p.coorscale * y + this.p.noisescale * fun(x + 10, y);
            return fun(Math.round(x), Math.round(y));
        }
    }
    get low() { return 0; }
    get high() { return 1; }
}
register('Clustering', Clustering);

//TIP: tiling Transform the noise into a repeating texture.
//TIP: tiling_none No tiling, use the noise as-is.

//TIP: tiling_quad Interpolates between four points. \nCreates a seamless texture that somewhat preserves the noise pattern without mirroring.
export class QuadTiling extends NoiseWrapper {
    get class(): NoiseClass { return 'QuadTiling' }
    make(): NoiseFun {
        const fun = this.wrapped.make();
        return (x: number, y: number) => {
            x = fracpart(x);
            y = fracpart(y);

            const xfactor = smoothunit(x); // Smooth horizontal proportion.
            const yfactor = smoothunit(y); // Smooth vertical proportion.

            const topleft = fun(x, y);
            const topright = fun(x - 1, y);
            const bottomleft = fun(x, y - 1);
            const bottomright = fun(x - 1, y - 1);

            // Horizontal interpolation.
            const tophoz = lerp(topleft, topright, xfactor);
            const bottomhoz = lerp(bottomleft, bottomright, xfactor);

            // Vertical interpolation.
            return lerp(tophoz, bottomhoz, yfactor);
        }
    }

    // Those high and low values were obtained experimentally, they are enough to somewhat
    // consistently "stabilize" the height, but their reliability changes depending on the
    // characteristics of the wrapped algorithm.
    // Simplex is too low, whereas continental mix is too high.
    //
    // The only reason why they work right now is that the wrapped noises (comix, simplex and ridge)
    // already (somewhat) guarantee being between 0 and 1.
    // This general unreliability might be avoided by simply always statistically computing the
    // bounds at the top level instead of trying to propagate the computations down the chain of
    // noises.
    get low(): number { return this.wrapped.low + .15 }
    get high(): number { return this.wrapped.high - .1 }
}
register('QuadTiling', QuadTiling);

//TIP: tiling_sine Use the sine function to transform the coordinates. \nCreate a seamless mirrored texture with very obvious circular artifacts.
export class SineTiling extends NoiseWrapper {
    get class(): NoiseClass { return 'SineTiling' }
    make(): NoiseFun {
        const fun = this.wrapped.make();
        return (x, y) => {
            return fun(Math.sin(x * Math.PI), Math.sin(y * Math.PI));
        }
    }
}
register('SineTiling', SineTiling);

interface MirroredTilingP {
    //TIP: tilling_mirrored_fraction_x Force a repetition along the horizontal axis instead of infinite mirroring.
    normalizeX: boolean;
    //TIP: tilling_mirrored_fraction_y Force a repetition along the vertical axis instead of infinite mirroring.
    normalizeY: boolean;
}
//TIP: tiling_mirrored Mirror the x and y coordinates. \nCreate a seamless mirrored texture.
export class MirroredTiling extends NoiseWrapper<MirroredTilingP> {
    get class(): NoiseClass { return 'MirroredTiling' }
    make(): NoiseFun {
        const fun = this.wrapped.make();
        return (x, y) => {
            if (this.p.normalizeX) x = fracpart(x);
            if (this.p.normalizeY) y = fracpart(y);
            x = x > .5 ? 1 - x : x;
            y = y > .5 ? 1 - y : y;
            return fun(x, y);
        }
    }
}
register('MirroredTiling', MirroredTiling);

////////////////////
// Noise pipeline //

interface NoisePipelineP {
    pipeline: NoiseWrapper[];
    base: NoiseMakerI;
}
export class NoisePipeline extends NoiseMakerBase<NoisePipelineP> {
    assembled: NoiseMakerI;
    constructor(params: NoisePipelineP) {
        super(params);
        this.assembled = this.p.base;
        for (const wrapper of this.p.pipeline) {
            wrapper.wrapped = this.assembled;
            this.assembled = wrapper;
        }
    }

    recompute(): void { this.assembled.recompute() }
    class: NoiseClass = 'NoisePipeline';
    make(): NoiseFun { return this.assembled.make() }
    get low(): number { return this.assembled.low }
    get high(): number { return this.assembled.high }
}
register('NoisePipeline', NoisePipeline);

/////////////////////
// Pipeline picker //

export class PipelinePicker extends AlgoPicker<NoiseWrapper> {
    wrapped: NoiseMakerI;
    get algorithm(): NoiseWrapper {
        const res = super.algorithm;
        res.wrapped = this.wrapped;
        return res;
    }
    set algorithm(algo: string) { this.p.current = algo }
    get class(): NoiseClass { return 'PipelinePicker' };
}
register('PipelinePicker', PipelinePicker);
