import { ChunkState } from "../state/chunk.js";
import { clone } from "../utils/objects.js";
import { ContinentalMix } from "./algorithms/comix.js";
import { Layered } from "./algorithms/layered.js";
import { Ridge } from "./algorithms/ridge.js";
import { Simplex } from "./algorithms/simplex.js";
import { Union } from "./algorithms/union.js";
import { AlgoPicker } from "./containers.js";
import { NoiseMakerI } from "./foundations.js";
import { Clustering } from "./processing/clustering.js";
import { NoisePipeline, PipelinePicker } from "./processing/pipeline.js";
import { IdentityWrapper } from "./processing/processing.js";
import { Terracing, VoxelTerracing } from "./processing/terracing.js";
import { MirroredTiling, QuadTiling, SineTiling } from "./processing/tiling.js";
import { Exponentiation, Steepness } from "./processing/transform.js";
import { Warping } from "./processing/warping.js";

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
    });

    const ridge = new Layered({
        noise: new Ridge(c(f.base)),
        layers: c(f.layers),
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
        }),
        treble: new Layered({
            noise: new Ridge(c(f.base)),
            layers: {
                fundamental: .2,
                octaves: 8,
                persistence: .65,
                lacunarity: 1.55,
            },
        }),
        threshold: { low: .28, mid: .64, high: .56 },
    });

    const cursive = new Union({
        operation: 'sum',
        fundamental: .3,
        octaves: [{
            name: "Peaks 1",
            frequency: .1,
            amplitude: 94,
            noise: new Ridge({
                seed: 23,
                invert: true,
                square: false,
            }),
        },
        {
            name: "Peaks 2",
            frequency: .4,
            amplitude: 82,
            noise: new Ridge({
                seed: 23,
                invert: true,
                square: false,
            }),
        },
        {
            name: "Hills 1",
            frequency: .8,
            amplitude: 85,
            noise: new Simplex({ seed: 23 }),
        },
        {
            name: "Hills 2",
            frequency: 1.6,
            amplitude: 85,
            noise: new Simplex({ seed: 23 }),
        },
        {
            name: "Hills 3",
            frequency: 6,
            amplitude: 70,
            noise: new Simplex({ seed: 23 }),
        },],
    });


    const cursed = new Union({
        operation: 'min',
        fundamental: .3,
        octaves: [{
            name: "Peaks 1",
            frequency: .4,
            amplitude: 4,
            noise: new Ridge({
                seed: 23,
                invert: true,
                square: false,
            }),
        },
        {
            name: "Hills 1",
            frequency: .2,
            amplitude: 8,
            noise: new Simplex({ seed: 23 }),
        },
        {
            name: "Hills 2",
            frequency: .3,
            amplitude: 19,
            noise: new Simplex({ seed: 23 }),
        },
        {
            name: "Hills 3",
            frequency: 1.5,
            amplitude: 19,
            noise: new Simplex({ seed: 23 }),
        },],
    });

    const map = new AlgoPicker({
        algorithms: {
            'Simplex': simplex,
            'Ridge': ridge,
            'Continental mix': comix,
            'Cursive mountains': cursive,
            'Cursed mountains': cursed,
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
