import { Layered, Ridge, ContinentalMix, NoiseMap, Simplex } from "./algorithms.js";
import { clone } from "../utils.js";
import { decodeNoise, encodeNoise } from "./encoding.js";

export function noiseAlgorithms(): NoiseMap {
    const res = new NoiseMap({ postProcess: { terracing: .07, noise: null }, algorithms: {} });
    const f = {
        base: { invert: true, square: false, seed: 23 },
        layers: {
            fundamental: .7,
            octaves: 8,
            persistence: .65,
            lacunarity: 1.5,
        },
        sampling: { size: 50, threshold: 4, fundamental: 3 },
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

    res.register('Simplex', simplex);
    res.register('Ridge', ridge);
    res.register('Continental mix', comix);
    res.recompute();

    // Do a round of encoding and decoding on the NoiseMap to make sure it works.
    return decodeNoise(encodeNoise(res)) as NoiseMap;
}
