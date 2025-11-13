import { encrec, SelfEncoded, SelfEncoder } from "../encoding/self-encoder.js";
import { rangeMapper } from "../maths/maths.js";

// Noise functions, processing and data structures that can be encoded and decoded.
export type NoiseClass =
    // Noise functions.
    'Simplex' | 'Ridge' | 'Layered' | 'ContinentalMix' | 'Stacked'
    // Terracing.
    | 'Terracing' | 'VoxelTerracing'
    // Tiling.
    | 'QuadTiling' | 'SineTiling' | 'MirroredTiling'
    // Transforms.
    | 'Steepness' | 'Exponentiation'
    // Other processing algorithms.
    | 'Warping' | 'Clustering' | 'Identity'
    // Noise data structures.
    | 'NoisePipeline' | 'AlgoPicker' | 'PipelinePicker';

/** A height function, takes (x,y) coordinates and returns a height. */
export type NoiseFun = (x: number, y: number) => number;

export interface NoiseMakerI<Params = any> extends SelfEncoder<Params> {
    /** Configuration parameters for the noise generator. */
    p: Params;
    /** Tag identifying the concrete class implementing the NoiseMakerI interface. */
    readonly class: NoiseClass;

    /** The estimated low bound of the noise function. */
    get low(): number;

    /** The estimated high bound of the noise function. */
    get high(): number;

    /** Returns a function that generates raw noise values for the given coordinates. */
    make(): NoiseFun;

    /**
     * Recomputes any internal state or derived parameters.
     * This operation may be expensive but is required when critical parameters have changed.
     */
    recompute(): void;

    /**
     * Returns a noise function whose output is linearly mapped from the estimated `[low, high]`
     * range of the raw noise into the specified `[low, high]` interval.
     */
    normalised(low: number, high: number): NoiseFun;
}

export abstract class NoiseMakerBase<Params = any> implements NoiseMakerI<Params> {
    p: Params;
    abstract readonly class: NoiseClass;
    constructor(params: Params) { this.p = params }

    abstract make(): NoiseFun;
    abstract get low(): number;
    abstract get high(): number;
    recompute(): void { }

    /**
     * Encodes the instance into a self-contained decodable object.
     * @param encoder – Function that converts the parameters into a plain object
     */
    encode(encoder = encrec): SelfEncoded<Params> {
        return { '#meta': { class: this.class }, ...encoder(this.p) };
    }

    /**
     * Returns a noise function whose output is linearly mapped from the estimated `[low, high]`
     * range of the raw noise into the specified `[low, high]` interval.
     */
    normalised(low: number, high: number): NoiseFun {
        const mapper = rangeMapper(this.low, this.high, low, high);
        const fun = this.make();
        return (x, y) => { return mapper(fun(x, y)) }
    }
}
