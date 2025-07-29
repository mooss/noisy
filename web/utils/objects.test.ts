import { clone, foreachEntries, isObject, mapObject, mapRequired } from './objects.js';

describe('objects utilities', () => {
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
        it('should transform values of an object', () => {
            const original = { a: 1, b: 2, c: 3 };
            const result = mapRequired((x) => x * 2, original);
            expect(result).toEqual({ a: 2, b: 4, c: 6 });
        });

        it('should return null when called on null', () => {
            expect(mapRequired((x) => x * 2, null)).toBe(null);
        });

        it('should handle empty objects', () => {
            const result = mapRequired((x) => x * 2, {});
            expect(result).toEqual({});
        });

        it('should handle nested objects without deep transformation', () => {
            const original = { a: { b: 1 }, c: 2 };
            const result = mapRequired((x) => (typeof x === 'number' ? x * 2 : x), original);

            expect(result).toEqual({ a: { b: 1 }, c: 4 });
            expect(result.a).toBe(original.a);
        });
    });

    describe('mapObject', () => {
        it('should transform values of an object', () => {
            const original = { a: 1, b: 2, c: 3 };
            const result = mapObject((x) => x * 2, original);
            expect(result).toEqual({ a: 2, b: 4, c: 6 });
        });

        it('should return the same primitive value when called on primitives', () => {
            expect(mapObject((x) => x * 2, 42)).toBe(42);
            expect(mapObject((x) => x, 'test')).toBe('test');
            expect(mapObject((x) => x, true)).toBe(true);
            expect(mapObject((x) => x, null)).toBe(null);
            expect(mapObject((x) => x, undefined)).toBe(undefined);
        });

        it('should handle empty objects', () => {
            const result = mapObject((x) => x * 2, {});
            expect(result).toEqual({});
        });

        it('should handle nested objects without deep transformation', () => {
            const original = { a: { b: 1 }, c: 2 };
            const result = mapObject((x) => (typeof x === 'number' ? x * 2 : x), original);

            expect(result).toEqual({ a: { b: 1 }, c: 4 });
            expect(result.a).toBe(original.a);
        });
    });

    describe('foreachEntries', () => {
        it('should call the function for each entry', () => {
            const obj = { a: 1, b: 2, c: 3 };
            const mockFn = jest.fn();

            foreachEntries(mockFn, obj);

            expect(mockFn).toHaveBeenCalledTimes(3);
            expect(mockFn).toHaveBeenCalledWith('a', 1);
            expect(mockFn).toHaveBeenCalledWith('b', 2);
            expect(mockFn).toHaveBeenCalledWith('c', 3);
        });

        it('should not call the function for non-objects', () => {
            const mockFn = jest.fn();

            foreachEntries(mockFn, 42);
            foreachEntries(mockFn, 'test');
            foreachEntries(mockFn, null);

            expect(mockFn).not.toHaveBeenCalled();
        });

        it('should not call the function for empty objects', () => {
            const mockFn = jest.fn();

            foreachEntries(mockFn, {});

            expect(mockFn).not.toHaveBeenCalled();
        });
    });
});
