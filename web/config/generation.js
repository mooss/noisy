import { CHUNK_UNIT } from "../constants.js";
import { highMix, mkLayering, mkRidger, mkRng, mkSimplex } from "../rng.js";
import { numStats } from "../stats.js";
import { clone, rangeMapper } from "../utils.js";

export class GenerationConfig {
    constructor() {
        this.seed = 23;                     // Seed for deterministic terrain generation.
        this.terrainAlgo = 'octavianRidge'; // Terrain creation algorithm.
        this.heightMultiplier = 1.0;        // Multiplier for the terrain height.
        this.terracing = 0;                 // Degree of quantization/terracing (0-1)
        this.noise = {
            octaves: 8,          // Simplex Noise octaves to layer.
            persistence: 0.65,   // Amplitude reduction per octave.
            lacunarity: 1.5,     // Frequency increase per octave.
            fundamental: 1.1,    // Base frequency for noise.
            warpingStrength: .1, // Warping strength for noise coordinates.
            ridge: {
                invertSignal: true,  // Invert signal for ridges (1 - abs(noise)) vs valleys (abs(noise)).
                squareSignal: false, // Square the signal to sharpen ridges/valleys.
                style: 'octavian',   // Style of ridge generation (octavian, melodic).
            },
        };
    }

    heightField() { return new HeightField(this) }
    get verticalUnit() { return (CHUNK_UNIT / 5) * this.heightMultiplier }

    ////////
    // UI //

    #algorithmDeck; // The deck containing all the algorithm cards.

    ui(parent, regen) {
        //////////
        // Root //
        parent.number(this, 'seed')
            .legend('Seed')
            .onChange(regen);

        parent.range(this, 'heightMultiplier', 0.1, 5.0, 0.05)
            .legend('Height multiplier')
            .onInput(regen);

        parent.range(this, 'terracing', 0, .1, .01)
            .legend('Terracing')
            .onInput(regen);

        /////////////////////
        // Algorithms deck //
        const algo = parent.deck();
        this.#algorithmDeck = algo;

        // Registers a card and make sure the correct one is focused.
        const card = (cardTitle, terrainAlgo) => {
            const res = algo.card(cardTitle).onClick(() => {
                this.terrainAlgo = terrainAlgo;
                this.#updateAlgorithmCards();
                regen();
            });

            // The initial value of terrainAlgo is not guaranteed to be that of the first card so
            // the correct card must be shown manually.
            if (terrainAlgo == this.terrainAlgo) {
                res.select();
                res.show();
                algo.changeFocus(res);
            } else {
                res.deselect();
                res.hide();
            }
            return res;
        }


        // Because of the need to share some parameters between different algorithms, the contents
        // of noise and ridge are all the necessary parameter, who are then hidden and shown as
        // needed in #updateAlgorithmCards.
        const noise = card('Simplex', 'simplex');
        const ridge = card('Octavian ridge', 'octavianRidge');
        card('Continental mix', 'continentalMix');
        card('Melodic ridge', 'melodicRidge');
        card('Random', 'rand');

        ///////////
        // Noise //
        noise.range(this.noise, 'octaves', 1, 8, 1)
            .legend('Octaves')
            .onInput(regen);
        noise.range(this.noise, 'persistence', 0.1, 1.0, 0.05)
            .legend('Persistence')
            .onInput(regen);
        noise.range(this.noise, 'lacunarity', 1.1, 4.0, 0.1)
            .legend('Lacunarity')
            .onInput(regen);
        noise.range(this.noise, 'fundamental', 0.1, 5.0, 0.1)
            .legend('Fundamental')
            .onInput(regen);
        noise.range(this.noise, 'warpingStrength', 0.0, 0.5, 0.01)
            .legend('Warping strength')
            .onInput(regen);

        ///////////
        // Ridge //
        ridge.bool(this.noise.ridge, 'invertSignal')
            .legend('Invert signal')
            .onChange(regen);
        ridge.bool(this.noise.ridge, 'squareSignal')
            .legend('Square signal')
            .onChange(regen);

        //////////////////////////////////
        // Show selected algorithm only //
        this.#updateAlgorithmCards();
    }

    // Dynamically show/hide parameter folders based on the selected terrain algorithm.
    #updateAlgorithmCards() {
        const title2algo = {
            'Simplex': ['simplex', 'octavianRidge', 'melodicRidge'],
            'Octavian ridge': ['octavianRidge', 'melodicRidge'],
        }

        for (let card of this.#algorithmDeck.cards) {
            const mustShow = title2algo[card.name];
            if (mustShow?.includes(this.terrainAlgo)) {
                card.show();
            } else {
                card.hide();
            }
        }
    }
}

class HeightFieldBuilder {
    #c;
    constructor(generationConfig) {
        this.#c = generationConfig;
    }

    #layered(noise) { return mkLayering(
        noise, this.#c.noise.octaves, this.#c.noise.fundamental,
        this.#c.noise.persistence, this.#c.noise.lacunarity
    ) }

    get #simplex() { return mkSimplex(this.#c.seed, this.#c.noise.warpingStrength) }
    get #ridger() {
        return mkRidger(this.#c.noise.ridge.invertSignal, this.#c.noise.ridge.squareSignal);
    }
    get #layeredSimplex() { return this.#layered(this.#simplex) }
    get #layeredOctavianRidge() {
        const rid = this.#ridger, sim = this.#simplex;
        return this.#layered((x, y) => { return rid(sim(x, y)) });
    }
    get #layeredMelodicRidge() {
        const rid = this.#ridger, lay = this.#layered(this.#simplex);
        return (x, y) => { return rid(lay(x, y)) };
    }

    get fun() {
        switch (this.#c.terrainAlgo) {
        case 'simplex':
            return this.#layeredSimplex;
        case 'rand':
            const rand = mkRng(this.#c.seed);
            return () => rand(0, 1);
        case 'octavianRidge':
            return this.#layeredOctavianRidge;
        case 'melodicRidge':
            return this.#layeredMelodicRidge;
        case 'continentalMix':
            return continentalMix(this.#c.seed);
        }
        return undefined;
    }
}

/**
 * Samples the generator with a low fundamental to compute statistically reasonable low and high
 * bounds.
 */
function lowhigh(config) {
    config = clone(config);
    // Make sure to sample a high amount.
    config.noise.fundamental = .1;
    const gen = new HeightFieldBuilder(config).fun;
    const heights = [];
    for (let i = 0; i < 100; ++i)
        for (let j = 0; j < 100; ++j)
            heights.push(gen(i, j));
    return numStats(heights).outlierBounds(4);
}

export class HeightField {
    #terracing;
    constructor(config) {
        this.raw = new HeightFieldBuilder(config).fun;
        this.#terracing = config.terracing;

        if (config.terrainAlgo === 'continentalMix') {
            this.high = 1; this.low = 0;
            return;
        }

        const bounds = lowhigh(config);
        this.low = bounds.low; this.high = bounds.high;
    }

    /** Returns a function mapping the height to a range approximately between low and high */
    #mapper(low, high) {
        return rangeMapper(this.low, this.high, low, high);
    }

    /**
     * Returns a height function that normalised function between an absolute minimal value and an
     * approximate high value.
     *
     * @return {function(number, number) number} The normalised height function.
     */
    mkNormalised(min, high) {
        const mapper = this.#mapper(min, high);
        let postprocess = mapper;
        if (this.#terracing > 0) {
            const step = this.#terracing * (high - min);
            postprocess = (raw) => Math.round(mapper(raw) / step) * step;
        }

        return (x, y) => {
            let res = postprocess(this.raw(x, y));
            if (res < min) return min;
            return res;
        }
    }
}

export function continentalMix(seed) {
    let gen = new GenerationConfig();
    gen.seed = seed;
    gen.terrainAlgo = 'octavianRidge';
    gen.noise.octaves = 8;
    gen.noise.warpingStrength = .1;
    const high = gen.heightField().mkNormalised(0, 1);

    gen = new GenerationConfig();
    gen.seed = seed + 1;
    gen.terrainAlgo = 'simplex';
    gen.noise.octaves = 8;
    gen.noise.persistence = .7;
    gen.noise.lacunarity = 1.5;
    gen.noise.fundamental = 2;
    const low = gen.heightField().mkNormalised(0, 1);

    return highMix(low, high, .4, .8, .6);
}
