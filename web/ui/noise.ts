import { ContinentalMix, Layered, NoiseMakerI, NoisePicker, Ridge, Simplex } from "../config/noise.js";
import { Card, Deck, Panel } from "../gui/gui.js";
import { clone } from "../utils.js";

////////////////
// Algorithms //

type binder<Noise extends NoiseMakerI> = (root: Panel, noise: Noise, cb: NoiseCallback) => void;

export function simplexUI(root: Panel, noise: Simplex, cb: NoiseCallback) {
    root.number(noise.p, 'seed').legend('Seed').onChange(cb.regen);
}

export function ridgeUI(root: Panel, noise: Ridge, cb: NoiseCallback) {
    root.number(noise.p, 'seed').legend('Seed').onChange(cb.regen);
    root.bool(noise.p, 'invert').legend('Invert').onChange(cb.regen);
    root.bool(noise.p, 'square').legend('Square').onChange(cb.regen);
}

export function continentalMixUI(root: Panel, noise: ContinentalMix, cb: NoiseCallback) {
    root.range(noise.p.threshold, 'low', 0, 1, .02).legend('Low').onChange(cb.regen);
    root.range(noise.p.threshold, 'mid', 0, 1, .02).legend('Mid').onChange(cb.regen);
    root.range(noise.p.threshold, 'high', 0, 1, .02).legend('High').onChange(cb.regen);
}

export function layersUI<Noise extends NoiseMakerI>(
    card: Panel, laysim: Layered<Noise>, bind: binder<Noise>, cb: NoiseCallback,
) {
    const noisef = card.folder('Noise');
    bind(noisef, laysim.p.noise, cb);

    const lay = laysim.p.layers;
    noisef.range(lay, 'fundamental', .1, 5, .1).legend('Fundamental').onInput(cb.regen);
    noisef.range(lay, 'octaves', 1, 8, 1).legend('Octaves').onInput(cb.regen);
    noisef.range(lay, 'persistence', .1, 1, .05).legend('Persistence').onInput(cb.regen);
    noisef.range(lay, 'lacunarity', 1.1, 4, .1).legend('Lacunarity').onInput(cb.regen);

    const samplingf = card.folder('Sampling');
    const sam = laysim.p.sampling;
    samplingf.range(sam, 'size', 10, 100, 10).legend('Size').onInput(cb.regen);
    samplingf.range(sam, 'threshold', 2, 5, .2).legend('Threshold').onInput(cb.regen);
    samplingf.range(sam, 'fundamental', .1, 5, .1).legend('Fundamental').onInput(cb.regen);
}

//////////////////
// Global panel //

export function noiseGenerationUI(
    root: Panel, picker: NoisePicker, callbacks: NoiseCallbackI,
) {
    const ui = new NoiseUI(root, picker, callbacks);
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
    layersUI(ui.register(simplex, 'Simplex'), simplex, simplexUI, ui.cb);

    const ridge = new Layered({
        noise: new Ridge(c(f.base)),
        layers: c(f.layers),
        sampling: c(f.sampling),
    });
    layersUI(ui.register(ridge, 'Ridge'), ridge, ridgeUI, ui.cb);

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
        threshold: {low: .28, mid: .64, high: .56},
    });
    const conui = ui.register(comix, 'Continental mix');
    layersUI(conui.folder('Bass'), comix.p.bass, simplexUI, ui.cb);
    layersUI(conui.folder('Treble'), comix.p.treble, ridgeUI, ui.cb);
    continentalMixUI(conui, comix, ui.cb);
}

type callback = () => void;
interface NoiseCallbackI {
    regenerateTerrain(): void;
}
class NoiseCallback {
    constructor(private cb: NoiseCallbackI, private noise: NoiseMakerI) { }
    get regen(): callback {
        return () => {
            this.noise.recompute();
            this.cb.regenerateTerrain();
        }
    }
}
class NoiseUI {
    deck: Deck;
    cb: NoiseCallback;

    constructor(root: Panel, public picker: NoisePicker, cb: NoiseCallbackI) {
        this.cb = new NoiseCallback(cb, picker);
        root.range(this.picker.p.postProcess, 'terracing', 0, .1, .01)
            .legend('Terracing')
            .onInput(this.cb.regen);
        this.deck = root.deck();
    }

    register(algo: NoiseMakerI, title: string): Card {
        this.picker.register(title, algo);
        return this.deck.card(title).onClick(() => {
            this.picker.algorithm = title;
            this.cb.regen();
        });
    }
}

