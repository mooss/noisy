import { createNoise2D } from "simplex-noise";
import { createLCG, highMix, mkRidger } from "../rng.js";
import { numStats } from "../stats.js";
import { clone, rangeMapper } from "../utils.js";

/** A height function, takes (x,y) coordinates and returns a height. */
export type NoiseFun = (x: number, y: number) => number;

export interface NoiseMakerI<Params = any> {
    p: Params;

    /** Returns a raw noise function. */
    make(): NoiseFun;

    /** The estimated low bound of the noise function. */
    get low(): number;

    /** The estimated high bound of the noise function. */
    get high(): number;

    /**
     * Recomputes the noise parameters, which may be costly but necessary when important parameters
     * have changed.
     */
    recompute(): void;

    /**
     * Returns a noise function roughly normalised through linear interpolation between the
     * estimated low and high bound.
     */
    normalised(low: number, high: number): NoiseFun;
}

abstract class NoiseMaker<Params = any> implements NoiseMakerI<Params> {
    p: Params;
    constructor(params: Params) { this.p = params }

    abstract make(): NoiseFun;
    abstract get low(): number;
    abstract get high(): number;
    recompute(): void { }

    normalised(low: number, high: number): NoiseFun {
        const mapper = rangeMapper(this.low, this.high, low, high);
        const fun = this.make();
        return (x, y) => { return mapper(fun(x, y)); }
    }
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
export class Simplex extends NoiseMaker<SimplexI> {
    get low(): number { return -1 }
    get high(): number { return 1 }
    make(): NoiseFun { return createNoise2D(createLCG(this.p.seed)) }
}

export interface RidgeI extends SimplexI {
    invert: boolean;
    square: boolean;
}
export class Ridge extends NoiseMaker<RidgeI> {
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
export class LayeredI<Noise extends NoiseMaker> {
    noise: Noise;
    layers: LayersI;
    sampling: LayerSamplingI;
}
export class Layered<Noise extends NoiseMaker> extends NoiseMaker<LayeredI<Noise>> {
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
export class ContinentalMix<I extends NoiseMakerI> extends NoiseMaker<ContinentalMixI<I>> {
    bass: NoiseFun;
    treble: NoiseFun;

    recompute(): void {
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

/////////////////////
// Post-processing //

interface NoisePostProcessI {
    terracing: number;
}
export class NoisePostProcess<Noise extends NoiseMaker> extends NoiseMaker<NoisePostProcessI> {
    constructor(public base: Noise, params: NoisePostProcessI) {
        super(params);
    }

    get low(): number { return this.base.low }
    get high(): number { return this.base.high }
    make(): NoiseFun {
        const basefun = this.base.make();
        if (this.p.terracing > 0) {
            const step = this.p.terracing * (this.high - this.low);
            return (x, y) => Math.round(basefun(x, y) / step) * step;
        }
        return basefun;
    }
}

///////////////////
// Global config //

export interface NoisePickerI {
    algorithms: Record<string, NoiseMaker>;
    postProcess: NoisePostProcessI;
}

export class NoisePicker extends NoiseMaker<NoisePickerI> {
    private algoname: string;

    constructor(params: NoisePickerI, initial: string = undefined) {
        super(params);
        let algos = Object.keys(params.algorithms);
        if (initial === undefined && algos.length != 0)
            initial = algos[0];
        this.algoname = initial;
    }

    register(name: string, algo: NoiseMaker): void {
        this.p.algorithms[name] = algo;
        if (this.algoname === undefined) this.algoname = name;
    }

    get algorithm(): NoiseMaker { return this.p.algorithms[this.algoname] };
    set algorithm(algo: string) {
        this.algoname = algo;
        this.recompute();
    }

    make(): NoiseFun { return new NoisePostProcess(this.algorithm, this.p.postProcess).make() }
    get low(): number { return this.algorithm.low }
    get high(): number { return this.algorithm.high }
    recompute(): void { this.algorithm.recompute() }
}
