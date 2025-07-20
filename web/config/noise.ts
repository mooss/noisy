import { createNoise2D } from "simplex-noise";
import { createLCG } from "../rng.js";
import { numStats } from "../stats.js";
import { rangeMapper } from "../utils.js";

/** A height function, takes (x,y) coordinates and returns a height. */
export type HeightFun = (x: number, y: number) => number;

interface HeightFieldBuilderI {
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

export interface LayeredI {
    fundamental: number;
    octaves: number;
    persistence: number;
    lacunarity: number;
    samplingFundamental: number;
}
export class Layered <Noise extends HeightFieldBuilder2> extends HeightFieldBuilder2 {
    fundamental: number;
    octaves: number;
    persistence: number;
    lacunarity: number;
    samplingFundamental: number;
    bounds: heightStats;

    constructor(public base: Noise, fields: LayeredI, sampling: HeightSamplerI) {
        super();
        Object.assign(this, fields);
        this.bounds = heightStats(this.sampler(), sampling);
    }

    get low(): number { return this.bounds.low }
    get high(): number { return this.bounds.high }

    private sampler(): HeightFun {
        return this.build(this.samplingFundamental);
    }

    build(fundamental: number = this.fundamental): HeightFun {
        const fun = this.base.build();
        return (x: number, y: number): number => {
            let res = 0;
            let frequency = fundamental;
            let amplitude = 1;

            for (let oct = 0; oct < this.octaves; oct++) {
                // The noise is shifted with the octave index to avoid the artifact that occurs at the
                // origin when layering noise.
                // This artifact is probably due to the fact that the same base noise value is
                // accumulated at the origin, thus reinforcing the directionality that can occur in raw
                // noise.
                // I don't know where this idea that simplex has no directional artifacts because they
                // are very much visible in this project.
                let octave = fun(x * frequency + oct, y * frequency + oct + 10);
                res += octave * amplitude;

                // Update amplitude and frequency for the next octave.
                amplitude *= this.persistence;
                frequency *= this.lacunarity;
            }

            return res;
        }
    }

}

/////////////////////
// Post-processing //

interface HeightPostProcessI {
    terracing: number;
}
export class HeightPostProcess<Noise extends HeightFieldBuilder2> extends HeightFieldBuilder2 {
    terracing: number;

    constructor(public base: Noise, fields: HeightPostProcessI) { super(); Object.assign(this, fields) }

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
