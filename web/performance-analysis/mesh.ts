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

const b = new Bench({
    time: 2 * 1000,
    warmupIterations: 128,
});
b.add('mesh128', () => mkmesh(128));
b.runSync();

function logThroughput(res: TaskResult) {
    const mean = Math.round(res.throughput.mean).toString();
    const rme = res.throughput.rme.toFixed(2);
    const med = Math.round(res.throughput.p50!).toString();
    const mad = Math.round(res.throughput.mad!).toString();
    console.log(`:MEAN ${mean} ± ${rme}%`, `:MED ${med} ± ${mad}`);
}
logThroughput(b.tasks[0].result);


