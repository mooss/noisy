import { numStats } from "../maths/stats.js";
import { NoiseFun } from "./foundations.js";

export interface bounds { low: number; high: number; }

export interface NoiseSamplerP {
    // Number of points to sample on both the x and y dimensions.
    size: number;
    // Z-score threshold to identify data outliers.
    threshold: number;
}

// Computationally cheap sampling parameters that can extract usable statistical information about a
// noise function.
export const DEFAULT_SAMPLING = { size: 30, threshold: 4, fundamental: 3 };

export function computeBounds(
    gen: NoiseFun,
    sampling: NoiseSamplerP = DEFAULT_SAMPLING,
): bounds {
    const values = [];
    for (let x = 0; x < sampling.size; ++x)
        for (let y = 0; y < sampling.size; ++y)
            values.push(gen(x, y));
    // console.log(':VALUES', values);
    return numStats(values).outlierBounds(sampling.threshold);
}
