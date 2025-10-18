import * as THREE from 'three';
import { ReusableWeaver } from '../src/engine/mesh/weavers.js';
import { NoiseFun } from '../src/noise/foundations.js';

const mockFun = () => 0;

function sameGeometry(left: THREE.BufferGeometry, right: THREE.BufferGeometry) {
    expect(left.index).toEqual(right.index);
    expect(left.attributes.position).toEqual(right.attributes.position);
    expect(left.attributes.normal).toEqual(right.attributes.normal);
}

describe('CachedWeaver', () => {
    let weaver: ReusableWeaver;

    beforeEach(() => {
        weaver = new ReusableWeaver();
        jest.clearAllMocks();
    });

    describe('weave', () => {
        it('creates new SurfaceWeaver when called first time with Surface style', () => {
            const geometry = weaver.weave('Surface', mockFun, 10);
            expect(geometry).toBeInstanceOf(THREE.BufferGeometry);
            expect(weaver.tag).toBe('Surface');
        });

        it('creates new BoxWeaver when called first time with Box style', () => {
            const geometry = weaver.weave('Box', mockFun, 8);
            expect(geometry).toBeInstanceOf(THREE.BufferGeometry);
            expect(weaver.tag).toBe('Box');
        });

        it('reuses SurfaceWeaver when called again with same style and resolution', () => {
            const geometry1 = weaver.weave('Surface', mockFun, 5);
            const cached = weaver.value;
            const geometry2 = weaver.weave('Surface', mockFun, 5);
            sameGeometry(geometry1, geometry2);
            expect(weaver.value).toBe(cached);
        });

        it('reuses BoxWeaver when called again with same style and resolution', () => {
            const geometry1 = weaver.weave('Box', mockFun, 4);
            const cached = weaver.value;
            const geometry2 = weaver.weave('Box', mockFun, 4);
            sameGeometry(geometry1, geometry2);
            expect(weaver.value).toBe(cached);
        });

        it('allocates new weaver when style changes', () => {
            weaver.weave('Surface', mockFun, 6);
            const first = weaver.value;
            weaver.weave('Box', mockFun, 6);
            expect(weaver.value).not.toBe(first);
            expect(weaver.tag).toBe('Box');
        });

        it('uses the same weaver but reallocates the buffers when only the resolution changes', () => {
            weaver.weave('Surface', mockFun, 7);
            const first = weaver.value;
            const firstPosLen = (first as any)._position.storage.array.length;
            weaver.weave('Surface', mockFun, 9);
            expect(weaver.value).toBe(first);
            expect(weaver.tag).toBe('Surface');

            const newPosLen = (weaver.value as any)._position.storage.array.length;
            expect(firstPosLen).not.toEqual(newPosLen);
        });

        it('ignores different fun parameter and reuses weaver', () => {
            const fun1: NoiseFun = () => 1;
            const fun2: NoiseFun = () => 2;
            const geometry1 = weaver.weave('Box', fun1, 3);
            const cached = weaver.value;
            const geometry2 = weaver.weave('Box', fun2, 3);
            sameGeometry(geometry1, geometry2);
            expect(weaver.value).toBe(cached);
        });

        it('allocates correct internal buffers for SurfaceWeaver', () => {
            weaver.weave('Surface', mockFun, 16);
            const surface = weaver.value as any;
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
