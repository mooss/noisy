import { ChunkState } from "../state/chunk.js";
import { ContinentalMix } from "./algorithms/comix.js";
import { Layered } from "./algorithms/layered.js";
import { Ridge } from "./algorithms/ridge.js";
import { Simplex } from "./algorithms/simplex.js";
import { Union } from "./algorithms/union.js";
import { AlgoPicker } from "./containers.js";
import { Clustering } from "./processing/clustering.js";
import { NoisePipeline, PipelinePicker } from "./processing/pipeline.js";
import { IdentityWrapper } from "./processing/processing.js";
import { Terracing, VoxelTerracing } from "./processing/terracing.js";
import { MirroredTiling, QuadTiling, SineTiling } from "./processing/tiling.js";
import { Exponentiation, Steepness } from "./processing/transform.js";
import { Warping } from "./processing/warping.js";

const simplex = () => new Layered({
    noise: new Simplex({ seed: 23 }),
    layers: {
        fundamental: .3,
        octaves: 8,
        persistence: .65,
        lacunarity: 1.5,
    },
});

const ridge = () => new Layered({
    noise: new Ridge({ invert: true, square: false, seed: 23 }),
    layers: {
        fundamental: .3,
        octaves: 8,
        persistence: .65,
        lacunarity: 1.5,
    },
});

const comix = () => new ContinentalMix({
    bass: new Layered({
        noise: new Simplex({ seed: 23 }),
        layers: {
            fundamental: .1,
            octaves: 7,
            persistence: .7,
            lacunarity: 1.64,
        },
    }),
    treble: new Layered({
        noise: new Ridge({ invert: true, square: false, seed: 23 }),
        layers: {
            fundamental: .2,
            octaves: 8,
            persistence: .65,
            lacunarity: 1.56,
        },
    }),
    threshold: { low: .28, mid: .64, high: .56 },
});

const cursive = () => new Union({
    operation: 'sum',
    fundamental: .3,
    octaves: [{
        name: "Peaks 1",
        frequency: 2.7,
        amplitude: 8,
        noise: new Ridge({
            seed: 76,
            invert: false,
            square: true,
        }),
    },
    {
        name: "Peaks 2",
        frequency: 2.9,
        amplitude: 100,
        noise: new Ridge({
            seed: 34,
            invert: true,
            square: false,
        }),
    },
    {
        name: "Hills 1",
        frequency: 1.7,
        amplitude: 51,
        noise: new Simplex({ seed: 44 }),
    },
    {
        name: "Hills 2",
        frequency: 2.5,
        amplitude: 50,
        noise: new Simplex({ seed: 9 }),
    },
    {
        name: "Hills 3",
        frequency: 3.4,
        amplitude: 50,
        noise: new Simplex({ seed: 23 }),
    },],
});

const cursed = () => new Union({
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

const allNoises = () => new AlgoPicker({
    algorithms: {
        'Simplex': simplex(),
        'Ridge': ridge(),
        'Continental mix': comix(),
        'Cursive mountains': cursive(),
        'Cursed mountains': cursed(),
    },
    current: 'Continental mix',
});

const slope = () => new PipelinePicker({
    algorithms: {
        'None': new IdentityWrapper({}),
        'Exponentiation': new Exponentiation({ exponent: 1.5 }),
        'Steepness': new Steepness({ factor: 1.5 }),
    },
    current: 'Exponentiation',
    tag: 'Transform',
});

const clustering = () => new Clustering({
    coorscale: 3,
    noisescale: 2,
    enabled: false,
});

const warping = () => new Warping({
    frequency: 2.25,
    strength: .08,
    warper: new Simplex({ seed: 23 }),
});

const tiling = () => new PipelinePicker({
    algorithms: {
        'None': new IdentityWrapper({}),
        'Quad': new QuadTiling({}),
        'Mirrored': new MirroredTiling({ normalizeX: true, normalizeY: true }),
        'Sine': new SineTiling({}),
    },
    current: 'None',
    tag: 'Tiling',
});

const terracing = (chunks: ChunkState) => new PipelinePicker({
    algorithms: {
        'Constant': new Terracing({ steps: 0 }),
        'Voxel': new VoxelTerracing({ chunks }),
    },
    current: 'Constant',
    tag: 'Terracing',
});

const allPipelines = (chunks: ChunkState) => [
    slope(),
    clustering(),
    warping(),
    tiling(),
    terracing(chunks),
];

export const advancedNoise = (chunks: ChunkState) => new NoisePipeline({
    base: allNoises(),
    pipeline: allPipelines(chunks),
});

export const comixNoise = () => new NoisePipeline({
    base: comix(),
    pipeline: [slope(), warping()],
});

export const textureNoise = (chunks: ChunkState, tilingAlgo: string) => {
    const til = tiling();
    til.p.current = tilingAlgo;
    return new NoisePipeline({
        base: cursive(),
        pipeline: [slope(), warping(), til, terracing(chunks)],
    })
};

export type NoiseState = ReturnType<typeof advancedNoise>;
