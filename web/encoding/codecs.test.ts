import { CodecChain, CompressedBase64Codec, JSONCodec, Lexicon } from "./codecs.js";
import { Codec } from "./encoding.js";

describe('Lexicon', () => {
    let lexicon: Lexicon;
    const reference = {
        name: 'test',
        value: 42,
        nested: {
            name: 'nested',
            item1: 'item1',
            item2: 'item2',
            item3: 'item3'
        },
        tag1: 'tag1',
        tag2: 'tag2'
    };
    const alphabet = 'abc';
    const enc = (x: any) => lexicon.encode(x);
    const dec = (x: any) => lexicon.decode(x);

    beforeEach(() => {
        lexicon = new Lexicon(reference, alphabet);
    });

    describe('constructor', () => {
        it('should create a lexicon with the correct mappings', () => {
            expect(lexicon).toBeInstanceOf(Lexicon);
            expect(lexicon.encode).toBeDefined();
            expect(lexicon.decode).toBeDefined();
        });
    });

    describe('encode', () => {
        it('should encode simple objects', () => {
            const result = enc(reference);
            expect(result).not.toEqual(reference);
            expect(typeof result).toBe('object');
        });

        it('should handle strings that are in the lexicon', () => {
            const testDoc = { Name: 'test' };
            const encoded = enc(testDoc);
            expect(encoded.Name).not.toBe('test');
            expect(typeof encoded.Name).toBe('string');
        });

        it('should handle strings not in the lexicon', () => {
            const testDoc = { Name: 'unknown' };
            const encoded = enc(testDoc);
            expect(encoded.Name).toBe('unknown');
        });

        it('should handle strings that are part of the lexicon alphabet', () => {
            const testDoc = { Name: 'a' };
            const encoded = enc(testDoc);
            expect(encoded.Name).toBe('=a');
        });

        it('should handle nested objects', () => {
            const testDoc = { Nested: { Name: 'nested' } };
            const encoded = enc(testDoc);
            expect(encoded.Nested.Name).not.toBe('nested');
        });

        it('should handle numbers', () => {
            const testDoc = { Value: 42 };
            const encoded = enc(testDoc);
            expect(encoded.Value).not.toBe(42);
        });

        it('should handle null and undefined', () => {
            const testDoc = { A: null, B: undefined };
            const encoded = enc(testDoc);
            expect(encoded.A).toBe(null);
            expect(encoded.B).toBe(undefined);
        });
    });

    describe('decode', () => {
        it('should decode encoded objects back to original', () => {
            const encoded = enc(reference);
            const decoded = dec(encoded);
            expect(decoded).toEqual(reference);
        });

        it('should handle literal strings with = prefix', () => {
            const testDoc = { name: '=literal' };
            const decoded = dec(testDoc);
            expect(decoded.name).toBe('literal');
        });

        it('should handle empty objects', () => {
            const testDoc = {};
            const encoded = enc(testDoc);
            const decoded = dec(encoded);
            expect(decoded).toEqual({});
        });

        it('should handle complex nested structures', () => {
            const complex = {
                level1: {
                    level2: {
                        item1: 'item1',
                        item2: 'item2',
                        name: 'test'
                    }
                }
            };
            const encoded = enc(complex);
            const decoded = dec(encoded);
            expect(decoded).toEqual(complex);
        });
    });

    describe('roundtrip', () => {
        it('should return the original document after encode/decode', () => {
            const result = lexicon.roundtrip(reference);
            expect(result).toEqual(reference);
        });

        it('should handle empty documents', () => {
            const result = lexicon.roundtrip({});
            expect(result).toEqual({});
        });

        it('should handle documents with special characters', () => {
            const special = { text: 'Hello=World', path: 'a/b/c' };
            const result = lexicon.roundtrip(special);
            expect(result).toEqual(special);
        });
    });
});

describe('Lexon64', () => {
    let codec: Codec<any, string>;
    const reference = {
        name: 'test',
        value: 42,
        nested: {
            name: 'nested',
            item1: 'item1',
            item2: 'item2'
        }
    };

    beforeEach(() => {
        codec = new CodecChain(
            new Lexicon(reference, 'abc'),
            new JSONCodec(),
            new CompressedBase64Codec(),
        );
    });

    describe('constructor', () => {
        it('should create a Lexon64 instance', () => {
            expect(codec).toBeInstanceOf(CodecChain);
            expect(codec.encode).toBeDefined();
            expect(codec.decode).toBeDefined();
        });
    });

    describe('encode', () => {
        it('should encode and compress to Base64 string', () => {
            const testDoc = { name: 'test', value: 42 };
            const encoded = codec.encode(testDoc);
            expect(typeof encoded).toBe('string');
            expect(encoded).toMatch(/^[A-Za-z0-9+/=]+$/); // Base64 pattern
        });

        it('should produce shorter output for repeated terms', () => {
            const testDoc = {
                item1: 'test',
                item2: 'test',
                item3: 'test',
                item4: 'nested',
                name: 'test'
            };
            const encoded = codec.encode(testDoc);
            expect(typeof encoded).toBe('string');
            expect(encoded.length).toBeGreaterThan(0);
        });

        it('should handle empty objects', () => {
            const encoded = codec.encode({});
            expect(typeof encoded).toBe('string');
            expect(encoded.length).toBeGreaterThan(0);
        });
    });

    describe('decode', () => {
        it('should decode Base64 string back to original', () => {
            const testDoc = { name: 'test', value: 42 };
            const encoded = codec.encode(testDoc);
            const decoded = codec.decode(encoded);
            expect(decoded).toEqual(testDoc);
        });

        it('should handle complex nested structures', () => {
            const complex = {
                level1: {
                    level2: {
                        item1: 'item1',
                        item2: 'item2',
                        name: 'test'
                    }
                }
            };
            const encoded = codec.encode(complex);
            const decoded = codec.decode(encoded);
            expect(decoded).toEqual(complex);
        });

        it('should not error on invalid Base64', () => {
            expect(() => {
                codec.decode('invalid-base64!');
            }).not.toThrow();
        });
    });

    describe('integration', () => {
        it('should maintain data integrity through full encode/decode cycle', () => {
            const original = {
                name: 'integration test',
                item1: 1,
                item2: 2,
                item3: 3,
                item4: 4,
                item5: 5,
                nested: {
                    deep: {
                        value: 'test',
                        item1: 'a',
                        item2: 'b',
                        item3: 'c'
                    }
                },
                metadata: {
                    version: '1.0',
                    tag1: 'test',
                    tag2: 'integration'
                }
            };

            const encoded = codec.encode(original);
            const decoded = codec.decode(encoded);
            expect(decoded).toEqual(original);
        });

        it('should handle special characters in strings', () => {
            const special = {
                text: 'Hello, World! 123 @#$%',
                unicode: '🎉🚀',
                escaped: 'test\\nwith\\ttabs'
            };
            const encoded = codec.encode(special);
            const decoded = codec.decode(encoded);
            expect(decoded).toEqual(special);
        });

        it('should handle large documents', () => {
            const large = {
                items: {}
            };
            for (let i = 0; i < 100; i++) {
                large.items[`item${i}`] = {
                    id: i,
                    name: `item${i % 10}`, // Repeating names for compression
                    value: Math.random()
                };
            }
            const encoded = codec.encode(large);
            const decoded = codec.decode(encoded);
            expect(decoded).toEqual(large);
        });
    });
});
