import { clone } from "../utils/objects.js";
import { ContinentalMix, Layered, NoiseMap, Ridge, Simplex } from "./algorithms.js";
import { NoiseMakerI, NoiseRegistry } from "./foundations.js";
import { Terracing } from "./processing.js";

export function noiseAlgorithms(): NoiseMakerI {
    const f = {
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
        noise: new Simplex(c(f.base)),
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
            noise: new Simplex(c(f.base)),
            layers: {
                fundamental: 1.1,
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
                persistence: .6,
                lacunarity: 1.6,
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
        }
    });
    map.recompute();

    const res = new Terracing({ interval: .06, wrapped: map });
    // Live test encoding and decoding.
    return NoiseRegistry.decode(res.encode());
}
