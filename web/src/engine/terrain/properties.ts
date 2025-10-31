import * as THREE from 'three';
import { Coordinates } from '../../maths/coordinates.js';
import { vector2 } from '../../maths/maths.js';
import { NoiseFun, NoiseMakerI } from '../../noise/foundations.js';
import { ChunkState } from '../../state/chunk.js';
import { RenderState } from '../../state/renderer.js';
import { ReusablePainter } from '../mesh/painters.js';
import { ReusableWeaver } from '../mesh/weavers.js';

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
        // Prevents the verticality to be exactly zero because it messes up with shading, basically
        // negating directional light.
        return Math.max(this.render.verticalUnit, .0000001);
    }

    heightAt(chunkCoords: vector2): (x: number, y: number) => number {
        return (x, y) => this.height(x + chunkCoords.x, y + chunkCoords.y);
    }

    recomputeNoise() {
        this.noise.recompute();
        this._height = this.noise.normalised(.01, 1);
    }

    mesh(coords: Coordinates, weaver: ReusableWeaver): THREE.Mesh {
        const geometry = weaver.weave(this.geometryStyle, this.heightAt(coords), this.nblocks);
        return new THREE.Mesh(geometry, this.painter.paint());
    }
}
