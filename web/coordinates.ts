/////////////////////////
// Integer coordinates //

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
     * Generates a list of coordinates within the circle of the specified radius around this block.
     * @param radius - The radius (in chunks or blocks) around the center.
     * @param fun - Callback function that receives each coordinate.
     */
    withinCircle(radius: number, fun: (coord: Coordinates) => void): void {
        const radiusSquared = radius * radius;
        const minX = Math.floor(this.x - radius);
        const maxX = Math.floor(this.x + radius);
        const minY = Math.floor(this.y - radius);
        const maxY = Math.floor(this.y + radius);

        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                const dx = x - this.x;
                const dy = y - this.y;
                if (dx * dx + dy * dy <= radiusSquared) {
                    fun(new Coordinates(x, y));
                }
            }
        }
    }

    /**
     * Generates a list of coordinates within a specified square radius around this block.
     * @param radius - The radius (in chunks or blocks) around the center.
     * @param fun - Callback function that receives each coordinate.
     */
    withinSquare(radius: number, fun: (coord: Coordinates) => void): void {
        for (let x = this.x - radius; x <= this.x + radius; x++) {
            for (let y = this.y - radius; y <= this.y + radius; y++) {
                fun(new Coordinates(x, y));
            }
        }
    }

    equals(other: Coordinates): boolean { return this.x === other.x && this.y === other.y }
    string(): string { return `${this.x},${this.y}` }
}

/**
 * Represents 3D floating-point coordinates for points in the world, either local or global.
 */
export class Position {
    /** The X coordinate. */
    x: number;
    /** The Y coordinate. */
    y: number;
    /** The Z coordinate. */
    z: number;

    /**
     * @param x - The X coordinate.
     * @param y - The Y coordinate.
     * @param z - The Z coordinate.
     */
    constructor(x: number, y: number, z: number) { this.x = x; this.y = y; this.z = z; }

    /**
     * Convert the position to the chunk Coordinates containing it.
     * This is just a conversion of the x and y coordinates to an int.
     * @returns The chunk coordinates.
     */
    toChunk(): Coordinates {
        return new Coordinates(Math.floor(this.x), Math.floor(this.y));
    }
}
