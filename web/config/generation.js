import { mkLayering, mkRidger, mkRng, mkSimplex } from "../rng.js";

export class GenerationConfig {
    constructor() {
        this.seed = 23;                     // Seed for deterministic terrain generation.
        this.terrainAlgo = 'octavianRidge'; // Terrain creation algorithm.
        this.heightMultiplier = 1.0;        // Multiplier for the terrain height.
        this.noise = {
            octaves: 6,         // Simplex Noise octaves to layer.
            persistence: 0.65,  // Amplitude reduction per octave.
            lacunarity: 1.5,    // Frequency increase per octave.
            fundamental: 1.1,   // Base frequency for noise.
            warpingStrength: 0, // Warping strength for noise coordinates.
            ridge: {
                invertSignal: true,  // Invert signal for ridges (1 - abs(noise)) vs valleys (abs(noise)).
                squareSignal: false, // Square the signal to sharpen ridges/valleys.
                style: 'octavian',   // Style of ridge generation (octavian, melodic).
            },
        };
    }

    generator(chunkSize) {
        return new HeightFieldBuilder(this, chunkSize).generator;
    }

    ////////
    // UI //

    ui(parent, regen) {
        //////////
        // Root //
        parent.number(this, 'seed')
            .legend('Seed')
            .onChange(regen);

        parent.select(this, 'terrainAlgo', {
            'Random': 'rand',
            'Simplex': 'simplex',
            'Octavian ridge': 'octavianRidge',
            'Melodic ridge': 'melodicRidge'
        }).legend('Algorithm')
            .onChange(() => {
                this.#updateAlgorithmFolders(parent);
                regen();
            });

        parent.range(this, 'heightMultiplier', 0.1, 5.0, 0.05)
            .legend('Height multiplier')
            .onInput(regen);

        ///////////
        // Noise //
        const noise = parent.addFolder('Noise');
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
        const ridge = parent.addFolder('Ridge');
        ridge.bool(this.noise.ridge, 'invertSignal')
            .legend('Invert signal')
            .onChange(regen);
        ridge.bool(this.noise.ridge, 'squareSignal')
            .legend('Square signal')
            .onChange(regen);

        //////////////////////////////////
        // Show selected algorithm only //
        this.#updateAlgorithmFolders(parent);
    }

    // Dynamically show/hide parameter folders based on the selected terrain algorithm.
    #updateAlgorithmFolders(parent) {
        const title2algo = {
            'Noise': ['simplex', 'octavianRidge', 'melodicRidge'],
            'Ridge': ['octavianRidge', 'melodicRidge'],
        }

        for (let folder of parent.folders) {
            const mustShow = title2algo[folder.title];
            if (mustShow.includes(this.terrainAlgo)) {
                folder.show();
            } else {
                folder.hide();
            }
        }
    }
}

class HeightFieldBuilder {
    #c; #size;
    constructor(generationConfig, chunkSize) {
        this.#c = generationConfig;
        this.#size = chunkSize;
    }

    #layered(noise) { return mkLayering(
        noise, this.#c.noise.octaves, this.#c.noise.fundamental / this.#size,
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

    get generator() {
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
        }
        return undefined;
    }
}
