import { register } from "../state/state.js";
import { AlgoPicker } from "./containers.js";
import { NoiseClass, NoiseFun, NoiseMakerBase, NoiseMakerI } from "./foundations.js";

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
        return (x, y) => Math.round(fun(x, y) * (this.p.steps-1)) / this.p.steps;
    }
}
register('Terracing', Terracing);

//TIP: terracing_noisy Use a different amount of terraces in different places. \nCreates a stepped and wobbly surface that increases in wobbleliness when the difference between the minimum and the maximum of terraces increases.
interface NoisyTerracingP {
    //TIP: noisy_terrace_min Minimum number of terraces used in the terrain. \nMore terraces will create smoother terrain.
    min: number;

    //TIP: noisy_terrace_max Maximum number of terraces used in the terrain. \nMore terraces will create smoother terrain.
    max: number;

    //TIP: noisy_terracer Noise dictating how many terraces will be used at a given point, normalized between min and max.
    terracer: NoiseMakerI;
}
export class NoisyTerracing extends NoiseWrapper<NoisyTerracingP> {
    get class(): NoiseClass { return 'NoisyTerracing' }
    make(): NoiseFun {
        const fun = this.wrapped.make();
        const min = this.p.min; const max = this.p.max;
        if (min == 0 && max == 0) return fun;

        let interval: (x: number, y: number) => number;
        interval = () => min;
        if (max > min) interval = this.p.terracer.normalised(min, max);

        return (x, y) => {
            const step = interval(x, y);
            return Math.round(fun(x, y) * step) / step
        };
    }
}
register('NoisyTerracing', NoisyTerracing);

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

//TIP: tiling Groups neighboring coordinates together to form chunks of uniform height. \nCreates shapes looking like continents, camouflage pattern or biomes.
interface TilingP {
    //TIP: tiling_coorscale Multiplier for the tile coordinates, dictates the tile density. \nHigher values will result in more tiles packed into a chunk.
    coorscale: number;

    //TIP: tiling_enabled Toggles tiling on or off.
    enabled: boolean;

    //TIP: tiling_noisescale Magnitude of the distortion applied to each tile. \nHigher values will make the tiles less square and more chaotic.
    noisescale: number;
}
export class Tiling extends NoiseWrapper<TilingP> {
    get class(): NoiseClass { return 'Tiling' }
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
register('Tiling', Tiling)

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
