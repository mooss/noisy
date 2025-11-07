/**
 * This file defines noise processors that smoothly transform the noise.
 */

import { register } from "../../state/state.js";
import { NoiseClass, NoiseFun } from "../foundations.js";
import { NoiseWrapper } from "./processing.js";

//TIP: steepness Accentuates the steepness of the higher part of the terrain, compressing the lower parts.
interface SteepnessP {
    //TIP: steepness_factor Strength of the steepness accentuation. \nA value of 1 disables the effect. Higher values push the lower heights down. Lower values push the lower height up.
    factor: number
}

export class Steepness extends NoiseWrapper<SteepnessP> {
    get class(): NoiseClass { return 'Steepness' }
    get enabled() { return this.p.factor !== 1 }
    make(): NoiseFun {
        if (!this.enabled) return this.wrapped.make();
        const fun = this.wrapped.normalised(0, 1);
        return (x, y) => {
            const z = fun(x, y);
            return z / (this.p.factor + (1.0 - this.p.factor) * z);
        }
    }
    get low() { return this.enabled ? 0 : this.wrapped.low }
    get high() { return this.enabled ? 1 : this.wrapped.high }
}
register('Steepness', Steepness);
