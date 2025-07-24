import { mapEntries } from "../utils.js";
import { ContinentalMix, Layered, NoiseMap, NoisePostProcess, Ridge, Simplex } from "./algorithms.js";
import { NoiseClass, NoiseMakerI } from "./foundations.js";

/**
 * Recursively encode an object by calling the encode method on all its value, leaving the values as
 * is when there is no encode method.
 */
export function encodeNoise(obj: any): Object {
    if (obj == null) return;

    if (typeof obj?.class === 'string') {
        return { meta: { class: obj.class }, params: encodeNoise(obj.p) }
    }

    return mapEntries(encodeNoise, obj);
}

/**
 * Instanciates the recursive entanglement of noise and parameters specifications.
 */
export function decodeNoise(encoded: any): NoiseMakerI {
    return decodeNoiseImpl(encoded) as NoiseMakerI;
}

export function decodeNoiseImpl(encoded: any): any {
    if (encoded == null) return;
    const rec = (): any => decodeNoiseImpl(encoded.params);

    switch (encoded?.meta?.class as NoiseClass) {
        case 'Simplex':
            return new Simplex(rec());
        case 'Layered':
            return new Layered(rec());
        case 'Ridge':
            return new Ridge(rec());
        case 'ContinentalMix':
            return new ContinentalMix(rec());
        case 'PostProcess':
            return new NoisePostProcess(rec());
        case 'Map':
            return new NoiseMap(rec());
        default:
    }

    return mapEntries(decodeNoiseImpl, encoded);
}
