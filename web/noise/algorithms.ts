import { createNoise2D } from "simplex-noise";
import { createLCG, highMix, mkRidger } from "../rng.js";
import { numStats } from "../stats.js";
import { clone } from "../utils/objects.js";
import { NoiseClass, NoiseFun, NoiseMakerBase, NoiseMakerI } from "./foundations.js";
import { register } from "../state/state.js";

//////////////
// Sampling //

interface noiseStats { low: number; high: number; }

interface NoiseSamplerP {
    // Number of points to sample on both the x and y dimensions.
    size: number;
    // Z-score threshold to identify data outliers.
    threshold: number;
}

function noiseStats(gen: NoiseFun, sampling: NoiseSamplerP): noiseStats {
    const values = [];
    for (let x = 0; x < sampling.size; ++x)
        for (let y = 0; y < sampling.size; ++y)
            values.push(gen(x, y));
    return numStats(values).outlierBounds(sampling.threshold);
}

///////////
// Noise //

export interface SimplexP { seed: number }
export class Simplex extends NoiseMakerBase<SimplexP> {
    get class(): NoiseClass { return 'Simplex' };
    get low(): number { return -1 }
    get high(): number { return 1 }
    make(): NoiseFun { return createNoise2D(createLCG(this.p.seed)) }
}
register('Simplex', Simplex);

export interface RidgeP extends SimplexP {
    invert: boolean;
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

export interface LayersP {
    fundamental: number;
    octaves: number;
    persistence: number;
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
    bounds: noiseStats;

    constructor(params: LayeredI<Noise>) {
        super(params);
        this.recompute();
    }

    get low(): number { return this.bounds.low }
    get high(): number { return this.bounds.high }
    recompute(): void { this.bounds = noiseStats(this.sampler(), this.p.sampling) }
    make(): NoiseFun { return layerNoise(this.p.noise.make(), this.p.layers) }
    private sampler(): NoiseFun {
        const layers = clone(this.p.layers);
        layers.fundamental = this.p.sampling.fundamental;
        return layerNoise(this.p.noise.make(), layers);
    }
}
register('Layered', Layered<any>);

///////////////
// Noise mix //

interface ContinentalMixP<I extends NoiseMakerI> {
    bass: I;
    treble: I;
    threshold: {
        low: number;
        mid: number;
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

///////////////////
// Global config //

export interface NoiseMapP {
    algorithms: Record<string, NoiseMakerI>;
    current?: string;
}
export class NoiseMap extends NoiseMakerBase<NoiseMapP> {
    get class(): NoiseClass { return 'Map' };

    register(name: string, algo: NoiseMakerI): void {
        this.p.algorithms[name] = algo;
    }

    get algorithm(): NoiseMakerI {
        if (this.p.current === undefined)
            this.p.current = Object.keys(this.p.algorithms)[0];
        return this.p.algorithms[this.p.current];
    };
    set algorithm(algo: string) {
        this.p.current = algo;
        this.recompute();
    }

    make(): NoiseFun {
        return this.algorithm.make()
    }
    get low(): number { return this.algorithm.low }
    get high(): number { return this.algorithm.high }
    recompute(): void { this.algorithm.recompute() }
}
register('Map', NoiseMap);

