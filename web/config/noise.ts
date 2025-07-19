import { createNoise2D } from "simplex-noise";
import { createLCG } from "../rng.js";

/** A height function, takes (x,y) coordinates and returns a height. */
export type HeightFun = (x: number, y: number) => number;

export abstract class HeightField2 {
    abstract at(x: number, y: number): number;
    fun(): HeightFun { return this.at.bind(this) }
}

export interface SimplexI { seed: number }
export class Simplex extends HeightField2 {
    seed: number;
    private raw: HeightFun;

    constructor(fields: SimplexI) {
        super(); Object.assign(this, fields);
        this.raw = createNoise2D(createLCG(this.seed))
    }

    at(x: number, y: number): number { return this.raw(x, y) }
}

export interface LayeredI {
    fundamental: number;
    octaves: number;
    persistence: number;
    lacunarity: number;
}
export class Layered<Noise extends HeightField2> extends HeightField2 {
    fundamental: number;
    octaves: number;
    persistence: number;
    lacunarity: number;

    constructor(public base: Noise, fields: LayeredI) {
        super();
        Object.assign(this, fields);
    }

    at(x: number, y: number): number {
        let res = 0;
        let frequency = this.fundamental;
        let amplitude = 1;

        for (let oct = 0; oct < this.octaves; oct++) {
            // The noise is shifted with the octave index to avoid the artifact that occurs at the
            // origin when layering noise.
            // This artifact is probably due to the fact that the same base noise value is
            // accumulated at the origin, thus reinforcing the directionality that can occur in raw
            // noise.
            // I don't know where this idea that simplex has no directional artifacts because they
            // are very much visible in this project.
            let octave = this.base.at(x * frequency + oct, y * frequency + oct + 10);
            res += octave * amplitude;

            // Update amplitude and frequency for the next octave.
            amplitude *= this.persistence;
            frequency *= this.lacunarity;
        }

        return res;
    }
}
