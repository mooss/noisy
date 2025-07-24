import { Panel } from "../gui/gui.js";
import { Layered, NoiseMap } from "./algorithms.js";
import { NoiseMakerI } from "./foundations.js";

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

export function noiseUI(noise: NoiseMakerI, root: Panel, callbacks: NoiseCallbackI) {
    noiseUI_impl(noise, root, new NoiseCallback(callbacks, noise));
}

function noiseUI_impl(noise: NoiseMakerI, root: Panel, cb: NoiseCallback) {
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
            noiseUI_impl(noise.p.bass, root.folder('Bass'), cb);
            noiseUI_impl(noise.p.treble, root.folder('Treble'), cb);
            root.range(noise.p.threshold, 'low', 0, 1, .02).legend('Low').onChange(cb.regen);
            root.range(noise.p.threshold, 'mid', 0, 1, .02).legend('Mid').onChange(cb.regen);
            root.range(noise.p.threshold, 'high', 0, 1, .02).legend('High').onChange(cb.regen);
            return;
        case 'Map':
            const pick = noise as NoiseMap;
            root.range(pick.p.postProcess, 'terracing', 0, .1, .01).legend('Terracing').onInput(cb.regen);
            const algos = pick.p.algorithms;
            const deck = root.deck();
            for (const key in algos) {
                const card = deck.card(key).onClick(() => {
                    pick.algorithm = key;
                    cb.regen();
                });
                noiseUI_impl(algos[key], card, cb);
            }
            return;
    }
}

function layeredUI(layered: Layered<any>, root: Panel, cb: NoiseCallback) {
    const noisef = root.folder('Noise');
    noiseUI_impl(layered.p.noise, noisef, cb);

    const lay = layered.p.layers;
    noisef.range(lay, 'fundamental', .1, 5, .1).legend('Fundamental').onInput(cb.regen);
    noisef.range(lay, 'octaves', 1, 8, 1).legend('Octaves').onInput(cb.regen);
    noisef.range(lay, 'persistence', .1, 1, .05).legend('Persistence').onInput(cb.regen);
    noisef.range(lay, 'lacunarity', .05, 2, .05).legend('Lacunarity').onInput(cb.regen);

    const samplingf = root.folder('Sampling').close();
    const sam = layered.p.sampling;
    samplingf.range(sam, 'size', 10, 100, 10).legend('Size').onInput(cb.regen);
    samplingf.range(sam, 'threshold', 2, 3.5, .1).legend('Threshold').onInput(cb.regen);
    samplingf.range(sam, 'fundamental', .1, 5, .1).legend('Fundamental').onInput(cb.regen);
}
