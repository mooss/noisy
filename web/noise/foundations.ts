import { rangeMapper } from "../utils.js";

export type NoiseClass = 'Simplex' | 'Layered' | 'Ridge' | 'ContinentalMix' | 'PostProcess' | 'Map' | 'Terracing';

/** A height function, takes (x,y) coordinates and returns a height. */
export type NoiseFun = (x: number, y: number) => number;

export interface NoiseMakerI<Params = any> {
    p: Params;
    readonly class: NoiseClass;

    /** The estimated low bound of the noise function. */
    get low(): number;

    /** The estimated high bound of the noise function. */
    get high(): number;

    /** Returns a raw noise function. */
    make(): NoiseFun;

    /**
     * Recomputes the noise parameters, which may be costly but necessary when important parameters
     * have changed.
     */
    recompute(): void;

    /** Returns an EncodedNoise instance that can be used to recreate the noise class. */
    // encode(): any;

    /**
     * Returns a noise function roughly normalised through linear interpolation between the
     * estimated low and high bound.
     */
    normalised(low: number, high: number): NoiseFun;
}

export function normaliseNoiseMaker(noise: NoiseMakerI, low: number, high: number): NoiseFun {
    const mapper = rangeMapper(noise.low, noise.high, low, high);
    const fun = noise.make();
    return (x, y) => { return mapper(fun(x, y)); }
}
