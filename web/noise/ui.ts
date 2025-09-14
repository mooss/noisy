import { Panel } from "../gui/gui.js";
import { GameCallbacks } from "../state/state.js";
import { foreachEntries } from "../utils/objects.js";
import { Layered } from "./algorithms.js";
import { NoiseMap, ProcessingPipelineMap } from "./containers.js";
import { NoiseMakerI } from "./foundations.js";
import { tips } from "../ui/tips.js";

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
            root.number(noise.p, 'seed')
                .label('Seed').tooltip(tips.simplex_seed).onChange(cb);
            return;
        case 'Ridge':
            root.number(noise.p, 'seed')
                .label('Seed').tooltip(tips.simplex_seed).onChange(cb);
            root.bool(noise.p, 'invert')
                .label('Invert').tooltip(tips.ridge_invert).onChange(cb);
            root.bool(noise.p, 'square')
                .label('Square').tooltip(tips.ridge_square).onChange(cb);
            return;
        case 'Layered':
            return layeredUI(noise as any, root, cb);
        case 'ContinentalMix':
            noiseUI_impl(noise.p.treble, root.folder('Mountains').tooltip(tips.continental_treble), cb);
            noiseUI_impl(noise.p.bass, root.folder('Hills').tooltip(tips.continental_bass), cb);
            const mix = root.folder('Mixing').tooltip(tips.continental_threshold);
            mix.range(noise.p.threshold, 'low', 0, 1, .02)
                .label('Low').tooltip(tips.continental_low).onChange(cb);
            mix.range(noise.p.threshold, 'high', 0, 1, .02)
                .label('High').tooltip(tips.continental_high).onChange(cb);
            mix.range(noise.p.threshold, 'mid', 0, 1, .02)
                .label('Mid').tooltip(tips.continental_mid).onChange(cb);
            return;
        case 'ProcessingMap':
            mapUI(noise as ProcessingPipelineMap, root, cb, 'Terracing');
            return noiseUI_impl(noise.p.wrapped, root, cb);
        case 'Map':
            return mapUI(noise as NoiseMap<any>, root, cb, 'Height');
        case 'Terracing':
            root.range(noise.p, 'steps', 0, 100, 1)
                .label('Terraces').onInput(cb).tooltip(tips.terracing_steps);
            return;
        case 'Warping':
            const wrp = root.folder('Warping').tooltip(tips.warping);
            wrp.range(noise.p, 'strength', 0, .2, .01)
                .label('Strength').tooltip(tips.warping_strength).onInput(cb);
            wrp.range(noise.p, 'frequency', 0, 4, .05)
                .label('Frequency').tooltip(tips.warping_frequency).onInput(cb);
            noiseUI_impl(noise.p.warper, wrp, cb);
            return noiseUI_impl(noise.p.wrapped, root, cb);
        case 'ProcessingPipeline':
            return noiseUI_impl(noise.p.top, root, cb);
        case 'NoisyTerracing':
            root.range(noise.p, 'min', 0, 100, 1)
                .label('Min terraces').tooltip(tips.noisy_terrace_min).onInput(cb);
            root.range(noise.p, 'max', 0, 100, 1)
                .label('Max terraces').tooltip(tips.noisy_terrace_max).onInput(cb);
            noiseUI_impl(noise.p.terracer, root.folder('Noise').tooltip(tips.noisy_terracer), cb);
            return noiseUI_impl(noise.p.wrapped, root, cb);
        case 'Tiling':
            const tilef = root.folder('Tiling').tooltip(tips.tiling);
            if (!noise.p.enabled) tilef.close();
            tilef.bool(noise.p, 'enabled')
                .label('Enabled').tooltip(tips.tiling_enabled).onInput(cb);
            tilef.range(noise.p, 'coorscale', 1, 50, 1)
                .label('Coordinates scale').tooltip(tips.tiling_coorscale).onInput(cb);
            tilef.range(noise.p, 'noisescale', 0, 6, .2)
                .label('Noise scale').tooltip(tips.tiling_noisescale).onInput(cb);
            return noiseUI_impl(noise.p.wrapped, root, cb);
        default:
    }
    console.warn('Unknow noise class in UI:', noise.class, 'recursing anyway');
    foreachEntries((_, value) => noiseUI_impl(value as NoiseMakerI, root, cb), noise);
}

// The functional nature of UI definition forces us to hardcode tooltip-deduction logic here.
// Really highlights the need to move to a declarative UI.
function title2tooltip(title: string): string {
    switch (title) {
        case 'Constant':
            return tips.terracing_constant;
        case 'Noisy':
            return tips.terracing_noisy;
        case 'Simplex':
            return tips.simplex;
        case 'Ridge':
            return tips.ridge;
        case 'Continental mix':
            return tips.continental_mix;
        case 'Terracing':
            return tips.terracing;
        case 'Height':
            //TIP: height Algorithm generating the height of the terrain.
            return tips.height;
    }
}
interface tooltiper { tooltip(tip: string): void; }
function addTooltip(title: string, ui: tooltiper) {
        const tooltip = title2tooltip(title);
        if (tooltip != null) ui.tooltip(tooltip);
}

function mapUI(noise: NoiseMap<any>, root: Panel, cb: () => void, title: string) {
    const pick = noise as NoiseMap<any>;
    const algos = pick.p.algorithms;
    const fold = root.folder(title);
    const deck = fold.deck();
    addTooltip(title, fold);

    for (const key in algos) {
        const card = deck.card(key);
        if (key === pick.p.current) card.focus();
        card.onClick(() => {
            pick.algorithm = key;
            cb();
        });
        const alg = algos[key];

        addTooltip(key, card);

        noiseUI_impl(alg, card, cb);
    }
}

function layeredUI(layered: Layered<any>, root: Panel, cb: () => void) {
    noiseUI_impl(layered.p.noise, root, cb);

    const lay = layered.p.layers;
    root.range(lay, 'fundamental', .1, 5, .1)
        .label('Fundamental').tooltip(tips.layers_fundamental).onInput(cb);
    root.range(lay, 'octaves', 1, 8, 1)
        .label('Octaves').tooltip(tips.layers_octaves).onInput(cb);
    root.range(lay, 'persistence', .1, 1, .05)
        .label('Persistence').tooltip(tips.layers_persistence).onInput(cb);
    root.range(lay, 'lacunarity', 1, 2, .02)
        .label('Lacunarity').tooltip(tips.layers_lacunarity).onInput(cb);

    // // Clutters the interface and there is rarely a need to change it.
    // // There should be a way in the interface to toggle advanced settings.
    // const samplingf = root.folder('Sampling').close();
    // const sam = layered.p.sampling;
    // samplingf.range(sam, 'size', 10, 100, 10).legend('Size').onInput(cb);
    // samplingf.range(sam, 'threshold', 2, 3.5, .1).legend('Threshold').onInput(cb);
    // samplingf.range(sam, 'fundamental', .1, 5, .1).legend('Fundamental').onInput(cb);
}
