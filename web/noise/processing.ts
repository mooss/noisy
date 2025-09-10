import { register } from "../state/state.js";
import { NoiseClass, NoiseFun, NoiseMakerBase, NoiseMakerI } from "./foundations.js";

interface NoiseWrapperP { wrapped?: NoiseMakerI }
abstract class NoiseWrapper<Params = any>
    extends NoiseMakerBase<Params & NoiseWrapperP> {
    get low(): number { return this.p.wrapped.low }
    get high(): number { return this.p.wrapped.high }
    recompute(): void { this.p.wrapped.recompute() }
}

//TIP: terracing Adds steps in the terrain, creating terraces.
//TIP: terracing_constant Use the same amount of terraces everywhere. Generates a blocky terrain with evenly-spaced terrain.
interface TerracingP {
    //TIP: terracing_steps Number of terraces used in the terrain. More terraces will create a smoother terrain.
    steps: number;
}
export class Terracing extends NoiseWrapper<TerracingP> {
    get class(): NoiseClass { return 'Terracing' }
    static build(params: TerracingP): Terracing { return new Terracing({ ...params, wrapped: null }) }
    make(): NoiseFun {
        const fun = this.p.wrapped.make();
        if (this.p.steps == 0) return fun;
        return (x, y) => Math.round(fun(x, y) * this.p.steps) / this.p.steps;
    }
}
register('Terracing', Terracing);

//TIP: terracing_noisy Use a different amount of terraces in different places. Creates a stepped and wobbly surface that increases in wobbleliness when the difference between the minimum and the maximum of terraces increases.
interface NoisyTerracingP {
    //TIP: noisy_terrace_min Minimum number of terraces used in the terrain. More terraces will create smoother terrain.
    min: number;

    //TIP: noisy_terrace_max Maximum number of terraces used in the terrain. More terraces will create smoother terrain.
    max: number;

    //TIP: noisy_terracer Noise dictating how much terraces will be used at a given point, normalized between min and max.
    terracer: NoiseMakerI;
}
export class NoisyTerracing extends NoiseWrapper<NoisyTerracingP> {
    get class(): NoiseClass { return 'NoisyTerracing' }
    static build(params: NoisyTerracingP): NoisyTerracing {
        return new NoisyTerracing({ ...params, wrapped: null });
    }

    make(): NoiseFun {
        const fun = this.p.wrapped.make();
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
    //TIP: warping_frequency Scale factor for the warping coordinates, dictating how dense the warping is. Higher values will make the warping effect repeat more frequently, making the effect more visible.
    frequency: number;

    //TIP: warping_strength How much the warping effect distorts the coordinates. Higher value will make the terrain more swirly, making the effect more visible.
    strength: number;

    //TIP: warper Noise dictating the magnitude of the warping effect.
    warper: NoiseMakerI;
}
export class Warping extends NoiseWrapper<WarpingP> {
    get class(): NoiseClass { return 'Warping' }
    static build(params: WarpingP): Warping { return new Warping({ ...params, wrapped: null }) }

    make(): NoiseFun {
        const fun = this.p.wrapped.make();
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
        this.p.wrapped.recompute();
        this.p.warper.recompute();
    }
}
register('Warping', Warping);

interface ProcessingPipelineP { top: NoiseMakerI }
export class ProcessingPipeline extends NoiseMakerBase<ProcessingPipelineP> {
    get class(): NoiseClass { return 'ProcessingPipeline' }
    get low(): number { return this.p.top.low }
    get high(): number { return this.p.top.high }
    make(): NoiseFun { return this.p.top.make() }
    recompute(): void { this.p.top.recompute() }

    /**
     * Returns an empty tower, use this and the stack method to define the tower with empty
     * wrappers.
     */
    static build(top: NoiseMakerI): ProcessingPipeline { return new ProcessingPipeline({ top }) }

    /**
     * Stacks noise wrappers on top of the previous, linking each with the one below.
     */
    stack(...floors: Array<NoiseMakerI<NoiseWrapperP>>): this {
        for (let i = floors.length - 1; i >= 0; --i) {
            floors[i].p.wrapped = this.p.top;
            this.p.top = floors[i];
        }
        return this;
    }
}
register('ProcessingPipeline', ProcessingPipeline);

//TIP: tiling Groups neighboring coordinates together to form chunks of uniform height. Can create shapes looking like continents.
interface TilingP {
    //TIP: tiling_coorscale Multiplier for the tile coordinates, dictates the tile density. Higher values will result in more tiles packed into a chunk.
    coorscale: number;

    //TIP: tiling_enabled Toggles tiling on or off.
    enabled: boolean;

    //TIP: tiling_noisescale Magnitude of the distortion applied to each tile. Higher values will make the tiles less square and more chaotic.
    noisescale: number;
}
export class Tiling extends NoiseWrapper<TilingP> {
    get class(): NoiseClass { return 'Tiling' }
    make(): NoiseFun {
        const fun = this.p.wrapped.normalised(0, 1);
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
