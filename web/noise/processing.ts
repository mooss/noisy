import { NoiseClass, NoiseFun, NoiseMakerBase, NoiseMakerI } from "./foundations.js";

abstract class NoiseWrapper<Params = any> extends NoiseMakerBase<Params & { wrapped: NoiseMakerI }> {
    get low(): number { return this.p.wrapped.low }
    get high(): number { return this.p.wrapped.high }
    recompute(): void { this.p.wrapped.recompute() }
}

interface TerracingI { interval: number }
export class Terracing extends NoiseWrapper<TerracingI> {
    get class(): NoiseClass { return 'Terracing' }
    make(): NoiseFun {
        const fun = this.p.wrapped.make();
        if (this.p.interval == 0) return fun;
        const step = this.p.interval * (this.high - this.low);
        return (x, y) => Math.round(fun(x, y) / step) * step;
    }
}

