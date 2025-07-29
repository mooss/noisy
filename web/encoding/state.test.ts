import { initialState } from '../init.js';
import { ContinentalMix, Layered, NoiseMap, Ridge, Simplex } from '../noise/algorithms.js';
import { NoiseMakerI } from '../noise/foundations.js';
import { noiseAlgorithms } from '../noise/init.js';
import { Terracing } from '../noise/processing.js';
import { StateRegistry } from '../state/state.js';
import { AutoCodec, Lexon64 } from './codecs.js';

describe('NoiseCodec', () => {
    let reference: NoiseMakerI;
    let codec: AutoCodec<string>;

    beforeEach(() => {
        reference = noiseAlgorithms();
        const strCodec = new Lexon64(
            reference.encode(),
            'abcdefghijklmnopqrstuwvxyzABCDEFGHIJKLMNOPQRSTUWVXYZ',
        );
        codec = new AutoCodec(strCodec, StateRegistry);
    });

    describe('constructor', () => {
        it('should create a codec instance', () => {
            expect(codec).toBeInstanceOf(AutoCodec);
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
                        'test': new Simplex({ seed: 42 })
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

        it('should handle arrays', () => {
            const lost = [4, 8, 15, 16, 23, 42, { sum: 108 }];
            const decoded = codec.roundtrip(lost);
            expect(decoded).toEqual(lost);
        });
    });

    describe('roundtrip', () => {
        it('encode reference should be the same as encoding roundtrip', () => {
            const rt = codec.roundtrip(reference);
            expect(codec.encode(rt)).toEqual(codec.encode(reference));
        });

        it('should roundtrip complete game state unchanged from codec trained on subset', () => {
            const gameState = initialState();
            const roundtripped = codec.roundtrip(gameState);
            expect(codec.encode(roundtripped)).toEqual(codec.encode(gameState));
        });
    });
});
