import { createNoise2D } from "simplex-noise";
import { createLCG, highMix, mkRidger } from "../rng.js";
import { numStats } from "../stats.js";
import { clone } from "../utils.js";
import { NoiseClass, NoiseFun, NoiseMakerI, normaliseNoiseMaker } from "./foundations.js";

////////////////
// Primitives //

abstract class NoiseMakerBase<Params = any> implements NoiseMakerI<Params> {
    p: Params;
    abstract readonly class: NoiseClass;
    constructor(params: Params) { this.p = params }

    abstract make(): NoiseFun;
    abstract get low(): number;
    abstract get high(): number;
    recompute(): void { }
    normalised(low: number, high: number): NoiseFun { return normaliseNoiseMaker(this, low, high) }
}

//////////////
// Sampling //

interface noiseStats { low: number; high: number; }

interface NoiseSamplerI {
    // Number of points to sample on both the x and y dimensions.
    size: number;
    // Z-score threshold to identify data outliers.
    threshold: number;
}

function noiseStats(gen: NoiseFun, sampling: NoiseSamplerI): noiseStats {
    const values = [];
    for (let x = 0; x < sampling.size; ++x)
        for (let y = 0; y < sampling.size; ++y)
            values.push(gen(x, y));
    return numStats(values).outlierBounds(sampling.threshold);
}

///////////
// Noise //

export interface SimplexI { seed: number }
export class Simplex extends NoiseMakerBase<SimplexI> {
    get class(): NoiseClass { return 'Simplex' };
    get low(): number { return -1 }
    get high(): number { return 1 }
    make(): NoiseFun { return createNoise2D(createLCG(this.p.seed)) }
}

export interface RidgeI extends SimplexI {
    invert: boolean;
    square: boolean;
}
export class Ridge extends NoiseMakerBase<RidgeI> {
    get class(): NoiseClass { return 'Ridge' };
    get low(): number { return 0 }
    get high(): number { return 1 }
    make(): NoiseFun {
        const simplex = new Simplex(this.p).make();
        const ridger = mkRidger(this.p.invert, this.p.square);
        return (x, y) => ridger(simplex(x, y));
    }
}

//////////////
// Layering //

export interface LayersI {
    fundamental: number;
    octaves: number;
    persistence: number;
    lacunarity: number;
}
function layerNoise(noise: NoiseFun, layers: LayersI): NoiseFun {
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

interface LayerSamplingI extends NoiseSamplerI { fundamental: number }
export class LayeredI<Noise extends NoiseMakerI> {
    noise: Noise;
    layers: LayersI;
    sampling: LayerSamplingI;
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

///////////////
// Noise mix //

interface ContinentalMixI<I extends NoiseMakerI> {
    bass: I;
    treble: I;
    threshold: {
        low: number;
        mid: number;
        high: number;
    }
}
export class ContinentalMix<I extends NoiseMakerI> extends NoiseMakerBase<ContinentalMixI<I>> {
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
        const thsh = this.p.threshold;
        return highMix(this.bass, this.treble, thsh.low, thsh.high, thsh.mid);
    }
}

///////////////////
// Global config //

export interface NoiseMapI {
    algorithms: Record<string, NoiseMakerI>;
}
export class NoiseMap extends NoiseMakerBase<NoiseMapI> {
    get class(): NoiseClass { return 'Map' };
    private current: string;

    constructor(params: NoiseMapI, initial: string = undefined) {
        super(params);
        let algos = Object.keys(params.algorithms);
        if (initial === undefined && algos.length != 0)
            initial = algos[0];
        this.current = initial;
    }

    register(name: string, algo: NoiseMakerI): void {
        this.p.algorithms[name] = algo;
        if (this.current === undefined) this.current = name;
    }

    get algorithm(): NoiseMakerI { return this.p.algorithms[this.current] };
    set algorithm(algo: string) {
        this.current = algo;
        this.recompute();
    }

    make(): NoiseFun {
        return this.algorithm.make()
    }
    get low(): number { return this.algorithm.low }
    get high(): number { return this.algorithm.high }
    recompute(): void { this.algorithm.recompute() }
}
