import { createNoise2D } from "simplex-noise";
import { createLCG } from "../rng.js";
import { numStats } from "../stats.js";
import { clone, rangeMapper } from "../utils.js";

/** A height function, takes (x,y) coordinates and returns a height. */
export type HeightFun = (x: number, y: number) => number;

export interface HeightFieldBuilderI {
    /** Returns a raw height function. */
    build(): HeightFun;

    /** The estimated low bound of the HeightFunction. */
    get low(): number;

    /** The estimated high bound of the HeightFunction. */
    get high(): number;

    /**
     * Returns a height function roughly normalised through linear interpolation between the
     * estimated low and high bound.
     */
    mkNormalised(low: number, high: number): HeightFun;
}

export abstract class HeightFieldBuilder2 implements HeightFieldBuilderI {
    abstract build(): HeightFun;
    abstract get low(): number;
    abstract get high(): number;
    mkNormalised(low: number, high: number): HeightFun {
        const mapper = rangeMapper(this.low, this.high, low, high);
        const fun = this.build();
        return (x, y) => { return mapper(fun(x, y)); }
    }
}

//////////////
// Sampling //

interface heightStats { low: number; high: number; }

interface HeightSamplerI {
    // Number of points to sample on both the x and y dimensions.
    size: number;
    // Z-score threshold to identify data outliers.
    threshold: number;
}

function heightStats(gen: HeightFun, sampling: HeightSamplerI): heightStats {
    const heights = [];
    for (let x = 0; x < sampling.size; ++x)
        for (let y = 0; y < sampling.size; ++y)
            heights.push(gen(x, y));
    return numStats(heights).outlierBounds(sampling.threshold);
}

///////////
// Noise //

export interface SimplexI { seed: number }
export class Simplex extends HeightFieldBuilder2 {
    seed: number;

    constructor(fields: SimplexI) { super(); Object.assign(this, fields); }
    get low(): number { return -1 }
    get high(): number { return 1 }
    build(): HeightFun { return createNoise2D(createLCG(this.seed)) }
}

export interface LayersI {
    fundamental: number;
    octaves: number;
    persistence: number;
    lacunarity: number;
}
function layerNoise(noise: HeightFun, layers: LayersI): HeightFun {
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

interface LayerSamplingI extends HeightSamplerI { fundamental: number }
export class LayeredI<Noise extends HeightFieldBuilder2> {
    noise: Noise;
    layers: LayersI;
    sampling: LayerSamplingI;
}

export class Layered<Noise extends HeightFieldBuilder2> extends HeightFieldBuilder2 {
    layers: LayersI;
    noise: Noise;
    sampling: LayerSamplingI;

    bounds: heightStats;

    constructor(public fields: LayeredI<Noise>) {
        super();
        Object.assign(this, fields);
        this.resample();
    }

    get low(): number { return this.bounds.low }
    get high(): number { return this.bounds.high }
    resample(): void { this.bounds = heightStats(this.sampler(), this.sampling) }
    build(): HeightFun { return layerNoise(this.noise.build(), this.layers) }
    private sampler(): HeightFun {
        const layers = clone(this.layers); layers.fundamental = 1;
        return layerNoise(this.noise.build(), layers);
    }
}

/////////////////////
// Post-processing //

interface HeightPostProcessI {
    terracing: number;
}
export class HeightPostProcess<Noise extends HeightFieldBuilder2> extends HeightFieldBuilder2 {
    terracing: number;

    constructor(public base: Noise, fields: HeightPostProcessI) { super(); Object.assign(this, fields); }

    get low(): number { return this.base.low }
    get high(): number { return this.base.high }
    build(): HeightFun {
        const basefun = this.base.build();
        if (this.terracing > 0) {
            const step = this.terracing * (this.high - this.low);
            return (x, y) => Math.round(basefun(x, y) / step) * step;
        }
        return basefun;
    }
}
