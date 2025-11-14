import { createNoise2D } from "simplex-noise";

import { createLCG } from "../../maths/rng.js";
import { register } from "../../state/state.js";
import { NoiseClass, NoiseFun, NoiseMakerBase } from "../foundations.js";

//TIP: simplex Raw simplex noise, the fundamental terrain generation building block. \nCreates a landscape of smooth hills.
export interface SimplexP {
    // Random source for simplex noise.
    //TIP: simplex_seed Seed for the simplex noise generator. \nChanging the seed results in completely different values, but with similar properties.
    seed: number;
}
export class Simplex extends NoiseMakerBase<SimplexP> {
    get class(): NoiseClass { return 'Simplex' };
    get low(): number { return -1 }
    get high(): number { return 1 }
    make(): NoiseFun { return createNoise2D(createLCG(this.p.seed)) }
}
register('Simplex', Simplex);
