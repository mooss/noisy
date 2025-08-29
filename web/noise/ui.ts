import { Panel } from "../gui/gui.js";
import { GameCallbacks } from "../state/state.js";
import { foreachEntries } from "../utils/objects.js";
import { Layered } from "./algorithms.js";
import { NoiseMap, ProcessingPipelineMap } from "./containers.js";
import { NoiseMakerI } from "./foundations.js";

export function noiseUI(noise: NoiseMakerI, root: Panel, cb: GameCallbacks) {
    noiseUI_impl(noise, root, () => {
        noise.recompute();
        cb.terrain.recompute();
    });
}

function noiseUI_impl(noise: NoiseMakerI, root: Panel, cb: () => void) {
    if (!noise) return; // Noise classes might be empty for encoding purposes.
    switch (noise.class) {
        case 'Simplex':
            root.number(noise.p, 'seed').legend('Seed').onChange(cb);
            return;
        case 'Ridge':
            root.number(noise.p, 'seed').legend('Seed').onChange(cb);
            root.bool(noise.p, 'invert').legend('Invert').onChange(cb);
            root.bool(noise.p, 'square').legend('Square').onChange(cb);
            return;
        case 'Layered':
            return layeredUI(noise as any, root, cb);
        case 'ContinentalMix':
            noiseUI_impl(noise.p.bass, root.folder('Bass'), cb);
            noiseUI_impl(noise.p.treble, root.folder('Treble'), cb);
            const mix = root.folder('Mixing');
            mix.range(noise.p.threshold, 'low', 0, 1, .02).legend('Low').onChange(cb);
            mix.range(noise.p.threshold, 'mid', 0, 1, .02).legend('Mid').onChange(cb);
            mix.range(noise.p.threshold, 'high', 0, 1, .02).legend('High').onChange(cb);
            return;
        case 'ProcessingMap':
            mapUI(noise as ProcessingPipelineMap, root, cb, 'Terracing');
            return noiseUI_impl(noise.p.wrapped, root, cb);
        case 'Map':
            return mapUI(noise as NoiseMap<any, any>, root, cb, 'Height');
        case 'Terracing':
            root.range(noise.p, 'steps', 0, 100, 1).legend('Terraces').onInput(cb);
            return noiseUI_impl(noise.p.wrapped, root, cb);
        case 'Warping':
            const wrp = root.folder('Warping');
            wrp.range(noise.p, 'strength', 0, .2, .01).legend('Strength').onInput(cb);
            wrp.range(noise.p, 'frequency', 0, 4, .05).legend('Frequency').onInput(cb);
            noiseUI_impl(noise.p.warper, wrp, cb);
            return noiseUI_impl(noise.p.wrapped, root, cb);
        case 'ProcessingPipeline':
            return noiseUI_impl(noise.p.top, root, cb);
        case 'NoisyTerracing':
            root.range(noise.p, 'min', 0, 100, 1).legend('Min terraces').onInput(cb);
            root.range(noise.p, 'max', 0, 100, 1).legend('Max terraces').onInput(cb);
            noiseUI_impl(noise.p.terracer, root, cb);
            return noiseUI_impl(noise.p.wrapped, root, cb);
        default:
    }
    console.warn('Unknow noise class in UI:', noise.class, 'recursing anyway');
    foreachEntries((_, value) => noiseUI_impl(value as NoiseMakerI, root, cb), noise);
}

function mapUI(noise: NoiseMap<any, any>, root: Panel, cb: () => void, title: string) {
    const pick = noise as NoiseMap<any, any>;
    const algos = pick.p.algorithms;
    const deck = root.folder(title).deck();
    for (const key in algos) {
        const card = deck.card(key);
        if (key === pick.p.current) card.focus();
        card.onClick(() => {
            pick.algorithm = key;
            cb();
        });
        const alg = algos[key];
        noiseUI_impl(alg, card, cb);
    }
}

function layeredUI(layered: Layered<any>, root: Panel, cb: () => void) {
    const noisef = root.folder('Noise');
    noiseUI_impl(layered.p.noise, noisef, cb);

    const lay = layered.p.layers;
    noisef.range(lay, 'fundamental', .1, 5, .1).legend('Fundamental').onInput(cb);
    noisef.range(lay, 'octaves', 1, 8, 1).legend('Octaves').onInput(cb);
    noisef.range(lay, 'persistence', .1, 1, .05).legend('Persistence').onInput(cb);
    noisef.range(lay, 'lacunarity', .05, 2, .05).legend('Lacunarity').onInput(cb);

    // // Clutters the interface and there is rarely a need to change it.
    // // There should be a way in the interface to toggle advanced settings.
    // const samplingf = root.folder('Sampling').close();
    // const sam = layered.p.sampling;
    // samplingf.range(sam, 'size', 10, 100, 10).legend('Size').onInput(cb);
    // samplingf.range(sam, 'threshold', 2, 3.5, .1).legend('Threshold').onInput(cb);
    // samplingf.range(sam, 'fundamental', .1, 5, .1).legend('Fundamental').onInput(cb);
}
