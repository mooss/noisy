import { ContinentalMix, Layered, NoiseMap, Ridge, Simplex } from './algorithms.js';
import { NoiseCodec } from './encoding.js';
import { NoiseMakerI } from './foundations.js';
import { noiseAlgorithms } from './init.js';
import { Terracing } from './processing.js';

describe('NoiseCodec', () => {
    let reference: NoiseMakerI;
    let codec: NoiseCodec;

    beforeEach(() => {
        reference = noiseAlgorithms();
        codec = new NoiseCodec(reference);
    });

    describe('constructor', () => {
        it('should create a codec instance', () => {
            expect(codec).toBeInstanceOf(NoiseCodec);
            expect(codec.encode).toBeDefined();
            expect(codec.decode).toBeDefined();
        });
    });

    describe('encode/decode', () => {
        it('should roundtrip a noise algorithm unchanged', () => {
            const terraced = new Terracing({
                interval: 0.1,
                wrapped: new NoiseMap({
                    algorithms: {
                        'test': new Simplex({seed: 42})
                    }
                })
            });
            const decoded = codec.roundtrip(terraced);

            expect(decoded).toBeInstanceOf(Terracing);
            expect(decoded.class).toBe('Terracing');
            expect(decoded.p.interval).toEqual(0.1);

            const inner = decoded.p.wrapped;
            expect(inner).toBeInstanceOf(NoiseMap);
            expect(inner.class).toBe('Map');
            expect(inner.p.algorithms['test']).toBeInstanceOf(Simplex);
        });

        it('should handle Simplex noise', () => {
            const simplex = new Simplex({ seed: 42 });
            const decoded = codec.roundtrip(simplex);

            expect(decoded).toBeInstanceOf(Simplex);
            expect(decoded.class).toBe('Simplex');
            expect(decoded.p.seed).toBe(42);
        });

        it('should handle Ridge noise', () => {
            const ridge = new Ridge({ seed: 123, invert: true, square: false });
            const decoded = codec.roundtrip(ridge);

            expect(decoded).toBeInstanceOf(Ridge);
            expect(decoded.class).toBe('Ridge');
            expect(decoded.p.seed).toBe(123);
            expect(decoded.p.invert).toBe(true);
        });

        it('should handle Layered noise', () => {
            const layered = new Layered({
                noise: new Simplex({ seed: 7 }),
                layers: {
                    fundamental: 0.5,
                    octaves: 4,
                    persistence: 0.5,
                    lacunarity: 2.0
                },
                sampling: { size: 20, threshold: 2.0, fundamental: 2 }
            });
            const decoded = codec.roundtrip(layered);

            expect(decoded).toBeInstanceOf(Layered);
            expect(decoded.class).toBe('Layered');
            expect(decoded.p.layers.octaves).toBe(4);
            expect(decoded.p.noise).toBeInstanceOf(Simplex);
        });

        it('should handle ContinentalMix', () => {
            const mix = new ContinentalMix({
                bass: new Simplex({ seed: 1 }),
                treble: new Ridge({ seed: 2, invert: false, square: true }),
                threshold: { low: 0.1, mid: 0.5, high: 0.9 }
            });
            const decoded = codec.roundtrip(mix);

            expect(decoded).toBeInstanceOf(ContinentalMix);
            expect(decoded.class).toBe('ContinentalMix');
            expect(decoded.p.threshold.mid).toEqual(0.5);
            expect(decoded.p.bass).toBeInstanceOf(Simplex);
            expect(decoded.p.treble).toBeInstanceOf(Ridge);
        });

        it('should handle NoiseMap', () => {
            const map = new NoiseMap({
                algorithms: {
                    'test1': new Simplex({ seed: 1 }),
                    'test2': new Ridge({ seed: 2, invert: true, square: false })
                }
            });
            const decoded = codec.roundtrip(map);

            expect(decoded).toBeInstanceOf(NoiseMap);
            expect(decoded.class).toBe('Map');
            expect(Object.keys(decoded.p.algorithms)).toEqual(['test1', 'test2']);
            expect(decoded.p.algorithms['test1']).toBeInstanceOf(Simplex);
        });
    });

    describe('roundtrip', () => {
        it('should return identical noise after encode/decode', () => {
            const result = codec.roundtrip(reference);
            expect(result).toBeInstanceOf(Terracing);
            expect(result.class).toBe(reference.class);
            expect(result.p.interval).toEqual(reference.p.interval);
        });

        it('should maintain algorithm hierarchy', () => {
            const result = codec.roundtrip(reference) as Terracing;
            expect(result.p.wrapped).toBeInstanceOf(NoiseMap);
            const map = result.p.wrapped as NoiseMap;
            expect(map.p.algorithms['Simplex']).toBeInstanceOf(Layered);
        });
    });
});
