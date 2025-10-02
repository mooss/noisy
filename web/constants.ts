// Base dimension of a chunk in 3d space in world units.
export const CHUNK_UNIT = 256;

// How much smaller the approximate maximum block height is compared to the side of a chunk
// (CHUNK_UNIT).
export const CHUNK_HEIGHT_DENOMINATOR = 5;

export const VERSION_PERIOD = 'alpha';
export const VERSION_NUMBER = '4';
export const VERSION_NAME = 'dandelion';

export class Version {
    constructor(public period: string, public number: string, public name: string) { }

    /**
     * @returns a standardized string containing all the version components.
     */
    string(): string {
        return `${this.period} ${this.number} (${this.name})`
    }

    /**
     * Builds a key to store information specific to this version (to use with localstorage for
     * instance).
     *
     * @param suffix - The storage key suffix.
     * @returns the version-specific storage key.
     */
    storageKey(suffix: string): string {
        return "VERSION " + this.string() + ' / ' + suffix;
    }
}
export const VERSION: Version = new Version(VERSION_PERIOD, VERSION_NUMBER, VERSION_NAME);

export const LATIN_ALPHABET = 'abcdefghijklmnopqrstuwvxyzABCDEFGHIJKLMNOPQRSTUWVXYZ';
