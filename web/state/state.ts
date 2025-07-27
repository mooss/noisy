import { Ctor, Registry } from "../encoding/self-encoder.js";

export const StateRegistry = new Registry();
export function register(name: string, ctor: Ctor<any>) {
    if (!StateRegistry.register(name, ctor))
        console.error(`Duplicated state registration attempt for ${name}`);
}
