/////////////////////////
// Integer coordinates //

/**
 * Represents 2D integer coordinates for blocks, either locally within a chunk or globally within
 * the grid.
 */
export class Coordinates {
    /** @type {number} x - The X coordinate. */
    x;
    /** @type {number} y - The Y coordinate. */
    y;

    /**
     * @param {number} x - The X coordinate.
     * @param {number} y - The Y coordinate.
     */
    constructor(x, y) { this.x = x; this.y = y; }

    /**
     * Convert global block coordinates to the coordinates of the chunk containing them.
     *
     * @param {number} nblocks - The number of blocks in a chunk.
     * @returns {Coordinates} The chunk coordinates.
     */
    toChunk(nblocks) {
        return new Coordinates(Math.floor(this.x / nblocks), Math.floor(this.y / nblocks));
    }

    /**
     * Convert global block coordinates to local block coordinates within their chunk.
     *
     * @param {number} nblocks - The number of blocks in a chunk.
     * @returns {Coordinates} The local coordinates.
     */
    toLocal(nblocks) {
        return new Coordinates(
            ((this.x % nblocks) + nblocks) % nblocks,
            ((this.y % nblocks) + nblocks) % nblocks,
        );
    }

    /**
     * Generates a list of coordinates within the circle of the specified radius around this block.
     *
     * @param {number} radius - The radius (in chunks or blocks) around the center.
     * @param {function} fun - Callback function that receives each coordinate.
     */
    within(radius, fun) {
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

    equals(other) { return this.x == other.x && this.y == other.y }
    string() { return `${this.x},${this.y}` }
}

/**
 * Represents 3D floating-point coordinates for points in the world, either local or global.
 */
export class Position {
    /** @type {number} x - The X coordinate. */
    x;
    /** @type {number} y - The Y coordinate. */
    y;
    /** @type {number} z - The Z coordinate. */
    z;

    /**
     * @param {number} x - The X coordinate.
     * @param {number} y - The Y coordinate.
     * @param {number} z - The Z coordinate.
     */
    constructor(x, y, z) { this.x = x; this.y = y; this.z = z; }

    /**
     * Convert the position to the chunk Coordinates containing it.
     * This is just a conversion of the x and y coordinates to an int.
     *
     * @returns {Coordinates} The chunk coordinates.
     */
    toChunk() { return new Coordinates(Math.floor(this.x), Math.floor(this.y)) }
}
