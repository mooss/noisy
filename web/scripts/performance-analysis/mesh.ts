import { Mesh } from 'three';
import { Bench, TaskResult } from 'tinybench';
import { PainterStyle, ReusablePainter } from '../../src/engine/mesh/painters.js';
import { GeometryStyle, ReusableWeaver } from '../../src/engine/mesh/weavers.js';
import { palettes } from '../../src/engine/palettes.js';
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

const painterStyle: PainterStyle = 'Palette';
const geometryStyle: GeometryStyle = 'Surface';
const palette = palettes['Bright terrain'];

const weaver = new ReusableWeaver();
const painter = new ReusablePainter({ painterStyle, geometryStyle, palette });

const mkmesh = (resolution: number) => {
    const fun = noise.normalised(.01, 1);
    const geometry = weaver.weave(geometryStyle, fun, resolution);
    const material = painter.paint(fun, resolution);
    (globalThis as any).sink = new Mesh(geometry, material);
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

console.log('Throughput (iterations per second) of mesh creation.')
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
