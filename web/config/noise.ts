import { createNoise2D } from "simplex-noise";
import { createLCG } from "../rng.js";
import { numStats } from "../stats.js";
import { clone, rangeMapper } from "../utils.js";

/** A height function, takes (x,y) coordinates and returns a height. */
export type NoiseFun = (x: number, y: number) => number;

export interface NoiseBuilderI {
    /** Returns a raw noise function. */
    make(): NoiseFun;

    /** The estimated low bound of the noise function. */
    get low(): number;

    /** The estimated high bound of the noise function. */
    get high(): number;

    /**
     * Returns a noise function roughly normalised through linear interpolation between the
     * estimated low and high bound.
     */
    mkNormalised(low: number, high: number): NoiseFun;
}

export abstract class NoiseMaker implements NoiseBuilderI {
    abstract make(): NoiseFun;
    abstract get low(): number;
    abstract get high(): number;
    mkNormalised(low: number, high: number): NoiseFun {
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
export class Simplex extends NoiseMaker {
    seed: number;

    constructor(fields: SimplexI) { super(); Object.assign(this, fields); }
    get low(): number { return -1 }
    get high(): number { return 1 }
    make(): NoiseFun { return createNoise2D(createLCG(this.seed)) }
}

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

export class Layered<Noise extends NoiseMaker> extends NoiseMaker {
    layers: LayersI;
    noise: Noise;
    sampling: LayerSamplingI;

    bounds: noiseStats;

    constructor(public fields: LayeredI<Noise>) {
        super();
        Object.assign(this, fields);
        this.resample();
    }

    get low(): number { return this.bounds.low }
    get high(): number { return this.bounds.high }
    resample(): void { this.bounds = noiseStats(this.sampler(), this.sampling) }
    make(): NoiseFun { return layerNoise(this.noise.make(), this.layers) }
    private sampler(): NoiseFun {
        const layers = clone(this.layers); layers.fundamental = 1;
        return layerNoise(this.noise.make(), layers);
    }
}

/////////////////////
// Post-processing //

interface NoisePostProcessI {
    terracing: number;
}
export class NoisePostProcess<Noise extends NoiseMaker> extends NoiseMaker {
    terracing: number;

    constructor(public base: Noise, fields: NoisePostProcessI) { super(); Object.assign(this, fields); }

    get low(): number { return this.base.low }
    get high(): number { return this.base.high }
    make(): NoiseFun {
        const basefun = this.base.make();
        if (this.terracing > 0) {
            const step = this.terracing * (this.high - this.low);
            return (x, y) => Math.round(basefun(x, y) / step) * step;
        }
        return basefun;
    }
}
