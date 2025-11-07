import { register } from "../../state/state.js";
import { NoiseClass, NoiseFun, NoiseMakerI } from "../foundations.js";
import { NoiseWrapper } from "./processing.js";

//TIP: warping Distorts the coordinates to hide straight lines in the terrain, introducing vortex-like perturbations.
interface WarpingP {
    //TIP: warping_frequency Scale factor for the warping coordinates, dictating how dense the warping is. \nHigher values will make the warping effect repeat more frequently, making the effect more visible.
    frequency: number;

    //TIP: warping_strength How much the warping effect distorts the coordinates. \nHigher values will make the terrain more swirly, making the effect more visible.
    strength: number;

    //TIP: warper Noise dictating the magnitude of the warping effect.
    warper: NoiseMakerI;
}
export class Warping extends NoiseWrapper<WarpingP> {
    get class(): NoiseClass { return 'Warping' }

    make(): NoiseFun {
        const fun = this.wrapped.make();
        if (this.p.strength == 0) return fun;
        const warp = this.p.warper.normalised(0, 1);
        return (x, y) => {
            const xoff = warp(x * this.p.frequency, y * this.p.frequency) * this.p.strength;
            // Using a different y offset computed at a different location reduces linear artifacts
            // visible near the origin.
            const yoff = warp(x * this.p.frequency, y * this.p.frequency + 100) * this.p.strength;
            return fun(x + xoff, y + yoff);
        }
    }

    recompute(): void {
        this.wrapped.recompute();
        this.p.warper.recompute();
    }
}
register('Warping', Warping);
