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
     * Generates a list of coordinates within a specified radius around this block.
     *
     * @param {number} radius - The radius (in chunks or blocks) around the center.
     * @returns {Array<Coordinates>} An array of chunk block coordinate objects.
     */
    within(radius, fun) {
        for (let x = this.x - radius; x <= this.x + radius; x++) {
            for (let y = this.y - radius; y <= this.y + radius; y++) {
                fun(new Coordinates(x, y));
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
