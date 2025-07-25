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

export function* mapit<From, To>(fun: (x: From) => To, source: Iterable<From>): Generator<To> {
    for (const value of source)
        yield fun(value);
}
