import { register } from "../../state/state.js";
import { NoiseClass, NoiseMakerBase, NoiseMakerI } from ".././foundations.js";

// Applies pre-processing and/or post-processing to a noise algorithm.
// Meant to be used as part of a NoisePipeline, otherwise the wrapped noise must be set manually and
// it will anyway not encode/decode properly.
export abstract class NoiseWrapper<Params = any> extends NoiseMakerBase<Params> {
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
