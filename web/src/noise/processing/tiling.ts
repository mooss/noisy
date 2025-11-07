import { fracpart, lerp, smoothunit } from "../../maths/maths.js";
import { register } from "../../state/state.js";
import { NoiseClass, NoiseFun } from "../foundations.js";
import { NoiseWrapper } from "./processing.js";

//TIP: tiling Transform the noise into a repeating texture.
//TIP: tiling_none No tiling, use the noise as-is.

//TIP: tiling_quad Interpolates between four points. \nCreates a seamless texture that somewhat preserves the noise pattern without mirroring.
export class QuadTiling extends NoiseWrapper  {
    get class(): NoiseClass { return 'QuadTiling' }
    make(): NoiseFun {
        const fun = this.wrapped.make();
        return (x: number, y: number) => {
            x = fracpart(x);
            y = fracpart(y);

            const xfactor = smoothunit(x); // Smooth horizontal proportion.
            const yfactor = smoothunit(y); // Smooth vertical proportion.

            const topleft = fun(x, y);
            const topright = fun(x - 1, y);
            const bottomleft = fun(x, y - 1);
            const bottomright = fun(x - 1, y - 1);

            // Horizontal interpolation.
            const tophoz = lerp(topleft, topright, xfactor);
            const bottomhoz = lerp(bottomleft, bottomright, xfactor);

            // Vertical interpolation.
            return lerp(tophoz, bottomhoz, yfactor);
        }
    }

    // Those high and low values were obtained experimentally, they are enough to somewhat
    // consistently "stabilize" the height, but their reliability changes depending on the
    // characteristics of the wrapped algorithm.
    // Simplex is too low, whereas continental mix is too high.
    //
    // The only reason why they work right now is that the wrapped noises (comix, simplex and ridge)
    // already (somewhat) guarantee being between 0 and 1.
    // This general unreliability might be avoided by simply always statistically computing the
    // bounds at the top level instead of trying to propagate the computations down the chain of
    // noises.
    get low(): number { return this.wrapped.low + .15 }
    get high(): number { return this.wrapped.high - .1 }
}
register('QuadTiling', QuadTiling);

//TIP: tiling_sine Use the sine function to transform the coordinates. \nCreate a seamless mirrored texture with very obvious circular artifacts.
export class SineTiling extends NoiseWrapper {
    get class(): NoiseClass { return 'SineTiling' }
    make(): NoiseFun {
        const fun = this.wrapped.make();
        return (x, y) => {
            return fun(Math.sin(x * Math.PI), Math.sin(y * Math.PI));
        }
    }
}
register('SineTiling', SineTiling);

interface MirroredTilingP {
    //TIP: tilling_mirrored_fraction_x Force a repetition along the horizontal axis instead of infinite mirroring.
    normalizeX: boolean;
    //TIP: tilling_mirrored_fraction_y Force a repetition along the vertical axis instead of infinite mirroring.
    normalizeY: boolean;
}
//TIP: tiling_mirrored Mirror the x and y coordinates. \nCreate a seamless mirrored texture.
export class MirroredTiling extends NoiseWrapper<MirroredTilingP> {
    get class(): NoiseClass { return 'MirroredTiling' }
    make(): NoiseFun {
        const fun = this.wrapped.make();
        return (x, y) => {
            if (this.p.normalizeX) x = fracpart(x);
            if (this.p.normalizeY) y = fracpart(y);
            x = x > .5 ? 1 - x : x;
            y = y > .5 ? 1 - y : y;
            return fun(x, y);
        }
    }
}
register('MirroredTiling', MirroredTiling);
