import { Bench, TaskResult } from 'tinybench';
import { Layered, Simplex } from '../noise/algorithms.js';
import { RenderState } from '../state/render.js';

(globalThis as any).sink = 0;

// The noise function responsible for terrain creation.
const noise = new Layered({
    noise: new Simplex({ seed: 23 }),
    layers: {
        fundamental: .7,
        octaves: 8,
        persistence: .65,
        lacunarity: 1.5,
    },
    sampling: { size: 30, threshold: 2.5, fundamental: 3 },
});

// Dictates the mesh function that will be used.
const render = new RenderState({
    style: 'surface', // Will use createSurfaceMesh.
    // The rest is not relevant and only here to placate the type system.
    paletteName: 'Bright terrain',
    light: {
        ambient: { intensity: .5 },
        directional: { intensity: 4 },
    },
    heightMultiplier: 1,
});

const mkmesh = (side: number) => {
    (globalThis as any).sink = render.mesh({
        at: noise.normalised(.01, 1),
        nblocks: side,
    });
};

function throughput(res: TaskResult) {
    const mean = Math.round(res.throughput.mean).toString();
    const rme = res.throughput.rme.toFixed(2);
    const med = Math.round(res.throughput.p50!).toString();
    const mad = Math.round(res.throughput.mad!).toString();
    return {
        'mean': `${mean} ± ${rme}%`,
        'med': `${med} ± ${mad}`,
        'samples': res.throughput.samples.length,
    };
}

console.log('Throughput (iterations per second) of `createSurfaceMesh`.')
console.log('| Run | Mean         | Median   | Samples |');
console.log('|-----|--------------|----------|---------|');

const b = new Bench({
    time: 2000,
    warmupIterations: 128,
});
b.add('mesh128', () => mkmesh(128));

for (let i = 1; i <= 5; i++) {
    const res = b.runSync()[0].result;
    const thp = throughput(res);
    console.log(`| ${i.toString().padStart(3)} | ${thp.mean.toString().padStart(12)} | ${thp.med.toString().padStart(8)} | ${thp.samples.toString().padStart(7)} |`);
}
