import { register } from "../state/state.js";
import { NoiseClass, NoiseFun, NoiseMakerBase, NoiseMakerI } from "./foundations.js";

export interface AlgoPickerP<Algo> {
    algorithms: Record<string, Algo>;
    current: string;
}
export class AlgoPicker<Algo extends NoiseMakerI> extends NoiseMakerBase<AlgoPickerP<Algo>> {
    get algorithm(): Algo {
        if (this.p.current === undefined)
            this.p.current = Object.keys(this.p.algorithms)[0];
        return this.p.algorithms[this.p.current];
    };
    set algorithm(algo: string) { this.p.current = algo }
    register(name: string, algo: Algo): void { this.p.algorithms[name] = algo }

    make(): NoiseFun { return this.algorithm.make() }
    get low(): number { return this.algorithm.low }
    get high(): number { return this.algorithm.high }
    recompute(): void { this.algorithm.recompute() }
    get class(): NoiseClass { return 'AlgoPicker' };
}
register('AlgoPicker', AlgoPicker);
