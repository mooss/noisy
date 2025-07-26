import { Codec, CodecABC, Lexon64 } from "../utils/encoding.js";
import { NoiseMakerI, NoiseRegistry } from "./foundations.js";

export class NoiseCodec extends CodecABC<NoiseMakerI, string> {
    codec: Codec<any, string>;

    constructor(reference: NoiseMakerI) {
        super();
        this.codec = new Lexon64(
            reference.encode(),
            'abcdefghijklmnopqrstuwvxyzABCDEFGHIJKLMNOPQRSTUWVXYZ',
        );
    }

    encode(document: NoiseMakerI): string {
        return this.codec.encode(document.encode());
    }

    decode(document: string): NoiseMakerI {
        return NoiseRegistry.decode(this.codec.decode(document));
    }
}
