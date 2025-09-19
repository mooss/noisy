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
