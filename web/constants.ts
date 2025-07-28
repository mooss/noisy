// Base dimension of a chunk in 3d space in world units.
export const CHUNK_UNIT: number = 256;

export const VERSION_CODE: string = 'alpha 1';
export const VERSION_NAME: string = 'acorn';
export interface Version { name: string; code: string; }
export const VERSION: Version = { name: VERSION_NAME, code: VERSION_CODE };
