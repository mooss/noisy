# Profiling and benchmarks

This directory contains scripts to analyse the performance of the project and to identify and benchmark bottlenecks.

## Benchmarking `createSurfaceMesh`

This section summarizes the optimization process of `createSurfaceMesh` that a quick profiling revealed to be a major bottleneck.
The benchmark are executed several times to be sure that the results are actually consistent, because they can vary wildly on some machines (probably due to thermal throttling).

The benchmarks are executed on a Rizen 9 7950X and measure the throughput of mesh creation.

### Initial performances

| Run | Mean         | Median   | Samples |
|-----|--------------|----------|---------|
|   1 |  125 ± 0.83% |  129 ± 2 |     250 |
|   2 |  125 ± 0.95% |  129 ± 1 |     248 |
|   3 |  125 ± 0.85% |  129 ± 1 |     249 |
|   4 |  125 ± 0.85% |  128 ± 1 |     249 |
|   5 |  124 ± 0.85% |  128 ± 1 |     248 |

### Pre-allocation of position and color buffers

An obvious and easy enhancement yielding visible improvements.

| Run | Mean         | Median   | Samples |
|-----|--------------|----------|---------|
|   1 |  147 ± 0.77% |  149 ± 1 |     292 |
|   2 |  147 ± 0.71% |  149 ± 2 |     292 |
|   3 |  146 ± 0.49% |  146 ± 3 |     291 |
|   4 |  146 ± 0.49% |  146 ± 3 |     291 |
|   5 |  147 ± 0.44% |  146 ± 3 |     294 |

### Flattening the normal computation

Computing the normals manually instead of using what THREE.js provides makes the throughput slightly lower (~148 it/s).

### Direct array access for normal accumulation

The `nA`, `nB` and `nC` buffers and the calls to THREE.js methods (`fromBufferAttributes` and `setXYZ`) add some unnecessary overhead.

Replacing them with basic array accumulation gives those results:
| Run | Mean         | Median   | Samples |
|-----|--------------|----------|---------|
|   1 |  165 ± 0.67% |  168 ± 2 |     329 |
|   2 |  166 ± 0.65% |  168 ± 1 |     331 |
|   3 |  167 ± 0.28% |  167 ± 4 |     335 |
|   4 |  167 ± 0.43% |  167 ± 4 |     333 |
|   5 |  167 ± 0.38% |  167 ± 4 |     334 |
