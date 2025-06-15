export class GenerationConfig {
    constructor() {
        this.seed = 23;               // Seed for deterministic terrain generation.
        this.terrainAlgo = 'ridge';   // Terrain creation algorithm (ridge, rand, noise, midpoint).
        this.midpointRoughness = 0.6; // Roughness factor for midpoint displacement.
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
}
