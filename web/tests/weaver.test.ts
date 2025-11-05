import * as THREE from 'three';
import { GeometryStyle, ReusableWeaver } from '../src/engine/mesh/weavers.js';
import { NoiseFun } from '../src/noise/foundations.js';

const mockFun = () => 0;

function sameGeometry(left: THREE.BufferGeometry, right: THREE.BufferGeometry) {
    expect(left.index).toEqual(right.index);
    expect(left.attributes.position).toEqual(right.attributes.position);
    expect(left.attributes.normal).toEqual(right.attributes.normal);
}

describe('CachedWeaver', () => {
    const mkw = (style: GeometryStyle) => new ReusableWeaver({
        geometryStyle: style,
        texturePath: '',
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('weave', () => {
        it('creates new SurfaceWeaver when called first time with Surface style', () => {
            const weaver = mkw('Surface');
            const geometry = weaver.weave(mockFun, 10);
            expect(geometry).toBeInstanceOf(THREE.BufferGeometry);
            expect(weaver.cache.tag).toBe('Surface');
        });

        it('creates new BoxWeaver when called first time with Box style', () => {
            const weaver = mkw('Box');
            const geometry = weaver.weave(mockFun, 8);
            expect(geometry).toBeInstanceOf(THREE.BufferGeometry);
            expect(weaver.cache.tag).toBe('Box');
        });

        it('reuses SurfaceWeaver when called again with same style and resolution', () => {
            const weaver = mkw('Surface');
            const geometry1 = weaver.weave(mockFun, 5);
            const cached = weaver.cache.value;
            const geometry2 = weaver.weave(mockFun, 5);
            sameGeometry(geometry1, geometry2);
            expect(weaver.cache.value).toBe(cached);
        });

        it('reuses BoxWeaver when called again with same style and resolution', () => {
            const weaver = mkw('Box');
            const geometry1 = weaver.weave(mockFun, 4);
            const cached = weaver.cache.value;
            const geometry2 = weaver.weave(mockFun, 4);
            sameGeometry(geometry1, geometry2);
            expect(weaver.cache.value).toBe(cached);
        });

        it('allocates new weaver when style changes', () => {
            let weaver = mkw('Surface');
            weaver.weave(mockFun, 6);
            const first = weaver.cache.value;
            weaver.params.geometryStyle = 'Box';
            weaver.weave(mockFun, 6);
            expect(weaver.cache.value).not.toBe(first);
            expect(weaver.cache.tag).toBe('Box');
        });

        it('uses the same weaver but reallocates the buffers when only the resolution changes', () => {
            const weaver = mkw('Surface');
            weaver.weave(mockFun, 7);
            const first = weaver.cache.value;
            const firstPosLen = (first as any)._position.storage.array.length;
            weaver.weave(mockFun, 9);
            expect(weaver.cache.value).toBe(first);
            expect(weaver.cache.tag).toBe('Surface');

            const newPosLen = (weaver.cache.value as any)._position.storage.array.length;
            expect(firstPosLen).not.toEqual(newPosLen);
        });

        it('ignores different fun parameter and reuses weaver', () => {
            const weaver = mkw('Box');
            const fun1: NoiseFun = () => 1;
            const fun2: NoiseFun = () => 2;
            const geometry1 = weaver.weave(fun1, 3);
            const cached = weaver.cache.value;
            const geometry2 = weaver.weave(fun2, 3);
            sameGeometry(geometry1, geometry2);
            expect(weaver.cache.value).toBe(cached);
        });

        it('allocates correct internal buffers for SurfaceWeaver', () => {
            const weaver = mkw('Surface');
            weaver.weave(mockFun, 16);
            const surface = weaver.cache.value as any;
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
