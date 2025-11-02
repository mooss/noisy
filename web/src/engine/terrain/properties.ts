import * as THREE from 'three';
import { Coordinates } from '../../maths/coordinates.js';
import { vector2 } from '../../maths/maths.js';
import { NoiseFun, NoiseMakerI } from '../../noise/foundations.js';
import { ChunkState } from '../../state/chunk.js';
import { RenderState } from '../../state/renderer.js';
import { ReusablePainter } from '../mesh/painters.js';
import { ReusableWeaver } from '../mesh/weavers.js';
import { MINIMUM_HEIGHT } from '../../../config/constants.js';

export class TerrainProperties {
    private _height: NoiseFun;
    private painter: ReusablePainter;

    constructor(
        private chunks: ChunkState,
        private noise: NoiseMakerI,
        private render: RenderState,
    ) {
        this.painter = new ReusablePainter(this.render);
    }

    get height(): NoiseFun { return this._height }
    get blockSize() { return this.chunks.blockSize }
    get nblocks() { return this.chunks.nblocks }
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
        return (x, y) => this.height(x + chunkCoords.x, y + chunkCoords.y);
    }

    recomputeNoise() {
        this.noise.recompute();
        this._height = this.noise.normalised(.01, 1);
    }

    weave(coords: Coordinates, weaver: ReusableWeaver): THREE.BufferGeometry {
        return weaver.weave(this.geometryStyle, this.heightAt(coords), this.nblocks);
    }

    paint(): THREE.Material { return this.painter.paint() }
}
