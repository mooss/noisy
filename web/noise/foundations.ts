import { encrec, SelfEncoded, SelfEncoder } from "../encoding/self-encoder.js";
import { rangeMapper } from "../utils/maths.js";

/////////////////
// Noisemaking //

export type NoiseClass = 'Simplex' | 'Layered' | 'Ridge' | 'ContinentalMix' | 'Map' | 'Terracing'
 | 'Warping' | 'ProcessingPipeline' | 'NoisyTerracing' | 'ProcessingMap';

/** A height function, takes (x,y) coordinates and returns a height. */
export type NoiseFun = (x: number, y: number) => number;

export interface NoiseMakerI<Params = any> extends SelfEncoder {
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
    encode(): SelfEncoded { return { meta: { class: this.class }, params: encrec(this.p) } }

    normalised(low: number, high: number): NoiseFun {
        const mapper = rangeMapper(this.low, this.high, low, high);
        const fun = this.make();
        return (x, y) => { return mapper(fun(x, y)) }
    }
}
