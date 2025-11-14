import { Panel } from "../gui/panels/panel.js";
import { Layered } from "../noise/algorithms/layered.js";
import { Union, UnionOperation } from "../noise/algorithms/union.js";
import { AlgoPicker } from "../noise/containers.js";
import { NoiseMakerI } from "../noise/foundations.js";
import { PipelinePicker } from "../noise/processing/pipeline.js";
import { GameCallbacks } from "../state/state.js";
import { tips } from "../ui/tips.js";
import { foreachEntries } from "../utils/objects.js";

export function noiseUI(noise: NoiseMakerI, root: Panel, cb: GameCallbacks) {
    noiseUI_impl(noise, root, () => {
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
                .label('Low').tooltip(tips.continental_low).onInput(cb);
            mix.range(noise.p.threshold, 'high', 0, 1, .02)
                .label('High').tooltip(tips.continental_high).onInput(cb);
            mix.range(noise.p.threshold, 'mid', 0, 1, .02)
                .label('Mid').tooltip(tips.continental_mid).onInput(cb);
            return;
        case 'PipelinePicker':
            mapUI(noise as PipelinePicker, root, cb, noise.p.tag);
            return noiseUI_impl(noise.p.wrapped, root, cb);
        case 'AlgoPicker':
            return mapUI(noise as AlgoPicker<any>, root, cb, 'Height');
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
        case 'Union':
            const union = noise as Union;
            const opmap: Record<string, UnionOperation> = {
                'Sum': 'sum',
                'Minimum': 'min',
                'Maximum': 'max',
            }
            root.map(union.p, 'operation', opmap)
                .label('Operation').tooltip(tips.union_operation).onChange(cb);

            union.p.octaves.forEach((octave, i) => {
                const octFold = root.folder(octave.name).tooltip(`Octave ${i + 1} configuration`);
                octFold.range(octave, 'frequency', 0, 10, 0.1)
                    .label('Frequency').tooltip(tips.union_frequency).onInput(cb);
                octFold.range(octave, 'amplitude', 0, 100, 0)
                    .label('Amplitude').tooltip(tips.union_amplitude).onInput(cb);
                noiseUI_impl(octave.noise, octFold, cb);
            });
            return;
        case 'NoisePipeline':
            noiseUI_impl(noise.p.base, root, cb);
            for (const pipe of noise.p.pipeline) {
                noiseUI_impl(pipe, root, cb);
            }
            return
        case 'Clustering':
            const tilef = root.folder('Clustering').tooltip(tips.clustering);
            if (!noise.p.enabled) tilef.close();
            tilef.bool(noise.p, 'enabled')
                .label('Enabled').tooltip(tips.clustering_enabled).onInput(cb);
            tilef.range(noise.p, 'coorscale', 1, 50, 1)
                .label('Coordinates scale').tooltip(tips.clustering_coorscale).onInput(cb);
            tilef.range(noise.p, 'noisescale', 0, 6, .2)
                .label('Noise scale').tooltip(tips.clustering_noisescale).onInput(cb);
            return noiseUI_impl(noise.p.wrapped, root, cb);
        case 'MirroredTiling':
            root.bool(noise.p, 'normalizeX')
                .label('Normalize X').tooltip(tips.tilling_mirrored_fraction_x).onInput(cb);
            return root.bool(noise.p, 'normalizeY')
                .label('Normalize Y').tooltip(tips.tilling_mirrored_fraction_y).onInput(cb);
        case 'QuadTiling':
        case 'SineTiling':
        case 'Identity':
        case 'VoxelTerracing':
            return;
        case 'Steepness':
            return root.range(noise.p, 'factor', 0, 10, .1)
                .label('Strength').tooltip(tips.steepness_factor).onInput(cb);
        case 'Exponentiation':
            return root.range(noise.p, 'exponent', 0, 10, .1).
                label('Exponent').tooltip(tips.exponentiation_exponent).onInput(cb);
        default:
    }
    console.warn('Unknow noise class in UI:', noise.class, 'recursing anyway');
    foreachEntries((_, value) => noiseUI_impl(value as NoiseMakerI, root, cb), noise);
}

const ttTerracing = {
    Constant: tips.terracing_constant,
    Voxel: tips.terracing_voxels,
}

const ttHeight = {
    Simplex: tips.simplex,
    Ridge: tips.ridge,
    'Continental mix': tips.continental_mix,
    'Cursive mountains': tips.union,
}

const ttTiling = {
    None: tips.tiling_none,
    Quad: tips.tiling_quad,
    Mirrored: tips.tiling_mirrored,
    Sine: tips.tiling_sine,
}

const ttTransform = {
    None: tips.transform_none,
    Steepness: tips.steepness,
    Exponentiation: tips.exponentiation,
}

const ttTitles = {
    Tiling: tips.tiling,
    Terracing: tips.terracing,
    //TIP: height Algorithm generating the height of the terrain.
    Height: tips.height,
    Transform: tips.transforms,
}

interface tooltiper { tooltip(tip: string): void; }
function addTooltip(title: string, ui: tooltiper, tips: Record<string, string>) {
    const tooltip = tips[title];
    if (tooltip != null) ui.tooltip(tooltip);
}

function mapUI(noise: AlgoPicker<any>, root: Panel, cb: () => void, title: string) {
    const tips = {
        Height: ttHeight,
        Tiling: ttTiling,
        Terracing: ttTerracing,
        Transform: ttTransform,
    }[title];

    const pick = noise as AlgoPicker<any>;
    const algos = pick.p.algorithms;
    const fold = root.folder(title);
    const deck = fold.deck();
    addTooltip(title, fold, ttTitles);

    for (const key in algos) {
        const card = deck.card(key);
        if (key === pick.p.current) card.focus();
        card.onClick(() => {
            pick.algorithm = key;
            cb();
        });
        const alg = algos[key];

        addTooltip(key, card, tips);
        noiseUI_impl(alg, card, cb);
    }
}

function layeredUI(layered: Layered<any>, root: Panel, cb: () => void) {
    noiseUI_impl(layered.p.noise, root, cb);

    const lay = layered.p.layers;
    root.range(lay, 'fundamental', .05, 1, .05)
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
