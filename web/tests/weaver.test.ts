import * as THREE from 'three';
import { NoiseFun } from '../src/noise/foundations.js';
import { CachedWeaver } from '../src/engine/mesh/weavers.js';

const mockFun = () => 0;

function sameGeometry(left: THREE.BufferGeometry, right: THREE.BufferGeometry) {
    expect(left.index).toEqual(right.index);
    expect(left.attributes.position).toEqual(right.attributes.position);
    expect(left.attributes.normal).toEqual(right.attributes.normal);
}

describe('CachedWeaver', () => {
    let weaver: CachedWeaver;

    beforeEach(() => {
        weaver = new CachedWeaver();
        jest.clearAllMocks();
    });

    describe('weave', () => {
        it('creates new SurfaceWeaver when called first time with Surface style', () => {
            const geometry = weaver.weave('Surface', mockFun, 10);
            expect(geometry).toBeInstanceOf(THREE.BufferGeometry);
            expect(weaver._weaver.style).toBe('Surface');
        });

        it('creates new BoxWeaver when called first time with Box style', () => {
            const geometry = weaver.weave('Box', mockFun, 8);
            expect(geometry).toBeInstanceOf(THREE.BufferGeometry);
            expect(weaver._weaver.style).toBe('Box');
        });

        it('reuses SurfaceWeaver when called again with same style and resolution', () => {
            const geometry1 = weaver.weave('Surface', mockFun, 5);
            const cached = weaver._weaver;
            const geometry2 = weaver.weave('Surface', mockFun, 5);
            sameGeometry(geometry1, geometry2);
            expect(weaver._weaver).toBe(cached);
        });

        it('reuses BoxWeaver when called again with same style and resolution', () => {
            const geometry1 = weaver.weave('Box', mockFun, 4);
            const cached = weaver._weaver;
            const geometry2 = weaver.weave('Box', mockFun, 4);
            sameGeometry(geometry1, geometry2);
            expect(weaver._weaver).toBe(cached);
        });

        it('allocates new weaver when style changes', () => {
            weaver.weave('Surface', mockFun, 6);
            const first = weaver._weaver;
            weaver.weave('Box', mockFun, 6);
            expect(weaver._weaver).not.toBe(first);
            expect(weaver._weaver.style).toBe('Box');
        });

        it('uses the same weaver but reallocates the buffers when only the resolution changes', () => {
            weaver.weave('Surface', mockFun, 7);
            const first = weaver._weaver;
            const firstPosLen = (first as any)._position.storage.array.length;
            weaver.weave('Surface', mockFun, 9);
            expect(weaver._weaver).toBe(first);
            expect(weaver._weaver.style).toBe('Surface');

            const newPosLen = (weaver._weaver as any)._position.storage.array.length;
            expect(firstPosLen).not.toEqual(newPosLen);
        });

        it('ignores different fun parameter and reuses weaver', () => {
            const fun1: NoiseFun = () => 1;
            const fun2: NoiseFun = () => 2;
            const geometry1 = weaver.weave('Box', fun1, 3);
            const cached = weaver._weaver;
            const geometry2 = weaver.weave('Box', fun2, 3);
            sameGeometry(geometry1, geometry2);
            expect(weaver._weaver).toBe(cached);
        });

        it('allocates correct internal buffers for SurfaceWeaver', () => {
            weaver.weave('Surface', mockFun, 16);
            const surface = weaver._weaver as any;
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
