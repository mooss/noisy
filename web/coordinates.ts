import { AutoEncoder } from "./encoding/self-encoder.js";
import { register } from "./state/state.js";

/**
 * Represents 2D integer coordinates for blocks, either locally within a chunk or globally within
 * the grid.
 */
export class Coordinates {
    /** The X coordinate. */
    x: number;
    /** The Y coordinate. */
    y: number;

    /**
     * @param x - The X coordinate.
     * @param y - The Y coordinate.
     */
    constructor(x: number, y: number) { this.x = x; this.y = y; }

    /**
     * Convert global block coordinates to the coordinates of the chunk containing them.
     * @param nblocks - The number of blocks in a chunk.
     * @returns The chunk coordinates.
     */
    toChunk(nblocks: number): Coordinates {
        return new Coordinates(Math.floor(this.x / nblocks), Math.floor(this.y / nblocks));
    }

    /**
     * Convert global block coordinates to local block coordinates within their chunk.
     * @param nblocks - The number of blocks in a chunk.
     * @returns The local coordinates.
     */
    toLocal(nblocks: number): Coordinates {
        return new Coordinates(
            ((this.x % nblocks) + nblocks) % nblocks,
            ((this.y % nblocks) + nblocks) % nblocks,
        );
    }

    /**
     * Iterates in spiral around the current point, staying within the specified square radius.
     * Assumes integer coordinates.
     *
     * @param radius - The radius around the center.
     * @param fun    - Callback function that receives each coordinate.
     */
    spiralCircle(radius: number, fun: (coord: Coordinates) => void): void {
        const radiusSquared = radius * radius;

        this.spiralSquare(radius, (coor) => {
            const dx = coor.x - this.x;
            const dy = coor.y - this.y;
            if (dx * dx + dy * dy <= radiusSquared) {
                fun(new Coordinates(coor.x, coor.y));
            }
        });
    }

    /**
     * Iterates in spiral around the current point, staying within the specified square radius.
     * Assumes integer coordinates.
     * The goal is to iterate first on the coordinates closest to the center, but it's actually not
     * optimal because it iterates in a square spiral whereas a circle spiral is necessary to stay
     * the closest to the center.
     *
     * @param radius - The radius around the center.
     * @param fun    - Callback function that receives each coordinate.
     */
    spiralSquare(radius: number, fun: (coord: Coordinates) => void): void {
        let x = this.x; let y = this.y;
        const call = () => {
            console.log(':X', x, ':Y', y);
            fun(new Coordinates(x, y));
        }
        call(); // Center.

        // The general formula to add the radius i to the spiral is:
        //  - 1       left
        //  - 2i - 1  down
        //  - 2i      right
        //  - 2i      up
        //  - 2i      left
        for (let i = 1; i <= radius; ++i) {
            x--; call();     // Left.
            for (let j = 1; j <= 2 * i - 1; ++j) {
                y--; call(); // Down.
            }
            for (let j = 1; j <= 2 * i; ++j) {
                x++; call(); // Right.
            }
            for (let j = 1; j <= 2 * i; ++j) {
                y++; call(); // Up.
            }
            for (let j = 1; j <= 2 * i; ++j) {
                x--; call(); // Left.
            }
        }

        return;
    }

    equals(other: Coordinates): boolean { return this.x === other.x && this.y === other.y }
    string(): string { return `${this.x},${this.y}` }
}

/**
 * Represents 3D floating-point coordinates for points in the world, either local or global.
 */
export class Position extends AutoEncoder<Position> {
    class(): string { return 'Position' }
    /** The X coordinate. */
    declare x: number;
    /** The Y coordinate. */
    declare y: number;
    /** The Z coordinate. */
    declare z: number;

    /**
     * Convert the position to the chunk Coordinates containing it.
     * This is just a conversion of the x and y coordinates to an int.
     * @returns The chunk coordinates.
     */
    toChunk(): Coordinates {
        return new Coordinates(Math.floor(this.x), Math.floor(this.y));
    }
}
register('Position', Position)
