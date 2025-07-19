import { createNoise2D } from "simplex-noise";
import { createLCG } from "../rng.js";

/** A height function, takes (x,y) coordinates and returns a height. */
export type HeightFun = (x: number, y: number) => number;

export abstract class HeightFieldBuilder2 {
    abstract build(): HeightFun;
}

export interface SimplexI { seed: number }
export class Simplex extends HeightFieldBuilder2 {
    seed: number;

    constructor(fields: SimplexI) {
        super(); Object.assign(this, fields);
    }

    build(): HeightFun { return createNoise2D(createLCG(this.seed)) }
}

export interface LayeredI {
    fundamental: number;
    octaves: number;
    persistence: number;
    lacunarity: number;
}
export class Layered<Noise extends HeightFieldBuilder2> extends HeightFieldBuilder2 {
    fundamental: number;
    octaves: number;
    persistence: number;
    lacunarity: number;

    constructor(public base: Noise, fields: LayeredI) {
        super();
        Object.assign(this, fields);
    }

    build(): HeightFun {
        const fun = this.base.build();
        return (x: number, y: number): number => {
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
                let octave = fun(x * frequency + oct, y * frequency + oct + 10);
                res += octave * amplitude;

                // Update amplitude and frequency for the next octave.
                amplitude *= this.persistence;
                frequency *= this.lacunarity;
            }

            return res;
        }
    }
}
