export function numStats(data) { return new NumStats(data) }

export class NumStats {
    constructor(data) {
        this.data = data;

        // Independant stats (don't depend on other stats).
        this.mean = data.reduce((sum, x) => sum + x, 0) / data.length;

        // Dependant stats.
        this.variance = data.reduce((sum, x) => sum + Math.pow(x - this.mean, 2), 0) / data.length;
        this.std = Math.sqrt(this.variance);
        this.zScores = data.map(x => (x - this.mean) / this.std);
    }
}
