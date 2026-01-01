import { eventBus } from "../core/event-bus.js";
import { lexon64 } from "../encoding/codecs.js";
import { Codec } from "../encoding/encoding.js";
import { Registry } from "../encoding/self-encoder.js";
import { downloadData } from "../utils/utils.js";

/**
 * Default key used in sessionStorage for temporary state reloading.
 */
export const TEMP_STORAGE_KEY = 'temp-load-state';

/**
 * Manages serialization, deserialization, and persistence of game state.
 *
 * @template STATE - The type of the game state.
 */
export class StateManager<STATE> {
    private codec: Codec<STATE, string>;
    private storageKey: string;

    /**
     * @param registry   - Registry of self-encodable classes.
     * @param reference  - Reference state used to build the lexicon for compression.
     * @param alphabet   - Alphabet used for lexicon compression.
     * @param storageKey - Key for sessionStorage (defaults to DEFAULT_STORAGE_KEY).
     */
    constructor(
        private registry: Registry<any>,
        reference: STATE,
        alphabet: string,
        storageKey: string = TEMP_STORAGE_KEY,
    ) {
        this.codec = lexon64(registry, reference, alphabet);
        this.storageKey = storageKey;
    }

    /**
     * Encodes the given state into a URL-safe string.
     */
    encodeToURL(state: STATE): string { return this.codec.encode(state) }

    /**
     * Decodes a URL-safe string into a state object.
     */
    decodeFromURL(encoded: string): STATE {
        const state = this.codec.decode(encoded);
        eventBus.emit('state:changed', { state });
        return state;
    }

    /**
     * Saves the state to sessionStorage as a JSON string (registry-encoded).
     */
    saveToSession(state: STATE): void {
        const encoded = this.registry.encode(state);
        sessionStorage.setItem(this.storageKey, JSON.stringify(encoded));
    }

    /**
     * Loads the state from sessionStorage, if present, and removes the storage item.
     *
     * @returns the decoded state, or `null` if not found or invalid.
     */
    loadFromSession(): STATE | null {
        const stored = sessionStorage.getItem(this.storageKey);
        if (!stored) return null;
        try {
            const data = JSON.parse(stored);
            const state = this.registry.decode(data);
            sessionStorage.removeItem(this.storageKey);
            eventBus.emit('state:changed', { state });
            return state;
        } catch (e) {
            console.error('Failed to load state from session storage', e);
            return null;
        }
    }

    /**
     * Loads the initial state from session storage or URL parameters, falling back to the given
     * default.
     *
     * @param defaultState - The state to return if no stored state is found.
     */
    loadInitialState(defaultState: STATE): STATE {
        const sessionState = this.loadFromSession();
        if (sessionState) {
            this.saveStateToUrl(sessionState);
            return sessionState;
        }

        const encoded = new URLSearchParams(window.location.search).get('q');
        if (encoded?.length > 0) {
            return this.decodeFromURL(encoded);
        }

        return defaultState;
    }

    /**
     * Saves the given state to the URL and updates the browser history.
     * Returns the full URL with the encoded state.
     *
     * @param state - The state to encode and push to the URL.
     */
    saveStateToUrl(state: STATE): string {
        const url = new URL(window.location.href);
        url.search = '?q=' + this.encodeToURL(state);
        const link = encodeURI(url.toString());
        window.history.pushState({ path: link }, '', link);
        return link;
    }

    /**
     * Saves the state as a JSON file (registry-encoded) and triggers a download.
     *
     * @param state    - The state to save.
     * @param filename - Name of the file.
     */
    saveToFile(state: STATE, filename: string = 'noisy-savefile.json'): void {
        const data = JSON.stringify(this.registry.encode(state), null, 2);
        downloadData(data, filename, { type: 'application/json' });
    }
}
