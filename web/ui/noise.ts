import { ContinentalMix, Layered, NoiseMakerI, NoisePicker, Ridge, Simplex } from "../config/noise.js";
import { Card, Deck, Panel } from "../gui/gui.js";
import { clone } from "../utils.js";

export interface NoiseMakerUI extends NoiseMakerI {
    bind(root: Panel, cb: NoiseCallback): void;
}

////////////////
// Algorithms //

export class SimplexUI extends Simplex {
    bind(root: Panel, cb: NoiseCallback) {
        root.number(this.p, 'seed').legend('Seed').onChange(cb.regen);
    }
}

export class RidgeUI extends Ridge {
    bind(root: Panel, cb: NoiseCallback) {
        root.number(this.p, 'seed').legend('Seed').onChange(cb.regen);
        root.bool(this.p, 'invert').legend('Invert').onChange(cb.regen);
        root.bool(this.p, 'square').legend('Square').onChange(cb.regen);
    }
}

export class ContinentalMixUI<
    Low extends NoiseMakerUI, High extends NoiseMakerUI
> extends ContinentalMix<Low, High> {
    bind(root: Panel, cb: NoiseCallback) {
        this.p.bass.bind(root.folder('Bass'), cb);
        this.p.treble.bind(root.folder('Treble'), cb);
        root.range(this.p.threshold, 'low', 0, 1, .02).legend('Low').onChange(cb.regen);
        root.range(this.p.threshold, 'mid', 0, 1, .02).legend('Mid').onChange(cb.regen);
        root.range(this.p.threshold, 'high', 0, 1, .02).legend('High').onChange(cb.regen);
    }
}

export class LayeredUI<Noise extends NoiseMakerUI> extends Layered<Noise> {
    bind(root: Panel, cb: NoiseCallback) {
        const noisef = root.folder('Noise');
        this.p.noise.bind(noisef, cb);

        const lay = this.p.layers;
        noisef.range(lay, 'fundamental', .1, 5, .1).legend('Fundamental').onInput(cb.regen);
        noisef.range(lay, 'octaves', 1, 8, 1).legend('Octaves').onInput(cb.regen);
        noisef.range(lay, 'persistence', .1, 1, .05).legend('Persistence').onInput(cb.regen);
        noisef.range(lay, 'lacunarity', 1.1, 4, .1).legend('Lacunarity').onInput(cb.regen);

        const samplingf = root.folder('Sampling');
        const sam = this.p.sampling;
        samplingf.range(sam, 'size', 10, 100, 10).legend('Size').onInput(cb.regen);
        samplingf.range(sam, 'threshold', 2, 5, .2).legend('Threshold').onInput(cb.regen);
        samplingf.range(sam, 'fundamental', .1, 5, .1).legend('Fundamental').onInput(cb.regen);
    }
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

    const simplex = new LayeredUI({
        noise: new SimplexUI(c(f.base)),
        layers: c(f.layers),
        sampling: c(f.sampling),
    });
    simplex.bind(ui.register(simplex, 'Simplex'), ui.cb);

    const ridge = new LayeredUI({
        noise: new RidgeUI(c(f.base)),
        layers: c(f.layers),
        sampling: c(f.sampling),
    });
    ridge.bind(ui.register(ridge, 'Ridge'), ui.cb);

    const comix = new ContinentalMixUI({
        bass: new LayeredUI({
            noise: new SimplexUI(c(f.base)),
            layers: {
                fundamental: 1.1,
                octaves: 7,
                persistence: .65,
                lacunarity: 1.5,
            },
            sampling: c(f.sampling),
        }),
        treble: new LayeredUI({
            noise: new RidgeUI(c(f.base)),
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
    const conui = ui.register(comix, 'Continental mix');
    comix.bind(conui, ui.cb)
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

