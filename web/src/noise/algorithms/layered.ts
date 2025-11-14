import { register } from "../../state/state.js";
import { clone } from "../../utils/objects.js";
import { NoiseClass, NoiseFun, NoiseMakerBase, NoiseMakerI } from "../foundations.js";
import { bounds, computeBounds, DEFAULT_SAMPLING } from "../sampling.js";

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

export class LayeredI<Noise extends NoiseMakerI> {
    noise: Noise;
    layers: LayersP;
}
export class Layered<Noise extends NoiseMakerI> extends NoiseMakerBase<LayeredI<Noise>> {
    get class(): NoiseClass { return 'Layered' };

    bounds: bounds;
    get low(): number { return this.bounds.low }
    get high(): number { return this.bounds.high }
    recompute(): void { this.bounds = computeBounds(this.sampler(), DEFAULT_SAMPLING) }
    private sampler(): NoiseFun {
        const layers = clone(this.p.layers);
        layers.fundamental = DEFAULT_SAMPLING.fundamental;
        return layerNoise(this.p.noise.make(), layers);
    }

    make(): NoiseFun { return layerNoise(this.p.noise.make(), this.p.layers) }
}
register('Layered', Layered<any>);
