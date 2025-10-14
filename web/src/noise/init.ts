import { ChunkState } from "../state/chunk.js";
import { clone } from "../utils/objects.js";
import { ContinentalMix, Layered, Ridge, Simplex } from "./algorithms.js";
import { AlgoPicker } from "./containers.js";
import { NoiseMakerI } from "./foundations.js";
import { Clustering, IdentityWrapper, MirroredTiling, NoisePipeline, NoisyTerracing, PipelinePicker, QuadTiling, SineTiling, Terracing, VoxelTerracing, Warping } from "./processing.js";

export function noiseAlgorithms(chunks: ChunkState) {
    const f = {
        sbase: { seed: 23 },
        base: { invert: true, square: false, seed: 23 },
        layers: {
            fundamental: .7,
            octaves: 8,
            persistence: .65,
            lacunarity: 1.5,
        },
        sampling: { size: 30, threshold: 4, fundamental: 3 },
    };
    const c = clone;

    let simplex: NoiseMakerI = new Layered({
        noise: new Simplex(c(f.sbase)),
        layers: c(f.layers),
        sampling: c(f.sampling),
    });

    const ridge = new Layered({
        noise: new Ridge(c(f.base)),
        layers: c(f.layers),
        sampling: c(f.sampling),
    });

    const comix = new ContinentalMix({
        bass: new Layered({
            noise: new Simplex(c(f.sbase)),
            layers: {
                fundamental: .3,
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
                persistence: .65,
                lacunarity: 1.55,
            },
            sampling: c(f.sampling),
        }),
        threshold: { low: .28, mid: .64, high: .56 },
    });

    const map = new AlgoPicker({
        algorithms: {
            'Simplex': simplex,
            'Ridge': ridge,
            'Continental mix': comix,
        },
        current: 'Simplex',
    });

    const terracing = new PipelinePicker({
        algorithms: {
            'Constant': new Terracing({ steps: 0 }),
            'Voxel': new VoxelTerracing({ chunks }),
            'Noisy': new NoisyTerracing({
                min: 40, max: 50,
                terracer: new Layered({
                    noise: new Simplex(c(f.sbase)),
                    layers: {
                        fundamental: 3,
                        octaves: 1,
                        persistence: .65,
                        lacunarity: 1.5,
                    },
                    sampling: c(f.sampling),
                }),
            }),
        },
        current: 'Constant',
        tag: 'Terracing',
    });

    const tiling = new PipelinePicker({
        algorithms: {
            'None': new IdentityWrapper({}),
            'Quad': new QuadTiling({}),
            'Mirrored': new MirroredTiling({normalizeX: false, normalizeY: false}),
            'Sine': new SineTiling({}),
        },
        current: 'None',
        tag: 'Tiling',
    });

    const res = new NoisePipeline({
        base: map,
        pipeline: [
            new Clustering({
                coorscale: 3,
                noisescale: 2,
                enabled: false,
            }),
            new Warping({
                frequency: 2.25,
                strength: .08,
                warper: new Simplex(c(f.sbase)),
            }),
            tiling,
            terracing,
        ],
    });

    return res;
}

export type NoiseState = ReturnType<typeof noiseAlgorithms>;
