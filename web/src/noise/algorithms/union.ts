import { register } from "../../state/state.js";
import { NoiseClass, NoiseFun, NoiseMakerBase, NoiseMakerI } from "../foundations.js";
import { bounds, computeBounds } from "../sampling.js";

interface OctaveP {
    // Descriptive name for this octave layer (shown in UI)
    name: string;
    //TIP: union_frequency Frequency (coordinates multiplier) of this octave. Higher values will pack the terrain features closer.
    frequency: number;
    //TIP: union_amplitude Amplitude (height multiplier) of this octave. Higher values will increase the height contribution of this octave.
    amplitude: number;
    noise: NoiseMakerI;
}

//TIP: union (advanced) Multi-octave noise where each octave is combined using an operation (sum, min, max). \nAllows full control over each noise octave's amplitude and frequency multipliers. Each octave can also be any kind of noise function. \nThis is functionally layered noise but with each octave individually controllable instead of being configured through persistence and lacunarity.
export type UnionOperation = 'sum' | 'min' | 'max';

interface UnionP {
    //TIP: union_operation How to combine the noises of this union.
    operation: UnionOperation;
    fundamental: number;
    octaves: Array<OctaveP>;
}

function combineNoises(stack: UnionP): NoiseFun {
    const octaves = stack.octaves.map((octave, offset) => {
        const noise = octave.noise.normalised(0, 1);
        const frequency = octave.frequency;
        let amplitude = octave.amplitude;

        // Dividing by the frequency dampens the impact of high frequencies, preventing them from
        // overwhelming the rest.
        // It makes the interactive parameters tweaking more intuitive.
        //TODO: Find a way to reduce the impact of very low frequencies (~.1), they make the
        // amplitude explode too much.
        if (stack.operation === 'sum') amplitude /= frequency;

        // The offset is used later to shift frequency.
        // It is built before filtering to keep the noise consistent when an octave is disabled.
        return { frequency, amplitude, noise, offset };
    }).filter(oct => oct.frequency > 0 && oct.amplitude > 0);

    const acc = new Array<number>(octaves.length).fill(0);
    return (x: number, y: number): number => {
        for (let oct = 0; oct < octaves.length; ++oct) {
            const { frequency, amplitude, noise, offset } = octaves[oct];
            // The frequency is shifted by the octave index to try and hide directional artifacts,
            // see the layerNoise function.
            acc[oct] = noise(x * frequency + offset, y * frequency + offset + 10) * amplitude;
        }

        switch (stack.operation) {
            case 'sum': return acc.reduce((a, b) => a + b, 0);
            case 'min': return Math.min(...acc);
            case 'max': return Math.max(...acc);
            default: throw new Error(`Unknown operation: ${stack.operation}`);
        }
    };
}

export class Union extends NoiseMakerBase<UnionP> {
    get class(): NoiseClass { return 'Union' };
    bounds: bounds;
    get low(): number { return this.bounds.low }
    get high(): number { return this.bounds.high }
    recompute(): void { this.bounds = computeBounds(this.make()) }
    make(): NoiseFun { return combineNoises(this.p) }
}
register('Union', Union);
