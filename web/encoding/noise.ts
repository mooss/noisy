import { Codec, CodecABC, Lexon64 } from "./codecs.js";
import { NoiseMakerI } from "../noise/foundations.js";
import { StateRegistry } from "../state/state.js";

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
        return StateRegistry.decode(this.codec.decode(document));
    }
}
