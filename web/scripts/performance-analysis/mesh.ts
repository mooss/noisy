import * as THREE from 'three';
import { Bench, TaskResult } from 'tinybench';
import { REFERENCE_STATE } from '../../src/app/noisy/init.js';
import { ReusablePainter } from '../../src/engine/mesh/painters.js';
import { ReusableWeaver } from '../../src/engine/mesh/weavers.js';
import { Layered, Simplex } from '../../src/noise/algorithms.js';

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
noise.recompute();

const render = REFERENCE_STATE.render;
render.texturePath = '';
const painter = new ReusablePainter(render);
const weaver = new ReusableWeaver(render);

const mkmesh = (side: number) => {
    const geometry = weaver.weave(
        noise.normalised(.01, 1),
        side,
    );
    const material = painter.paint();
    (globalThis as any).sink = new THREE.Mesh(geometry, material);
};

// Use this to troubleshoot problems with this script (Bench obscures the errors).
console.log(':MKMESH', mkmesh(2));

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

console.log('Throughput (iterations per second) of surface mesh creation.')
console.log('| Run | Mean         | Median   | Samples |');
console.log('|-----|--------------|----------|---------|');

const b = new Bench({
    time: 2000,
    warmupIterations: 128,
});
b.add('mesh128', () => mkmesh(128));

for (let i = 1; i <= 5; i++) {
    const task = b.runSync()[0];
    const res = task.result;
    const thp = throughput(res);
    console.log(`| ${i.toString().padStart(3)} | ${thp.mean.toString().padStart(12)} | ${thp.med.toString().padStart(8)} | ${thp.samples.toString().padStart(7)} |`);
}
