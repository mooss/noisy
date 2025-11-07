import { register } from "../../state/state.js";
import { AlgoPicker } from "../containers.js";
import { NoiseClass, NoiseFun, NoiseMakerBase, NoiseMakerI } from "../foundations.js";
import { NoiseWrapper } from "./processing.js";

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
