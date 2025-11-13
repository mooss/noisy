import { createNoise2D } from "simplex-noise";
import { createLCG, highMix, mkRidger } from "../maths/rng.js";
import { register } from "../state/state.js";
import { enumerate } from "../utils/iteration.js";
import { clone } from "../utils/objects.js";
import { NoiseClass, NoiseFun, NoiseMakerBase, NoiseMakerI } from "./foundations.js";
import { NoiseSamplerP, bounds, computeBounds } from "./sampling.js";

///////////
// Noise //

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

//////////////
// Layering //

//TIP: layered_simplex Multiple values (called octaves) of simplex noise layered on top of each other. Creates a more complex hilly terrain than plain simplex noise, with each octave adding more details.
//TIP: layered_ridge Multiple values (called octaves) of simplex noise layered on top of each other. Creates a more complex mountaineous terrain than plain ridge noise, with each octave adding more details.
export interface LayersP {
    //TIP: layers_fundamental Base frequency for the first noise layer, controls the size of terrain features. \nLower values creates broader, smoother terrain. Higher values will bring everything close together, resulting sharper terrain with steeper slopes.
    fundamental: number;

    //TIP: layers_octaves Number of noise layers. \nMore octaves will add details to the terrain.
    octaves: number;

    //TIP: layers_persistence Amount by which the height of each successive octave is decreased. \nHigher values makes every subsequent octave have a bigger impact, resulting in more bumpy terrain.
    persistence: number;

    //TIP: layers_lacunarity Multiplier for the frequency of each successive octave. \nHigher values makes every subsequent octave pack more details, resulting in sharper terrain with steeper slopes.
    lacunarity: number;
}
function layerNoise(noise: NoiseFun, layers: LayersP): NoiseFun {
    return (x: number, y: number): number => {
        let res = 0;
        let frequency = layers.fundamental;
        let amplitude = 1;

        for (let oct = 0; oct < layers.octaves; oct++) {
            // The noise is shifted with the octave index to avoid the artifact that occurs at the
            // origin when layering noise.
            // This artifact is probably due to the fact that the same base noise value is
            // accumulated at the origin, thus reinforcing the directionality that can occur in raw
            // noise.
            // I don't know where this idea that simplex has no directional artifacts because they
            // are very much visible in this project.
            let octave = noise(x * frequency + oct, y * frequency + oct + 10);
            res += octave * amplitude;

            // Update amplitude and frequency for the next octave.
            amplitude *= layers.persistence;
            frequency *= layers.lacunarity;
        }

        return res;
    }
}

interface LayerSamplingP extends NoiseSamplerP { fundamental: number }
export class LayeredI<Noise extends NoiseMakerI> {
    noise: Noise;
    layers: LayersP;
    sampling: LayerSamplingP;
}
export class Layered<Noise extends NoiseMakerI> extends NoiseMakerBase<LayeredI<Noise>> {
    get class(): NoiseClass { return 'Layered' };

    bounds: bounds;
    get low(): number { return this.bounds.low }
    get high(): number { return this.bounds.high }
    recompute(): void { this.bounds = computeBounds(this.sampler(), this.p.sampling) }
    private sampler(): NoiseFun {
        const layers = clone(this.p.layers);
        layers.fundamental = this.p.sampling.fundamental;
        return layerNoise(this.p.noise.make(), layers);
    }

    make(): NoiseFun { return layerNoise(this.p.noise.make(), this.p.layers) }
}
register('Layered', Layered<any>);

/////////////
// Stacked //

interface OctaveP {
    // Descriptive name for this octave layer (shown in UI)
    name: string;
    //TIP: stacked_frequency Frequency (coordinates multiplier) of this octave. Higher values will pack the terrain features closer.
    frequency: number;
    //TIP: stacked_amplitude Amplitude (height multiplier) of this octave. Higher values will increase the height contribution of this octave.
    amplitude: number;
    noise: NoiseMakerI;
}

//TIP: stacked (advanced) Multi-octave noise where each octave has independent persistence and lacunarity. \nAllows full control over each noise octave's amplitude and frequency multipliers. Each octave can also be any kind of noise function. \nThis is functionally layered noise but with each octave individually controllable instead of being configured through persistence and lacunarity.
interface StackedP {
    fundamental: number;
    octaves: Array<OctaveP>;
}

function stackNoise(stack: StackedP): NoiseFun {
    const tail = stack.octaves.filter(oct => oct.frequency > 0 && oct.amplitude > 0).map(octave => {
        const frequency = octave.frequency;
        // Dividing by the frequency dampens the impact of high frequencies, preventing them from
        // overwhelming the rest.
        // It makes the interactive parameters tweaking more intuitive.
        //TODO: Find a way to reduce the impact of very low frequencies (~.1), they make the
        // amplitude explode too much.
        const amplitude = octave.amplitude / frequency;
        const noise = octave.noise.make();
        return { frequency, amplitude, noise };
    });

    return (x: number, y: number): number => {
        let res = 0;
        for (const [oct, { frequency, amplitude, noise }] of enumerate(tail)) {
            // The frequency is shifted by the octave index to try and hide directional artifacts,
            // see the layerNoise function.
            res += noise(x * frequency + oct, y * frequency + oct + 10) * amplitude;
        }
        return res;
    };
}

export class Stacked extends NoiseMakerBase<StackedP> {
    get class(): NoiseClass { return 'Stacked' };
    bounds: bounds;
    get low(): number { return this.bounds.low }
    get high(): number { return this.bounds.high }
    recompute(): void { this.bounds = computeBounds(this.make()) }
    make(): NoiseFun { return stackNoise(this.p) }
}
register('Stacked', Stacked);

///////////////
// Noise mix //

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
