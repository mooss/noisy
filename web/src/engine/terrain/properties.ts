import * as THREE from 'three';
import { CHUNK_UNIT, MINIMUM_HEIGHT } from '../../../config/constants.js';
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

    get rawVerticalUnit() { return Math.max(this.render.verticalUnit, MINIMUM_HEIGHT) }
    get verticalUnit() {
        if (this.render.geometryStyle === 'Pixel') return MINIMUM_HEIGHT;
        // Prevents the verticality to be exactly zero because it messes up with shading, basically
        // ignoring directional light.
        return this.rawVerticalUnit;
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

    renderer(center: Coordinates): TerrainRenderer { return new TerrainRenderer(this, center) }
}

export class TerrainRenderer {
    constructor(
        private params: TerrainProperties,
        private center: Coordinates,
    ) { }

    mkfun(): NoiseFun {
        return this.params.heightAt({
            x: this.center.x - this.params.loadRadius,
            y: this.center.y - this.params.loadRadius,
        });
    }
    get width(): number { return (1 + 2 * this.params.loadRadius) * this.params.resolution }
    get height(): number { return this.width }

    toRGB(): Uint8ClampedArray {
        const res = new Uint8ClampedArray(this.width * this.height * 3);
        const color = new THREE.Color();

        let idx = 0; //TODO: harmonize matrix layout everywhere, this is garbage.
        for (const [height] of this.heightMatrix()) {
            this.params.palette.lerp(height, color);
            color.convertLinearToSRGB();
            res[idx++] = color.r * 255;
            res[idx++] = color.g * 255;
            res[idx++] = color.b * 255;
        }

        return res;
    }

    private *heightMatrix(width = this.width, height = this.height): Generator<[number, number, number]> {
        // Build color-shifted height function with the top-left corner as a starting point.
        const raw = this.mkfun();
        const shift = rangeMapper(0, 1, this.params.colorLowShift, 1 + this.params.colorHighShift);
        const fun = (x: number, y: number) => shift(raw(x, y));
        const sampling = 1 / this.params.resolution;
        const halfcell = sampling * .5;

        for (let j = height - 1; j >= 0; --j) {
            for (let i = 0; i < width; ++i) {
                const x = i * sampling;
                const y = j * sampling;
                yield [fun(x + halfcell, y + halfcell), x, y];
            }
        }
    }

    toSolidVertices(): NumberArray {
        const vertices: number[] = [];
        const emit = (point: number[]) => vertices.push(point[0], point[1], point[2]);

        // Scaling factors to produce a model proportional to the render while still
        // being at a scale in the ballpark of what would fit in a 3d printer.
        const horizontalScale = CHUNK_UNIT / 8;
        const verticalScale = this.params.rawVerticalUnit / 8;

        //////////////////////
        // Surface and base //
        const surface: [number, number, number][] = [];
        const base: [number, number, number][] = [];

        // Precompute vertex positions for the grid (width+1 × height+1).
        // 1 is added to width and height because NxN quads require N+1xN+1 vertices.
        for (let [z, x, y] of this.heightMatrix(this.width + 1, this.height + 1)) {
            x *= horizontalScale;
            y *= horizontalScale;
            z *= verticalScale;
            surface.push([x, y, z]);
            base.push([x, y, 0]);
        }

        const suba = (points: number[][]) => {
            for (let j = 0; j < this.height; ++j) {
                for (let i = 0; i < this.width; ++i) {
                    const a = points[j * (this.width + 1) + i];
                    const b = points[j * (this.width + 1) + (i + 1)];
                    const c = points[(j + 1) * (this.width + 1) + i];
                    const d = points[(j + 1) * (this.width + 1) + (i + 1)];
                    emit(a); emit(b); emit(c);
                    emit(b); emit(d); emit(c);
                }
            }
        }
        suba(surface); suba(base);

        ///////////
        // Edges //
        const edge = (top1: number[], top2: number[], base1: number[], base2: number[]) => {
            emit(top1); emit(base1); emit(base2);
            emit(top1); emit(base2); emit(top2);
        };

        // North.
        for (let i = 0; i < this.width; ++i)
            edge(surface[i], surface[i + 1], base[i], base[i + 1]);

        // South.
        const offS = this.height * (this.width + 1);
        for (let i = 0; i < this.width; ++i)
            edge(surface[offS + i], surface[offS + i + 1], base[offS + i], base[offS + i + 1]);

        // West.
        const stride = this.width + 1;
        for (let j = 0; j < this.height; ++j)
            edge(surface[j * stride], surface[(j + 1) * stride],
                base[j * stride], base[(j + 1) * stride]);

        // East.
        for (let j = 0; j < this.height; ++j)
            edge(
                surface[j * stride + this.width], surface[(j + 1) * stride + this.width],
                base[j * stride + this.width], base[(j + 1) * stride + this.width],
            );

        return vertices;
    }
}
