import * as THREE from 'three';
import { MINIMUM_HEIGHT } from '../../../config/constants.js';
import { Coordinates } from '../../maths/coordinates.js';
import { rangeMapper, vector2 } from '../../maths/maths.js';
import { NoiseFun, NoiseMakerI } from '../../noise/foundations.js';
import { ChunkState } from '../../state/chunk.js';
import { RenderState } from '../../state/renderer.js';
import { ReusablePainter } from '../mesh/painters.js';
import { ReusableWeaver } from '../mesh/weavers.js';

export class TerrainProperties {
    private _heightFun: NoiseFun;

    /** Painter that will be used to create the material. */
    private painter: ReusablePainter;
    /**
     * Last material constructed.
     * It is necessary when dealing with uniforms because rebuilding it when changing the uniforms
     * is not an options since they are only accessible after rendering.
     * Plus it is cheaper not to rebuild.
     */
    private cachedMaterial: THREE.MeshStandardMaterial;

    constructor(
        private chunks: ChunkState,
        private noise: NoiseMakerI,
        private render: RenderState,
    ) { this.painter = new ReusablePainter(this) }

    // Implementation of painter parameters.
    get geometryStyle() { return this.render.geometryStyle }
    get painterStyle() { return this.render.painterStyle }
    get paletteName() { return this.render.paletteName }
    get palette() { return this.render.palette }
    get colorLowShift() { return this.render.colorLowShift }
    get colorHighShift() { return this.render.colorHighShift }
    get colorSlope() { return this.render.colorSlope * this.chunks.resolution }
    get texturePath() { return this.render.texturePath }
    get textureRepeat() { return this.render.textureRepeat }
    get textureBumpScale() { return this.render.textureBumpScale }

    get heightFun(): NoiseFun { return this._heightFun }

    get blockSize() { return this.chunks.blockSize }
    get chunkPower() { return this.chunks.power }
    get loadRadius() { return this.chunks.loadRadius }
    get radiusType() { return this.chunks.radiusType }
    get material() { return this.cachedMaterial }
    get resolution() { return this.chunks.resolution }

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
        return weaver.weave(this.heightAt(coords), this.resolution);
    }

    paint(): THREE.Material {
        this.cachedMaterial = this.painter.paint();
        return this.cachedMaterial;
    }

    renderToRGB(center: Coordinates): Uint8ClampedArray {
        // Build color-shifted height function with the top-left corner as a starting point.
        const raw = this.heightAt({ x: center.x - this.loadRadius, y: center.y - this.loadRadius });
        const shift = rangeMapper(0, 1, this.render.colorLowShift, 1 + this.render.colorHighShift);
        const fun = (x: number, y: number) => shift(raw(x, y));

        const w = this.width; const h = this.height;
        const sampling = 1 / this.resolution;
        const halfcell = sampling * .5; // Will be used to center the pixels.
        const res = new Uint8ClampedArray(w * h * 3);
        const color = new THREE.Color();

        let idx = 0; //TODO: harmonize matrix layout everywhere, this is garbage.
        for (let j = h - 1; j >= 0; --j) {
            for (let i = 0; i < w; ++i) {
                const height = fun(i * sampling + halfcell, j * sampling + halfcell);
                this.render.palette.lerp(height, color);
                color.convertLinearToSRGB();
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
