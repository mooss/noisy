import { ChunkState } from "../state/chunk.js";
import { clone } from "../utils/objects.js";
import { ContinentalMix, Layered, Ridge, Simplex, Stacked } from "./algorithms.js";
import { AlgoPicker } from "./containers.js";
import { NoiseMakerI } from "./foundations.js";
import { Clustering } from "./processing/clustering.js";
import { NoisePipeline, PipelinePicker } from "./processing/pipeline.js";
import { IdentityWrapper } from "./processing/processing.js";
import { Terracing, VoxelTerracing } from "./processing/terracing.js";
import { MirroredTiling, QuadTiling, SineTiling } from "./processing/tiling.js";
import { Exponentiation, Steepness } from "./processing/transform.js";
import { Warping } from "./processing/warping.js";
import { DEFAULT_SAMPLING } from "./sampling.js";

export function noiseAlgorithms(chunks: ChunkState) {
    const f = {
        sbase: { seed: 23 },
        base: { invert: true, square: false, seed: 23 },
        layers: {
            fundamental: .3,
            octaves: 8,
            persistence: .65,
            lacunarity: 1.5,
        },
    };
    const c = clone;

    let simplex: NoiseMakerI = new Layered({
        noise: new Simplex(c(f.sbase)),
        layers: c(f.layers),
        sampling: DEFAULT_SAMPLING,
    });

    const ridge = new Layered({
        noise: new Ridge(c(f.base)),
        layers: c(f.layers),
        sampling: DEFAULT_SAMPLING,
    });

    const comix = new ContinentalMix({
        bass: new Layered({
            noise: new Simplex(c(f.sbase)),
            layers: {
                fundamental: .1,
                octaves: 7,
                persistence: .7,
                lacunarity: 1.64,
            },
            sampling: DEFAULT_SAMPLING,
        }),
        treble: new Layered({
            noise: new Ridge(c(f.base)),
            layers: {
                fundamental: .2,
                octaves: 8,
                persistence: .65,
                lacunarity: 1.55,
            },
            // TODO: A bit worrying, this does not work without the cloning, looks like a codec
            // problem.
            sampling: c(DEFAULT_SAMPLING),
        }),
        threshold: { low: .28, mid: .64, high: .56 },
    });

    const stacked = new Stacked({
        fundamental: .3,
        octaves: [{
            name: "Broad Hills",
            frequency: .6,
            amplitude: .5,
            noise: new Simplex(c({ seed: 42 })),
        },
        {
            name: "Sharp Peaks",
            frequency: .3,
            amplitude: 1.3,
            noise: new Ridge(c({
                seed: 23,
                invert: true,
                square: false,
            })),
        }],
    });

    const map = new AlgoPicker({
        algorithms: {
            'Simplex': simplex,
            'Ridge': ridge,
            'Continental mix': comix,
            'Stacked PoC': stacked,
        },
        current: 'Continental mix',
    });

    const terracing = new PipelinePicker({
        algorithms: {
            'Constant': new Terracing({ steps: 0 }),
            'Voxel': new VoxelTerracing({ chunks }),
        },
        current: 'Constant',
        tag: 'Terracing',
    });

    const tiling = new PipelinePicker({
        algorithms: {
            'None': new IdentityWrapper({}),
            'Quad': new QuadTiling({}),
            'Mirrored': new MirroredTiling({ normalizeX: false, normalizeY: false }),
            'Sine': new SineTiling({}),
        },
        current: 'None',
        tag: 'Tiling',
    });

    const transform = new PipelinePicker({
        algorithms: {
            'None': new IdentityWrapper({}),
            'Exponentiation': new Exponentiation({ exponent: 1.5 }),
            'Steepness': new Steepness({ factor: 1.5 }),
        },
        current: 'Exponentiation',
        tag: 'Transform',
    })

    const res = new NoisePipeline({
        base: map,
        pipeline: [
            transform,
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
