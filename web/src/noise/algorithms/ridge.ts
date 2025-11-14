import { mkRidger } from "../../maths/rng.js";
import { register } from "../../state/state.js";
import { NoiseClass, NoiseFun, NoiseMakerBase } from "../foundations.js";
import { Simplex, SimplexP } from "./simplex.js";

//TIP: ridge Simplex noise with a post-processing step. \nCreates a sharper terrain reminescent of a mountain chain.
export interface RidgeP extends SimplexP {
    // When true, flips the signal, thus inverting the height.
    // Occurs after squaring the signal.
    //TIP: ridge_invert Inverts the height. \nMakes valleys appear as ridges and vice versa.
    invert: boolean;

    // When true, squares the signal.
    // Occurs after taking the absolute value.
    //TIP: ridge_square Squares the height. \nGives a flatter appearance, with less dramatic peaks and hiding the folds.
    square: boolean;
}

export class Ridge extends NoiseMakerBase<RidgeP> {
    get class(): NoiseClass { return 'Ridge' };
    get low(): number { return 0 }
    get high(): number { return 1 }
    make(): NoiseFun {
        const simplex = new Simplex(this.p).make();
        const ridger = mkRidger(this.p.invert, this.p.square);
        return (x, y) => ridger(simplex(x, y));
    }
}
register('Ridge', Ridge);
