/**
 * Represents a codec that can encode values from one type to another and decode them back.
 *
 * @template From - The input type for encoding and output type for decoding.
 * @template To   - The output type for encoding and input type for decoding.
 */
export interface Codec<From, To> {
    /** Encodes a document */
    encode(document: From): To;

    /** Decodes a document */
    decode(document: To): From;

    /**
     * Encodes and decodes the document, supposed to result in the same document.
     * Can be used to verify the roundtrip consistency of the codec.
     */
    roundtrip(document: From): From;
}

/**
 * Abstract base class implementing the Codec interface.
 * Provides a default implementation for the roundtrip method.
 *
 * @template From - The input type for encoding and output type for decoding.
 * @template To - The output type for encoding and input type for decoding.
 */
export abstract class CodecABC<From, To> implements Codec<From, To> {
    /** Encodes a document */
    abstract encode(document: From): To;

    /** Decodes a document */
    abstract decode(document: To): From;

    /**
     * Encodes and decodes the document, supposed to result in the same document.
     * Can be used to verify the roundtrip consistency of the codec.
     */
    roundtrip(document: From): From {
        return this.decode(this.encode(document));
    }
}
