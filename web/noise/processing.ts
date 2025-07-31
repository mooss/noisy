import { register } from "../state/state.js";
import { NoiseClass, NoiseFun, NoiseMakerBase, NoiseMakerI } from "./foundations.js";

interface NoiseWrapperI extends NoiseMakerI { wrap(noise: NoiseMakerI): void }
interface NoiseWrapperP { wrapped: NoiseMakerI }
abstract class NoiseWrapper<Params = any>
    extends NoiseMakerBase<Params & NoiseWrapperP>
    implements NoiseWrapperI {
    get low(): number { return this.p.wrapped.low }
    get high(): number { return this.p.wrapped.high }
    recompute(): void { this.p.wrapped.recompute() }
    wrap(noise: NoiseMakerI) { this.p.wrapped = noise }
}

interface TerracingP { steps: number }
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

interface NoisyTerracingP { min: number, max: number, terracer: NoiseMakerI }
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

interface WarpingP {
    frequency: number;
    strength: number;
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

interface PipelineBaseP { top: NoiseMakerI }
export class ProcessingPipeline extends NoiseMakerBase<PipelineBaseP> {
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
    stack(...floors: Array<NoiseWrapperI>): this {
        for (let i = floors.length - 1; i >= 0; --i) {
            floors[i].p.wrapped = this.p.top;
            this.p.top = floors[i];
        }
        return this;
    }
}
register('ProcessingPipeline', ProcessingPipeline);
