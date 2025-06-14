/////////////////////////
// Integer coordinates //

/**
 * Represents 2D integer coordinates for blocks, either within a chunk or in a global grid.
 */
export class BlockCoordinates {
    /** @type {number} x - The X coordinate. */
    x;
    /** @type {number} y - The Y coordinate. */
    y;

    /**
     * @param {number} x - The X coordinate.
     * @param {number} y - The Y coordinate.
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    /**
     * Convert in-place global block coordinates to the coordinates of the chunk containing them.
     *
     * @param {number} chunkSize - The size of a chunk.
     * @returns {BlockCoordinates} this.
     */
    asChunk(chunkSize) {
        this.x = Math.floor(this.x / chunkSize);
        this.y = Math.floor(this.y / chunkSize);
        return this;
    }

    /**
     * Convert in-place global block coordinates to local block coordinates within their chunk.
     *
     * @param {number} chunkSize - The size of a chunk.
     * @returns {BlockCoordinates} this.
     */
    asLocal(chunkSize) {
        this.x = ((this.x % chunkSize) + chunkSize) % chunkSize;
        this.y = ((this.y % chunkSize) + chunkSize) % chunkSize;
        return this;
    }

    /**
     * Convert in-place local block coordinates to global block coordinates given the coordinates
     * of their chunk.
     *
     * @param {BlockCoordinates} chunkCoords - The chunk block coordinates.
     * @param {number}           chunkSize   - The size of a chunk in world units.
     * @returns {BlockCoordinates} this.
     */
    asGlobal(chunkCoords, chunkSize) {
        this.x = chunkCoords.x * chunkSize + this.x;
        this.y = chunkCoords.y * chunkSize + this.y;
        return this;
    }

    /**
     * Creates WorldCoordinates from global block coordinates.
     * Their height is set at zero.
     *
     * @param {number} blockSize - The size of a single block.
     * @returns {WorldCoordinates} The world coordinates.
     */
    toWorld(blockSize) {
        return new WorldCoordinates(
            this.x * blockSize,
            this.y * blockSize,
            0
        );
    }

    /**
     * Generates a list of coordinates within a specified radius around this block.
     *
     * @param {number} radius - The radius (in chunks or blocks) around the center.
     * @returns {Array<BlockCoordinates>} An array of chunk block coordinate objects.
     */
    within(radius) {
        const chunkCoords = [];
        for (let x = this.x - radius; x <= this.x + radius; x++) {
            for (let y = this.y - radius; y <= this.y + radius; y++) {
                chunkCoords.push(new BlockCoordinates(x, y));
            }
        }
        return chunkCoords;
    }
}

/**
 * Represents 3D floating-point coordinates for points in the world, either local or global.
 */
export class WorldCoordinates {
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
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}
