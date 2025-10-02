import { encrec, SelfEncoded, SelfEncoder } from "../encoding/self-encoder.js";
import { rangeMapper } from "../utils/maths.js";

/////////////////
// Noisemaking //

// Noise functions, processing and data structures that can be encoded and decoded.
export type NoiseClass =
    // Noise functions.
    'Simplex' | 'Ridge' | 'Layered' | 'ContinentalMix'
    // Noise processing.
    | 'Terracing' | 'NoisyTerracing' | 'Warping' | 'Tiling'
    // Noise data structures.
    | 'NoisePipeline' | 'AlgoPicker' | 'PipelinePicker';

/** A height function, takes (x,y) coordinates and returns a height. */
export type NoiseFun = (x: number, y: number) => number;

export interface NoiseMakerI<Params = any> extends SelfEncoder<Params> {
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
