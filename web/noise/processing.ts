import { register } from "../state/state.js";
import { NoiseClass, NoiseFun, NoiseMakerBase, NoiseMakerI } from "./foundations.js";

interface NoiseWrapperP { wrapped: NoiseMakerI }
abstract class NoiseWrapper<Params = any> extends NoiseMakerBase<Params & NoiseWrapperP> {
    get low(): number { return this.p.wrapped.low }
    get high(): number { return this.p.wrapped.high }
    recompute(): void { this.p.wrapped.recompute() }
}

interface TerracingP { interval: number }
export class Terracing extends NoiseWrapper<TerracingP> {
    get class(): NoiseClass { return 'Terracing' }
    make(): NoiseFun {
        const fun = this.p.wrapped.make();
        if (this.p.interval == 0) return fun;
        const step = this.p.interval * (this.high - this.low);
        return (x, y) => Math.round(fun(x, y) / step) * step;
    }
}
register('Terracing', Terracing);

interface WarpingP {
    frequency: number;
    strength: number;
    warper: NoiseMakerI;
}
export class Warping extends NoiseWrapper<WarpingP> {
    get class(): NoiseClass { return 'Warping' }

    make(): NoiseFun {
        const fun = this.p.wrapped.make();
        if (this.p.strength == 0) return fun;
        const warp = this.p.warper.make();
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
