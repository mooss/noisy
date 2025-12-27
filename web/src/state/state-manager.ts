import { Registry } from "../encoding/self-encoder.js";
import { lexon64 } from "../encoding/codecs.js";
import { Codec } from "../encoding/encoding.js";
import { downloadData } from "../utils/utils.js";

/**
 * Default key used in sessionStorage for temporary state reloading.
 */
export const TEMP_STORAGE_KEY = 'temp-load-state';

/**
 * Manages serialization, deserialization, and persistence of game state.
 *
 * @template T The type of the game state.
 */
export class StateManager<T> {
    private codec: Codec<T, string>;
    private storageKey: string;

    /**
     * @param registry   - Registry of self-encodable classes.
     * @param reference  - Reference state used to build the lexicon for compression.
     * @param alphabet   - Alphabet used for lexicon compression.
     * @param storageKey - Key for sessionStorage (defaults to DEFAULT_STORAGE_KEY).
     */
    constructor(
        private registry: Registry<any>,
        reference: T,
        alphabet: string,
        storageKey: string = TEMP_STORAGE_KEY,
    ) {
        this.codec = lexon64(registry, reference, alphabet);
        this.storageKey = storageKey;
    }

    /**
     * Encodes the given state into a URL-safe string.
     */
    encodeToURL(state: T): string {
        return this.codec.encode(state);
    }

    /**
     * Decodes a URL-safe string into a state object.
     */
    decodeFromURL(encoded: string): T {
        return this.codec.decode(encoded);
    }

    /**
     * Saves the state to sessionStorage as a JSON string (registry-encoded).
     */
    saveToSession(state: T): void {
        const encoded = this.registry.encode(state);
        sessionStorage.setItem(this.storageKey, JSON.stringify(encoded));
    }

    /**
     * Loads the state from sessionStorage, if present, and removes the storage item.
     *
     * @returns the decoded state, or `null` if not found or invalid.
     */
    loadFromSession(): T | null {
        const stored = sessionStorage.getItem(this.storageKey);
        if (!stored) return null;
        try {
            const data = JSON.parse(stored);
            const state = this.registry.decode(data);
            sessionStorage.removeItem(this.storageKey);
            return state;
        } catch (e) {
            console.error('Failed to load state from session storage', e);
            return null;
        }
    }

    /**
     * Saves the state as a JSON file (registry-encoded) and triggers a download.
     *
     * @param state    - The state to save.
     * @param filename - Name of the file (default: 'noisy-savefile.json').
     */
    saveToFile(state: T, filename: string = 'noisy-savefile.json'): void {
        const data = JSON.stringify(this.registry.encode(state), null, 2);
        downloadData(data, filename, { type: 'application/json' });
    }
}
