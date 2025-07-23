import { ContinentalMix, Layered, NoiseMakerI, NoisePicker, Ridge, Simplex } from "../config/noise.js";
import { Panel } from "../gui/gui.js";
import { clone } from "../utils.js";

interface NoiseCallbackI {
    regenerateTerrain(): void;
}
class NoiseCallback {
    constructor(private cb: NoiseCallbackI, private noise: NoiseMakerI) { }
    get regen(): () => void {
        return () => {
            this.noise.recompute();
            this.cb.regenerateTerrain();
        }
    }
}

////////////////
// Algorithms //

function noiseUI(noise: NoiseMakerI, root: Panel, cb: NoiseCallback) {
    switch (noise.class) {
        case 'Simplex':
            root.number(noise.p, 'seed').legend('Seed').onChange(cb.regen);
            return;
        case 'Ridge':
            root.number(noise.p, 'seed').legend('Seed').onChange(cb.regen);
            root.bool(noise.p, 'invert').legend('Invert').onChange(cb.regen);
            root.bool(noise.p, 'square').legend('Square').onChange(cb.regen);
            return;
        case 'Layered':
            return layeredUI(noise as any, root, cb);
        case 'ContinentalMix':
            noiseUI(noise.p.bass, root.folder('Bass'), cb);
            noiseUI(noise.p.treble, root.folder('Treble'), cb);
            root.range(noise.p.threshold, 'low', 0, 1, .02).legend('Low').onChange(cb.regen);
            root.range(noise.p.threshold, 'mid', 0, 1, .02).legend('Mid').onChange(cb.regen);
            root.range(noise.p.threshold, 'high', 0, 1, .02).legend('High').onChange(cb.regen);
            return;
        case 'NoisePicker':
            const pick = noise as NoisePicker;
            root.range(pick.p.postProcess, 'terracing', 0, .1, .01).legend('Terracing').onInput(cb.regen);
            const algos = pick.p.algorithms;
            const deck = root.deck();
            for (const key in algos) {
                const card = deck.card(key).onClick(() => {
                    pick.algorithm = key;
                    cb.regen();
                });
                noiseUI(algos[key], card, cb);
            }
            return;
    }
}

function layeredUI(layered: Layered<any>, root: Panel, cb: NoiseCallback) {
    const noisef = root.folder('Noise');
    noiseUI(layered.p.noise, noisef, cb);

    const lay = layered.p.layers;
    noisef.range(lay, 'fundamental', .1, 5, .1).legend('Fundamental').onInput(cb.regen);
    noisef.range(lay, 'octaves', 1, 8, 1).legend('Octaves').onInput(cb.regen);
    noisef.range(lay, 'persistence', .1, 1, .05).legend('Persistence').onInput(cb.regen);
    noisef.range(lay, 'lacunarity', 1.1, 4, .1).legend('Lacunarity').onInput(cb.regen);

    const samplingf = root.folder('Sampling').close();
    const sam = layered.p.sampling;
    samplingf.range(sam, 'size', 10, 100, 10).legend('Size').onInput(cb.regen);
    samplingf.range(sam, 'threshold', 2, 5, .2).legend('Threshold').onInput(cb.regen);
    samplingf.range(sam, 'fundamental', .1, 5, .1).legend('Fundamental').onInput(cb.regen);
}

//////////////////
// Global panel //

export function noiseGenerationUI(
    root: Panel, picker: NoisePicker, callbacks: NoiseCallbackI,
) {
    const f = {
        base: { invert: true, square: false, seed: 23 },
        layers: {
            fundamental: .7,
            octaves: 8,
            persistence: .65,
            lacunarity: 1.5,
        },
        sampling: { size: 50, threshold: 4, fundamental: 3 },
    };
    const c = clone;

    const simplex = new Layered({
        noise: new Simplex(c(f.base)),
        layers: c(f.layers),
        sampling: c(f.sampling),
    });

    const ridge = new Layered({
        noise: new Ridge(c(f.base)),
        layers: c(f.layers),
        sampling: c(f.sampling),
    });

    const comix = new ContinentalMix({
        bass: new Layered({
            noise: new Simplex(c(f.base)),
            layers: {
                fundamental: 1.1,
                octaves: 7,
                persistence: .65,
                lacunarity: 1.5,
            },
            sampling: c(f.sampling),
        }),
        treble: new Layered({
            noise: new Ridge(c(f.base)),
            layers: {
                fundamental: .4,
                octaves: 8,
                persistence: .6,
                lacunarity: 1.6,
            },
            sampling: c(f.sampling),
        }),
        threshold: { low: .28, mid: .64, high: .56 },
    });

    picker.register('Simplex', simplex);
    picker.register('Ridge', ridge);
    picker.register('Continental mix', comix);
    picker.recompute();
    noiseUI(picker, root, new NoiseCallback(callbacks, picker));
}

