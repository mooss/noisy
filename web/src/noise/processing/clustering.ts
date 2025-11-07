import { register } from "../../state/state.js";
import { NoiseClass, NoiseFun } from "../foundations.js";
import { NoiseWrapper } from "./processing.js";

//TIP: clustering Groups neighboring coordinates together to form chunks of uniform height. \nCreates shapes looking like continents, camouflage pattern or biomes.
interface ClusteringP {
    //TIP: clustering_coorscale Multiplier for the tile coordinates, dictates the tile density. \nHigher values will result in more tiles packed into a chunk.
    coorscale: number;

    //TIP: clustering_enabled Toggles clustering on or off.
    enabled: boolean;

    //TIP: clustering_noisescale Magnitude of the distortion applied to each tile. \nHigher values will make the tiles less square and more chaotic.
    noisescale: number;
}
export class Clustering extends NoiseWrapper<ClusteringP> {
    get class(): NoiseClass { return 'Clustering' }
    make(): NoiseFun {
        if (!this.p.enabled) return this.wrapped.make();
        const fun = this.wrapped.normalised(0, 1);
        return (x, y) => {
            const raw = fun(x, y);
            x = this.p.coorscale * x + this.p.noisescale * raw;
            y = this.p.coorscale * y + this.p.noisescale * fun(x + 10, y);
            return fun(Math.round(x), Math.round(y));
        }
    }
    get low() { return this.p.enabled ? 0 : this.wrapped.low }
    get high() { return this.p.enabled ? 1 : this.wrapped.high }
}
register('Clustering', Clustering);
