export class GenerationConfig {
    constructor() {
        this.seed = 23;               // Seed for deterministic terrain generation.
        this.terrainAlgo = 'ridge';   // Terrain creation algorithm (ridge, rand, noise, midpoint).
        this.midpointRoughness = 0.6; // Roughness factor for midpoint displacement.
        this.heightMultiplier = 1.0;  // Multiplier for the terrain height.
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

    ui(parent, regen) {
        //////////
        // Root //
        parent.number(this, 'seed')
            .legend('Seed')
            .onChange(regen);

        parent.select(this, 'terrainAlgo', {
            'Random': 'rand',
            'Noise': 'noise',
            'Ridge': 'ridge',
            'Midpoint': 'midpoint'
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
        ridge.select(this.noise.ridge, 'style', {
            'Octavian': 'octavian',
            'Melodic': 'melodic'
        }).legend('Ridge Style')
            .onChange(regen);

        //////////////
        // Midpoint //
        const midpoint = parent.addFolder('Midpoint');
        midpoint.range(this, 'midpointRoughness', 0.4, 0.8, 0.02)
            .legend('Roughness')
            .onInput(regen);

        //////////////////////////////////
        // Show selected algorithm only //
        this.#updateAlgorithmFolders(parent);
    }

    // Dynamically show/hide parameter folders based on the selected terrain algorithm.
    #updateAlgorithmFolders(parent) {
        const title2algo = {
            'Noise': ['noise', 'ridge'],
            'Ridge': ['ridge'],
            'Midpoint': ['midpoint'],
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
