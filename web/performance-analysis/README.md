# Profiling and benchmarks

This directory contains scripts to analyse the performance of the project and to identify and benchmark bottlenecks.

## Benchmarking `createSurfaceMesh`

This section summarizes the optimization process of `createSurfaceMesh` that a quick profiling revealed to be a major bottleneck.
The benchmark are executed several times to be sure that the results are actually consistent, because they can vary wildly on some machines (probably due to thermal throttling).

The benchmarks are executed on a Rizen 9 7950X and measure the throughput of mesh creation.

### Initial performances

| Run | Mean        | Median  | Samples |
|-----|-------------|---------|---------|
| 1   | 125 ± 0.83% | 129 ± 2 | 250     |
| 2   | 125 ± 0.95% | 129 ± 1 | 248     |
| 3   | 125 ± 0.85% | 129 ± 1 | 249     |
| 4   | 125 ± 0.85% | 128 ± 1 | 249     |
| 5   | 124 ± 0.85% | 128 ± 1 | 248     |

### Pre-allocation of position and color buffers

An obvious and easy enhancement yielding visible improvements.

| Run | Mean        | Median  | Samples |
|-----|-------------|---------|---------|
| 1   | 147 ± 0.77% | 149 ± 1 | 292     |
| 2   | 147 ± 0.71% | 149 ± 2 | 292     |
| 3   | 146 ± 0.49% | 146 ± 3 | 291     |
| 4   | 146 ± 0.49% | 146 ± 3 | 291     |
| 5   | 147 ± 0.44% | 146 ± 3 | 294     |

### Flattening the normalization computation

Normalizing manually instead of using what THREE.js provides makes the throughput slightly lower (~148 it/s).

### Direct array access for normal accumulation

The `nA`, `nB` and `nC` buffers and the calls to THREE.js methods (`fromBufferAttributes` and `setXYZ`) add some unnecessary overhead.

Replacing them with basic array accumulation gives those results:
| Run | Mean        | Median  | Samples |
|-----|-------------|---------|---------|
| 1   | 165 ± 0.67% | 168 ± 2 | 329     |
| 2   | 166 ± 0.65% | 168 ± 1 | 331     |
| 3   | 167 ± 0.28% | 167 ± 4 | 335     |
| 4   | 167 ± 0.43% | 167 ± 4 | 333     |
| 5   | 167 ± 0.38% | 167 ± 4 | 334     |

### Cross-product bypass

Taking advantage of the grid structure lets avoid the cross-product, on top of "flattening" the code a little bit and reducing function calls.

The improvement is smaller this time:
| Run | Mean        | Median  | Samples |
|-----|-------------|---------|---------|
| 1   | 172 ± 0.63% | 173 ± 5 | 343     |
| 2   | 173 ± 0.57% | 174 ± 5 | 344     |
| 3   | 173 ± 0.43% | 174 ± 4 | 346     |
| 4   | 173 ± 0.44% | 174 ± 4 | 346     |
| 5   | 173 ± 0.43% | 174 ± 4 | 346     |

### Padded-height buffer

Storing all the heights required for normal computation in a buffer avoids recomputing the height of cells beyond the border.

Even though normalizing manually used to be slower, here it is much better because for some reason when using THREE.js' normal computation method reduced iterations per second to ~167 a good 90% of the time.
The other 10% it was above 190 it/s.

Manual normalization lowers it back to ~188 it/s but it's still a big improvement:
| Run | Mean         | Median   | Samples |
|-----|--------------|----------|---------|
|   1 |  188 ± 0.57% |  190 ± 1 |     374 |
|   2 |  187 ± 0.68% |  189 ± 1 |     371 |
|   3 |  189 ± 0.41% |  189 ± 5 |     378 |
|   4 |  189 ± 0.37% |  189 ± 5 |     378 |
|   5 |  189 ± 0.37% |  189 ± 5 |     378 |

### Pre-allocate index array

Pre-allocating this array is a much bigger performance improvement that I expected:
| Run | Mean         | Median   | Samples |
|-----|--------------|----------|---------|
|   1 |  203 ± 0.58% |  205 ± 2 |     404 |
|   2 |  206 ± 0.52% |  208 ± 1 |     410 |
|   3 |  207 ± 0.48% |  208 ± 3 |     412 |
|   4 |  208 ± 0.36% |  207 ± 4 |     415 |
|   5 |  208 ± 0.23% |  207 ± 4 |     417 |

This improvement actually makes a lot of sense because of the size of the array (`size² * 6` because there are two triangles per cell).
