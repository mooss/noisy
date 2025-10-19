/**
 * Executes a function asynchronously, unless the provided signal is aborted before the promise is
 * resolved.
 *
 * @param signal - Signal to monitor for cancellation.
 * @param fun    - The function to be executed asynchronously.
 * @returns a promise that will resolve if the signal was not aborted before.
 */
export async function race<T>(signal: AbortSignal, fun: () => T): Promise<T> {
    return new Promise(resolve => setTimeout(resolve, 0)).then(() => {
        if (signal.aborted) return;
        return fun();
    });
}
