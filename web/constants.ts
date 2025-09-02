// Base dimension of a chunk in 3d space in world units.
export const CHUNK_UNIT: number = 256;

export const VERSION_PERIOD: string = 'alpha';
export const VERSION_NUMBER: string = '1';
export const VERSION_NAME: string = 'acorn';
export interface Version { period: string, number: string, name: string; }
export const VERSION: Version = { period: VERSION_PERIOD, number: VERSION_NUMBER, name: VERSION_NAME };
