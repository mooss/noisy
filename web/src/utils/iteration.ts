//TODO: use yield*.
export function* combinations<T>(alphabet: Iterable<T>): Generator<Array<T>> {
    const alpharray = Array.from(alphabet);
    if (alpharray.length === 0) return;
    for (const res of combinations_impl(alpharray, []))
        yield res;
}

function* combinations_impl<T>(alphabet: Array<T>, acc: Array<T>): Generator<Array<T>> {
    // Flat combinations of length n+1.
    acc.push(alphabet[0]);
    for (const letter of alphabet.slice(1)) {
        yield acc;
        acc[acc.length - 1] = letter;
    }
    yield acc;

    // Recursive combination of length n+2.
    for (const letter of alphabet) {
        acc[acc.length - 1] = letter;
        for (const res of combinations_impl(alphabet, acc)) {
            yield res;
        }
    }
}

export function* mapit<From, To>(source: Iterable<From>, fun: (x: From) => To): Generator<To> {
    for (const value of source)
        yield fun(value);
}

/** Iterate on a range of number, similar to Python's `range`. */
export function* range(start: number, stop: number = null, step: number = 1) {
    if (stop == null) { // range(x) -> from 0 to x;
        stop = start;
        start = 0;
    }

    for (let i = 0; step > 0 ? i < stop : i > stop; i += step) yield i;
}

/** Iterate on a container in reverse. */
export function* reverse<T>(container: ArrayLike<T>): Generator<T> {
    for (let i = container.length - 1; i >= 0; --i) yield container[i];
}


/**
 * Yield [index, value] pairs like Python’s `enumerate`.
 * Note: this is way slower than using a native for loop and should not be used in
 * performance-sensitive code.
 */
export function* enumerate<T>(iterable: Iterable<T>): Generator<[number, T]> {
    let i = 0;
    for (const value of iterable) yield [i++, value];
}
