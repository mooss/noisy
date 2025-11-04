import * as THREE from 'three';
import { MINIMUM_HEIGHT } from '../../../config/constants.js';
import { Coordinates } from '../../maths/coordinates.js';
import { vector2 } from '../../maths/maths.js';
import { NoiseFun, NoiseMakerI } from '../../noise/foundations.js';
import { ChunkState } from '../../state/chunk.js';
import { RenderState } from '../../state/renderer.js';
import { ReusablePainter } from '../mesh/painters.js';
import { ReusableWeaver } from '../mesh/weavers.js';

export class TerrainProperties {
    private _heightFun: NoiseFun;
    private painter: ReusablePainter;

    constructor(
        private chunks: ChunkState,
        private noise: NoiseMakerI,
        private render: RenderState,
    ) {
        this.painter = new ReusablePainter(this.render);
    }

    get heightFun(): NoiseFun { return this._heightFun }
    get blockSize() { return this.chunks.blockSize }
    get resolution() { return this.chunks.nblocks }
    get loadRadius() { return this.chunks.loadRadius }
    get radiusType() { return this.chunks.radiusType }
    get geometryStyle() { return this.render.geometryStyle }

    get verticalUnit() {
        if (this.render.geometryStyle === 'Pixel') return MINIMUM_HEIGHT;
        // Prevents the verticality to be exactly zero because it messes up with shading, basically
        // ignoring directional light.
        return Math.max(this.render.verticalUnit, MINIMUM_HEIGHT);
    }

    heightAt(chunkCoords: vector2): (x: number, y: number) => number {
        return (x, y) => this.heightFun(x + chunkCoords.x, y + chunkCoords.y);
    }

    recomputeNoise() {
        this.noise.recompute();
        this._heightFun = this.noise.normalised(.01, 1);
    }

    weave(coords: Coordinates, weaver: ReusableWeaver): THREE.BufferGeometry {
        return weaver.weave(this.geometryStyle, this.heightAt(coords), this.resolution);
    }

    paint(): THREE.Material { return this.painter.paint() }

    renderToRGB(center: Coordinates): Uint8ClampedArray {
        const fun = this.heightAt({ x: center.x - this.loadRadius, y: center.y - this.loadRadius });
        const w = this.width; const h = this.height;
        const sampling = 1 / this.resolution;
        const res = new Uint8ClampedArray(w * h * 3);
        const color = new THREE.Color();

        let idx = 0; //TODO: harmonize matrix layout everywhere, this is garbage.
        for (let j = h - 1; j >= 0; --j) {
            for (let i = 0; i < w; ++i) {
                this.render.palette.lerp(fun(i * sampling, j * sampling), color);
                res[idx++] = color.r * 255;
                res[idx++] = color.g * 255;
                res[idx++] = color.b * 255;
            }
        }

        return res;
    }

    get width(): number { return (1 + 2 * this.loadRadius) * this.resolution }
    get height(): number { return this.width }
}
