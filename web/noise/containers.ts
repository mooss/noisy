import { SelfEncoded } from "../encoding/self-encoder.js";
import { register } from "../state/state.js";
import { NoiseClass, NoiseFun, NoiseMakerBase, NoiseMakerI } from "./foundations.js";
import { NoiseWrapperI } from "./processing.js";

export interface NoiseMapP<Maker extends NoiseMakerI> {
    algorithms: Record<string, Maker>;
    current?: string;
}
export class NoiseMap<Maker extends NoiseMakerI, Params extends NoiseMapP<Maker>> extends NoiseMakerBase<Params> {
    get algorithm(): NoiseMakerI {
        if (this.p.current === undefined)
            this.p.current = Object.keys(this.p.algorithms)[0];
        return this.p.algorithms[this.p.current];
    };

    set algorithm(algo: string) { this.p.current = algo }
    get class(): NoiseClass { return 'Map' };
    make(): NoiseFun { return this.algorithm.make() }
    get low(): number { return this.algorithm.low }
    get high(): number { return this.algorithm.high }
    recompute(): void { this.algorithm.recompute() }
    register(name: string, algo: Maker): void { this.p.algorithms[name] = algo }
}
register('Map', NoiseMap);

interface ProcessingMapP extends NoiseMapP<NoiseWrapperI> { wrapped?: NoiseMakerI }
export class ProcessingPipelineMap extends NoiseMap<NoiseWrapperI, ProcessingMapP> {
    encode(): SelfEncoded {
        // The wrapped references must be deleted, otherwise the wrapped noise will be duplicated
        // in the encoding.
        Object.values(this.p.algorithms).forEach((proc) => delete proc.p.wrapped);
        return super.encode();
    }

    get class(): NoiseClass { return 'ProcessingMap' }
    get algorithm(): NoiseMakerI {
        const res = super.algorithm
        res.p.wrapped = this.p.wrapped;
        return res;
    }
    set algorithm(algo: string) { this.p.current = algo }
}
register('ProcessingMap', ProcessingPipelineMap);
