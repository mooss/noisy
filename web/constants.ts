// Base dimension of a chunk in 3d space in world units.
export const CHUNK_UNIT: number = 256;

export const VERSION_PERIOD: string = 'alpha';
export const VERSION_NUMBER: string = '2';
export const VERSION_NAME: string = 'bean';

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
