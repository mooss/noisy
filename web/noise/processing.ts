import { NoiseClass, NoiseFun, NoiseMakerI, normaliseNoiseMaker } from "./foundations.js";

abstract class NoiseWrapper<Params = any> implements NoiseMakerI {
    p: Params & { wrapped: NoiseMakerI };
    abstract readonly class: NoiseClass;

    constructor(params: Params & { wrapped: NoiseMakerI }) {
        this.p = params
    }

    get low(): number { return this.p.wrapped.low }
    get high(): number { return this.p.wrapped.high }
    abstract make(): NoiseFun;
    recompute(): void { this.p.wrapped.recompute() }
    normalised(low: number, high: number): NoiseFun { return normaliseNoiseMaker(this, low, high) }
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
