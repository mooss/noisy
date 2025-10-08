export interface HeightGenerator {
    at(x: number, y: number): number;
    nblocks: number;
}
