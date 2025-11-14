import { register } from "../../state/state.js";
import { enumerate } from "../../utils/iteration.js";
import { NoiseClass, NoiseFun, NoiseMakerBase, NoiseMakerI } from "../foundations.js";
import { bounds, computeBounds } from "../sampling.js";

interface OctaveP {
    // Descriptive name for this octave layer (shown in UI)
    name: string;
    //TIP: summed_frequency Frequency (coordinates multiplier) of this octave. Higher values will pack the terrain features closer.
    frequency: number;
    //TIP: summed_amplitude Amplitude (height multiplier) of this octave. Higher values will increase the height contribution of this octave.
    amplitude: number;
    noise: NoiseMakerI;
}

//TIP: summed (advanced) Multi-octave noise where each octave has independent persistence and lacunarity. \nAllows full control over each noise octave's amplitude and frequency multipliers. Each octave can also be any kind of noise function. \nThis is functionally layered noise but with each octave individually controllable instead of being configured through persistence and lacunarity.
interface SummedP {
    fundamental: number;
    octaves: Array<OctaveP>;
}

function sumNoises(stack: SummedP): NoiseFun {
    const tail = stack.octaves.filter(oct => oct.frequency > 0 && oct.amplitude > 0).map(octave => {
        const frequency = octave.frequency;
        // Dividing by the frequency dampens the impact of high frequencies, preventing them from
        // overwhelming the rest.
        // It makes the interactive parameters tweaking more intuitive.
        //TODO: Find a way to reduce the impact of very low frequencies (~.1), they make the
        // amplitude explode too much.
        const amplitude = octave.amplitude / frequency;
        const noise = octave.noise.make();
        return { frequency, amplitude, noise };
    });

    return (x: number, y: number): number => {
        let res = 0;
        for (const [oct, { frequency, amplitude, noise }] of enumerate(tail)) {
            // The frequency is shifted by the octave index to try and hide directional artifacts,
            // see the layerNoise function.
            res += noise(x * frequency + oct, y * frequency + oct + 10) * amplitude;
        }
        return res;
    };
}

export class Summed extends NoiseMakerBase<SummedP> {
    get class(): NoiseClass { return 'Summed' };
    bounds: bounds;
    get low(): number { return this.bounds.low }
    get high(): number { return this.bounds.high }
    recompute(): void { this.bounds = computeBounds(this.make()) }
    make(): NoiseFun { return sumNoises(this.p) }
}
register('Summed', Summed);
