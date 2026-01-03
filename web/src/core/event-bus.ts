import { vector3 } from "../maths/maths.js";

/**
 * Map from event name to event for type-safe event handling.
 */
export type EventMap = Record<string, any>;

/**
 * A function listening for events.
 */
export type Listener<T = any> = (payload: T) => void;

/**
 * A simple event bus with type-safe subscription and emission.
 */
export class EventBus<T extends EventMap> {
    private listeners: { [K in keyof T]?: Listener<T[K]>[] } = {};

    /**
     * Subscribe to an event.
     * @param event    - Event name.
     * @param listener - Event consumer to register.
     */
    on<K extends keyof T>(event: K, listener: Listener<T[K]>): void {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event]!.push(listener);
    }

    /**
     * Unsubscribe from an event.
     * @param event    - Event name.
     * @param listener - Event consumer to remove.
     */
    off<K extends keyof T>(event: K, listener: Listener<T[K]>): void {
        const arr = this.listeners[event];
        if (!arr) return;
        const index = arr.indexOf(listener);
        if (index !== -1) {
            arr.splice(index, 1);
        }
    }

    /**
     * Emit an event, calling all subscribed listeners.
     * @param event   - Event name.
     * @param payload - Data to pass to listeners.
     */
    emit<K extends keyof T>(event: K, payload: T[K]): void {
        const arr = this.listeners[event];
        if (!arr) return;
        // Use a copy to allow listeners to unsubscribe during invocation and avoid removing from an
        // array being looped on.
        arr.slice().forEach(listener => listener(payload));
    }

    /**
     * Convenience function returning a lambda event emitter calling all subscribed listeners.
     * Useful to register a callback in the UI.
     *
     * @param event   - Event name.
     * @param payload - Data to pass to listeners.
     */
    emitLambda<K extends keyof T>(event: K, payload: T[K]): () => void {
        return () => { this.emit(event, payload) };
    }

    /**
     * Subscribe to an event only once.
     * @param event    - Event name.
     * @param listener - Callback function.
     */
    once<K extends keyof T>(event: K, listener: Listener<T[K]>): void {
        const wrapper = (payload: T[K]) => {
            this.off(event, wrapper);
            listener(payload);
        };
        this.on(event, wrapper);
    }
}

/**
 * Game-specific event definitions.
 */
export interface GameEvents {
    'terrain:updated': { chunkId: string };
    'avatar:moved': { position: vector3 };
    'camera:updated': { position: vector3; target: vector3 };
    'ui:action': { action: string; data?: any };
    'state:changed': { state: any }; // Use any to avoid circular dependencies; can be refined later.
    'asset:loaded': { key: string; asset: any };
    'input:keydown': { key: string };
    'render:request': { immediate: boolean };
}

/**
 * Singleton event bus instance for the game.
 */
export const eventBus = new EventBus<GameEvents>();
