export function numStats(data: number[]): NumStats { return new NumStats(data) }

export class NumStats {
    data: number[];
    mean: number;
    variance: number;
    std: number;
    zScores: number[];

    constructor(data: number[]) {
        this.data = data;

        // Independant stats (don't depend on other stats).
        this.mean = data.reduce((sum, x) => sum + x, 0) / data.length;

        // Dependant stats.
        this.variance = data.reduce((sum, x) => sum + Math.pow(x - this.mean, 2), 0) / data.length;
        this.std = Math.sqrt(this.variance);
        this.zScores = data.map(x => (x - this.mean) / this.std);
    }

    /**
     * Returns the bounds of the data outliers using the Z-score.
     *
     * The low bound is the lowest value with a Z-score above -threshold.
     * The high bound is the highest value with a Z-score below threshold.
     */
    outlierBounds(threshold: number): { low: number, high: number } {
        let lowz = Infinity, highz = -Infinity, lowi, highi;
        this.zScores.forEach((zscore, i) => {
            if (zscore > -threshold && zscore < lowz) { lowz = zscore; lowi = i }
            if (zscore < threshold && zscore > highz) { highz = zscore, highi = i }
        })
        return {low: this.data[lowi], high: this.data[highi]}
    }
}
