import { NoiseFun } from "../../noise/foundations.js";
import { heightMatrix } from "./foundations.js";
import { ReusableArray, ReusableBuffer } from "./utils.js";

/**
 * Fills the position and normal buffers for a hexagon-based mesh.
 *
 * Each cell is rendered as a regular pointy top hexagon.
 *
 * @param positionCache - Cache for storing vertex positions.
 * @param normalCache   - Cache for storing vertex normals.
 * @param heightCache   - Cache for storing height values.
 * @param fun           - The noise function to sample height values from.
 * @param resolution    - The resolution of the chunk.
 */
export function fillHexData(
    positionCache: ReusableBuffer,
    normalCache: ReusableBuffer,
    heightCache: ReusableArray,
    fun: NoiseFun,
    resolution: number,
): void {
    // Height is sampled at the centre of each cell (i.e. shift by half a cell).
    const halfcell = .5 / resolution;
    const shiftedFun = (x: number, y: number) => fun(x + halfcell, y + halfcell);
    const heights = heightMatrix(
        heightCache,
        shiftedFun,
        resolution,
        { up: 0, down: 0, left: 0, right: 0 },
    );

    // Geometry constants for a pointy top regular hexagon with radius = 0.5.
    const R = 0.5;                      // Radius in world-units.
    const HEX_HEIGHT = 2 * R;           // = 1 world-unit.
    const HEX_WIDTH = Math.sqrt(3) * R; // ≈0.8660254 world-unit.
    const VSTEP = HEX_HEIGHT * 0.75;    // Vertical distance between rows (0.75 world-units).

    // Scale factors that convert world-units to cell-units.
    const X_SCALE = 1 / HEX_WIDTH;
    const Y_SCALE = 1 / VSTEP;

    // Each hexagon face is made of 4 triangles (12 vertices total).
    const verticesPerHex = 12;
    const stride = 3;
    const nvertices = resolution * resolution * verticesPerHex;
    const positions = positionCache.asFloat32(nvertices, stride);
    const normals = normalCache.asInt8(nvertices, stride);

    // Precompute the offsets of each vertex of the hexagon in cell-units.
    const angles = [0, 1, 2, 3, 4, 5].map(i => Math.PI / 3 * i + Math.PI / 6);
    const offs = angles.map(a => ({ x: Math.cos(a) * R * X_SCALE, y: Math.sin(a) * R * Y_SCALE }));

    let posIdx = 0;
    let norIdx = 0;
    for (let bx = 0; bx < resolution; ++bx) {
        for (let by = 0; by < resolution; ++by) {
            // Hexagon centre (in cell-units).
            const cx = bx + (by % 2) * .5;
            const cy = by;
            const cz = heights[bx * resolution + by];

            // Emit 4 triangles that cover the hexagon using only its outer vertices (triangle fan
            // using vertex 0 as the fan origin).
            for (let i = 0; i < 4; ++i) {
                const vB = offs[i + 1];
                const vC = offs[i + 2];

                // Vertex A (fan origin).
                positions[posIdx++] = cx + offs[0].x;
                positions[posIdx++] = cy + offs[0].y;
                positions[posIdx++] = cz;

                // Vertex B.
                positions[posIdx++] = cx + vB.x;
                positions[posIdx++] = cy + vB.y;
                positions[posIdx++] = cz;

                // Vertex C.
                positions[posIdx++] = cx + vC.x;
                positions[posIdx++] = cy + vC.y;
                positions[posIdx++] = cz;

                // Upward normals for everyone.
                normals[norIdx++] = 0; normals[norIdx++] = 0; normals[norIdx++] = 1;
                normals[norIdx++] = 0; normals[norIdx++] = 0; normals[norIdx++] = 1;
                normals[norIdx++] = 0; normals[norIdx++] = 0; normals[norIdx++] = 1;
            }
        }
    }
}
