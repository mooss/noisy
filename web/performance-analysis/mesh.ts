import { Bench, TaskResult } from 'tinybench';
import { INITIAL_STATE } from "../init.js";

const state = INITIAL_STATE;
(globalThis as any).sink = 0;

const mkmesh = (side: number) => {
    (globalThis as any).sink = state.render.mesh({
        at: state.noise.normalised(.01, 1),
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

console.log('')
console.log('| Run | Mean         | Median   | Samples |');
console.log('|-----|--------------|----------|---------|');

const b = new Bench({
    time: 1000,
    warmupIterations: 128,
});
b.add('mesh128', () => mkmesh(128));

for (let i = 1; i <= 5; i++) {
    const res = b.runSync()[0].result;
    const thp = throughput(res);
    console.log(`| ${i.toString().padStart(3)} | ${thp.mean.toString().padStart(12)} | ${thp.med.toString().padStart(8)} | ${thp.samples.toString().padStart(7)} |`);
}
