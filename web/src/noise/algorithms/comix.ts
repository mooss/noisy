import { highMix } from "../../maths/rng.js";
import { register } from "../../state/state.js";
import { NoiseClass, NoiseFun, NoiseMakerBase, NoiseMakerI } from "../foundations.js";

//TIP: continental_mix Ridge noise and simplex noise combined together. \nCreates a montaineous terrain with the lower elevations made of smoother hills. \nThe mountains noise (ridge) is what dictates the general shape of the terrain. The hill noise (simplex) influences the lower part of the terrain. \nHighly experimental, it's hard to understand the parameters behaviour, this is mostly to test the concept of using a 'selecting' noise.
interface ContinentalMixP<I extends NoiseMakerI> {
    //TIP: continental_bass The lower, hilly part of the terrain.
    bass: I;

    //TIP: continental_treble The higher, mountaineous part of the terrain.
    treble: I;

    //TIP: continental_threshold Thresholds dictating which noise (mountain or hill) will be used to decide the height and how to mix them.
    threshold: {
        //TIP: continental_low Low cutoff point. \nWhen the mountain height is below this threshold, only the hill height is taken into account.
        low: number;

        //TIP: continental_mid Controls the transition between mountains and hills when the mountain height is between the low and high thresholds. \nWhen lower, hill height has a bigger influence. When higher, mountain height has a bigger influence.
        mid: number;

        //TIP: continental_high High cutoff point. \nWhen the mountain height is above this value, it fully decides the final height.
        high: number;
    }
}
export class ContinentalMix<I extends NoiseMakerI> extends NoiseMakerBase<ContinentalMixP<I>> {
    get class(): NoiseClass { return 'ContinentalMix' };
    bass: NoiseFun;
    treble: NoiseFun;

    recompute(): void {
        this.p.treble.recompute();
        this.p.bass.recompute();
        this.treble = this.p.treble.normalised(0, 1);
        this.bass = this.p.bass.normalised(0, 1);
    }
    get low(): number { return 0 }
    get high(): number { return 1 }
    make(): NoiseFun {
        if (this.bass === undefined || this.treble === undefined) this.recompute();
        const thsh = this.p.threshold;
        return highMix(this.bass, this.treble, thsh.low, thsh.high, thsh.mid);
    }
}
register('ContinentalMix', ContinentalMix);
