import * as THREE from 'three';
import { CachedMesher } from '../src/engine/mesh/mesher.js';
import { paletteShader } from '../src/engine/mesh/shaders.js';
import { palettes } from '../src/engine/palettes.js';
import { NoiseFun } from '../src/noise/foundations.js';

const mockFun = () => 0;
const material = paletteShader(palettes['Bright terrain']);

function sameMesh(left: THREE.Mesh, right: THREE.Mesh) {
    expect(left.geometry.index).toEqual(right.geometry.index);
    expect(left.geometry.attributes.position).toEqual(right.geometry.attributes.position);
    expect(left.geometry.attributes.normal).toEqual(right.geometry.attributes.normal);
}

describe('CachedMesher', () => {
    let mesher: CachedMesher;

    beforeEach(() => {
        mesher = new CachedMesher();
        jest.clearAllMocks();
    });

    describe('weave', () => {
        it('creates new SurfaceMesher when called first time with Surface style', () => {
            const mesh = mesher.weave('Surface', mockFun, 10, material);
            expect(mesh).toBeInstanceOf(THREE.Mesh);
            expect(mesher._mesher.style).toBe('Surface');
        });

        it('creates new BoxMesher when called first time with Box style', () => {
            const mesh = mesher.weave('Box', mockFun, 8, material);
            expect(mesh).toBeInstanceOf(THREE.Mesh);
            expect(mesher._mesher.style).toBe('Box');
        });

        it('reuses SurfaceMesher when called again with same style and ncells', () => {
            const mesh1 = mesher.weave('Surface', mockFun, 5, material);
            const cached = mesher._mesher;
            const mesh2 = mesher.weave('Surface', mockFun, 5, material);
            sameMesh(mesh1, mesh2);
            expect(mesh2.matrix).toEqual(mesh1.matrix);
            expect(mesher._mesher).toBe(cached);
        });

        it('reuses BoxMesher when called again with same style and ncells', () => {
            const mesh1 = mesher.weave('Box', mockFun, 4, material);
            const cached = mesher._mesher;
            const mesh2 = mesher.weave('Box', mockFun, 4, material);
            sameMesh(mesh1, mesh2);
            expect(mesher._mesher).toBe(cached);
        });

        it('allocates new mesher when style changes', () => {
            mesher.weave('Surface', mockFun, 6, material);
            const first = mesher._mesher;
            mesher.weave('Box', mockFun, 6, material);
            expect(mesher._mesher).not.toBe(first);
            expect(mesher._mesher.style).toBe('Box');
        });

        it('uses the same mesher but reallocates the buffers when only ncells changes', () => {
            mesher.weave('Surface', mockFun, 7, material);
            const first = mesher._mesher;
            const firstPosLen = (first as any)._position.storage.array.length;
            mesher.weave('Surface', mockFun, 9, material);
            expect(mesher._mesher).toBe(first);
            expect(mesher._mesher.style).toBe('Surface');

            const newPosLen = (mesher._mesher as any)._position.storage.array.length;
            expect(firstPosLen).not.toEqual(newPosLen);
        });

        it('ignores different fun parameter and reuses mesher', () => {
            const fun1: NoiseFun = () => 1;
            const fun2: NoiseFun = () => 2;
            const mesh1 = mesher.weave('Box', fun1, 3, material);
            const cached = mesher._mesher;
            const mesh2 = mesher.weave('Box', fun2, 3, material);
            sameMesh(mesh1, mesh2);
            expect(mesher._mesher).toBe(cached);
        });

        it('ignores different palette parameter and reuses mesher', () => {
            const material2 = paletteShader(palettes['Rainbow']);
            const mesh1 = mesher.weave('Surface', mockFun, 2, material);
            const cached = mesher._mesher;
            const mesh2 = mesher.weave('Surface', mockFun, 2, material2);
            sameMesh(mesh2, mesh1);
            expect(mesher._mesher).toBe(cached);
        });

        it('allocates correct internal buffers for SurfaceMesher', () => {
            mesher.weave('Surface', mockFun, 16, material);
            const surface = mesher._mesher as any;
            expect(surface._geometry).toBeDefined();
            expect(surface._position).toBeDefined();
            expect(surface._normal).toBeDefined();
            expect(surface._index).toBeDefined();
            expect(surface._height).toBeDefined();
            expect(surface._position.storage.array.length).toBe(
                17 /*side length*/ * 17 /*side length*/ * 3 /*number of components (x, y and z)*/
            );
        });
    });
});
