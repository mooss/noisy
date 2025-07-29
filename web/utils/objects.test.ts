import { clone, foreachEntries, isObject, mapObject, mapObjectOrArray, mapRequired } from './objects.js';

describe('objects utilities', () => {
    // Shared test data
    const a1b2c3 = { a: 1, b: 2, c: 3 };
    const a1b2c3Nested = { a: { b: 1 }, c: 2 };
    const primitiveValues = [42, 'test', true, null, undefined] as const;

    // Shared test cases
    const testPrimitiveHandling = (fn: Function, name: string) => {
        describe(`${name} primitive handling`, () => {
            it('should return the same primitive value when called on primitives', () => {
                primitiveValues.forEach((value) => {
                    expect(fn((x: any) => x * 2, value)).toBe(value);
                });
            });
        });
    };

    const testEmptyObjects = (fn: Function, name: string) => {
        describe(`${name} empty collections`, () => {
            it('should handle empty objects', () => {
                const result = fn((x: any) => x * 2, {});
                expect(result).toEqual({});
            });
        });
    };

    const testNestedObjects = (fn: Function, name: string) => {
        describe(`${name} nested objects`, () => {
            it('should handle nested objects without deep transformation', () => {
                const original = a1b2c3Nested;
                const result = fn((x: any) => (typeof x === 'number' ? x * 2 : x), original);

                expect(result).toEqual({ a: { b: 1 }, c: 4 });
                expect(result.a).toBe(original.a);
            });
        });
    };

    describe('clone', () => {
        it('should deep clone a simple object', () => {
            const original = { a: 1, b: 'test' };
            const cloned = clone(original);

            expect(cloned).toEqual(original);
            expect(cloned).not.toBe(original);
        });

        it('should deep clone a nested object', () => {
            const original = { a: 1, b: { c: 2, d: { e: 3 } } };
            const cloned = clone(original);

            expect(cloned).toEqual(original);
            expect(cloned).not.toBe(original);
            expect(cloned.b).not.toBe(original.b);
            expect(cloned.b.d).not.toBe(original.b.d);
        });

        it('should deep clone an object containing an array', () => {
            const original = { arr: [1, 2, { a: 3 }], barr: 16 };
            const cloned = clone(original);

            expect(cloned).toEqual(original);
            expect(cloned).not.toBe(original);
            expect(cloned.arr[2]).not.toBe(original.arr[2]);
        });

        it('should deep clone an array', () => {
            const original = [1, 2, { a: 3 }];
            const cloned = clone(original);

            expect(cloned).toEqual(original);
            expect(cloned).not.toBe(original);
            expect(cloned[2]).not.toBe(original[2]);
        });

        it('should handle null and undefined', () => {
        });

        it('should handle primitive values', () => {
            expect(clone(null)).toBe(null);
            expect(clone(undefined)).toBe(undefined);
            expect(clone(42)).toBe(42);
            expect(clone('test')).toBe('test');
            expect(clone(true)).toBe(true);
        });
    });

    describe('isObject', () => {
        it('should return true for objects', () => {
            expect(isObject({})).toBe(true);
            expect(isObject({ a: 1 })).toBe(true);
            expect(isObject([])).toBe(true);
        });

        it('should return false for primitives', () => {
            expect(isObject(42)).toBe(false);
            expect(isObject(null)).toBe(false);
            expect(isObject(true)).toBe(false);
            expect(isObject('test')).toBe(false);
            expect(isObject(undefined)).toBe(false);
            expect(isObject(BigInt(12))).toBe(false);
            expect(isObject(Symbol("sym"))).toBe(false);
        });
    });

    describe('mapRequired', () => {
        it('should transform the values of an object', () => {
            const original = a1b2c3;
            const result = mapRequired((x) => x * 2, original);
            expect(result).toEqual({ a: 2, b: 4, c: 6 });
        });

        it('should return null when called on null', () => {
            expect(mapRequired((x) => x * 2, null)).toBe(null);
        });

        testEmptyObjects(mapRequired, 'mapRequired');
        testNestedObjects(mapRequired, 'mapRequired');
    });

    describe('mapObject', () => {
        it('should transform the values of an object', () => {
            const original = a1b2c3;
            const result = mapObject((x) => x * 2, original);
            expect(result).toEqual({ a: 2, b: 4, c: 6 });
        });

        testPrimitiveHandling(mapObject, 'mapObject');
        testEmptyObjects(mapObject, 'mapObject');
        testNestedObjects(mapObject, 'mapObject');
    });

    describe('mapObjectOrArray', () => {
        it('should transform the values of an object', () => {
            const original = a1b2c3;
            const result = mapObjectOrArray((x) => x * 2, original);
            expect(result).toEqual({ a: 2, b: 4, c: 6 });
        });

        it('should transform the values of an array', () => {
            const original = [1, 2, 3];
            const result = mapObjectOrArray((x) => x * 2, original);
            expect(result).toEqual([2, 4, 6]);
        });

        testPrimitiveHandling(mapObjectOrArray, 'mapObjectOrArray');

        testEmptyObjects(mapObjectOrArray, 'mapObjectOrArray');

        it('should handle empty arrays', () => {
            const result = mapObjectOrArray((x) => x * 2, []);
            expect(result).toEqual([]);
        });

        testNestedObjects(mapObjectOrArray, 'mapObjectOrArray');

        it('should handle nested arrays without deep transformation', () => {
            const original = [{ a: 1 }, { b: 2 }, 3];
            const result = mapObjectOrArray((x) => (typeof x === 'number' ? x * 2 : x), original);

            expect(result).toEqual([{ a: 1 }, { b: 2 }, 6]);
            expect(result[0]).toBe(original[0]);
            expect(result[1]).toBe(original[1]);
        });
    });

    describe('foreachEntries', () => {
        it('should call the function for each entry', () => {
            const obj = a1b2c3;
            const mockFn = jest.fn();

            foreachEntries(mockFn, obj);

            expect(mockFn).toHaveBeenCalledTimes(3);
            expect(mockFn).toHaveBeenCalledWith('a', 1);
            expect(mockFn).toHaveBeenCalledWith('b', 2);
            expect(mockFn).toHaveBeenCalledWith('c', 3);
        });

        it('should not call the function for non-objects', () => {
            const mockFn = jest.fn();

            primitiveValues.forEach((value) => {
                foreachEntries(mockFn, value);
            });

            expect(mockFn).not.toHaveBeenCalled();
        });

        it('should not call the function for empty objects', () => {
            const mockFn = jest.fn();

            foreachEntries(mockFn, {});

            expect(mockFn).not.toHaveBeenCalled();
        });
    });
});
