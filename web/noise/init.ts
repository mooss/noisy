import { clone } from "../utils/objects.js";
import { ContinentalMix, Layered, NoiseMap, Ridge, Simplex } from "./algorithms.js";
import { NoiseMakerI } from "./foundations.js";
import { Terracing, ProcessingPipeline, Warping } from "./processing.js";

export function noiseAlgorithms(): NoiseMakerI {
    const f = {
        sbase: { seed: 23 },
        base: { invert: true, square: false, seed: 23 },
        layers: {
            fundamental: .7,
            octaves: 8,
            persistence: .65,
            lacunarity: 1.5,
        },
        sampling: { size: 30, threshold: 2.5, fundamental: 3 },
    };
    const c = clone;

    const simplex = new Layered({
        noise: new Simplex(c(f.sbase)),
        layers: c(f.layers),
        sampling: c(f.sampling),
    });

    const ridge = new Layered({
        noise: new Ridge(c(f.base)),
        layers: c(f.layers),
        sampling: c(f.sampling),
    });

    const comix = new ContinentalMix({
        bass: new Layered({
            noise: new Simplex(c(f.sbase)),
            layers: {
                fundamental: .3,
                octaves: 7,
                persistence: .65,
                lacunarity: 1.5,
            },
            sampling: c(f.sampling),
        }),
        treble: new Layered({
            noise: new Ridge(c(f.base)),
            layers: {
                fundamental: .4,
                octaves: 8,
                persistence: .65,
                lacunarity: 1.55,
            },
            sampling: c(f.sampling),
        }),
        threshold: { low: .28, mid: .64, high: .56 },
    });

    const map = new NoiseMap({
        algorithms: {
            'Simplex': simplex,
            'Ridge': ridge,
            'Continental mix': comix,
        },
        current: 'Continental mix',
    });
    map.recompute();

    return ProcessingPipeline.build(map).stack(
        Terracing.build({interval: .04}),
        Warping.build({
            frequency: 2.25,
            strength: .08,
            warper: new Simplex(c(f.sbase)),
        }),
    )
}
