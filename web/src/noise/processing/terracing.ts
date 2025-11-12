import { CHUNK_HEIGHT_DENOMINATOR } from "../../../config/constants.js";
import { ChunkState } from "../../state/chunk.js";
import { register } from "../../state/state.js";
import { NoiseClass, NoiseFun } from "../foundations.js";
import { NoiseWrapper } from "./processing.js";

function quantize(value: number, delta: number) {
    return delta * Math.floor(value / delta + .5);
}
function terrace(value: number, steps: number) {
    return Math.round(value * (steps - 1)) / steps;
}

//TIP: terracing Adds steps in the terrain, creating terraces.

//TIP: terracing_constant Use the same amount of terraces everywhere. \nCreates a blocky terrain with evenly-spaced terrain.
interface TerracingP {
    //TIP: terracing_steps Number of terraces used in the terrain. \nMore terraces will create a smoother terrain.
    steps: number;
}
export class Terracing extends NoiseWrapper<TerracingP> {
    get class(): NoiseClass { return 'Terracing' }
    make(): NoiseFun {
        const fun = this.wrapped.make();
        if (this.p.steps == 0) return fun;
        return (x, y) => terrace(fun(x, y), this.p.steps);
    }
}
register('Terracing', Terracing);

//TIP: terracing_voxels Make the number of terraces proportional to the chunk resolution. \nCreates square blocks reminiscent of Minecraft.
interface VoxelTerracingP {
    chunks: ChunkState;
}
export class VoxelTerracing extends NoiseWrapper<VoxelTerracingP> {
    get class(): NoiseClass { return 'VoxelTerracing' }
    make(): NoiseFun {
        const fun = this.wrapped.make();
        const range = (this.high - this.low);
        const delta = range / this.p.chunks.resolution * CHUNK_HEIGHT_DENOMINATOR;
        return (x, y) => quantize(fun(x, y), delta);
    }
}
register('VoxelTerracing', VoxelTerracing);
