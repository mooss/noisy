// Base dimension of a chunk in 3d space in world units.
export const CHUNK_UNIT: number = 256;


export const VERSION_NUMBER: number = 1;
export const VERSION_NAME: string = 'Acorn';
export interface Version { name: string; number: number; }
export const VERSION: Version = { name: VERSION_NAME, number: VERSION_NUMBER };
