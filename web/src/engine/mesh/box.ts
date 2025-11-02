import { NoiseFun } from "../../noise/foundations.js";
import { heightMatrix } from "./foundations.js";
import { ReusableArray, ReusableBuffer } from "./utils.js";

/**
 * Fills the position and normal buffers for a box-based, voxel-like mesh.
 *
 * @param positionCache - Cache for storing vertex positions.
 * @param normalCache   - Cache for storing vertex normals.
 * @param heightCache   - Cache for storing height values.
 * @param fun           - The noise function to sample height values from.
 * @param resolution    - Number of cells in the grid.
 */
export function fillBoxData(
    positionCache: ReusableBuffer,
    normalCache: ReusableBuffer,
    heightCache: ReusableArray,
    fun: NoiseFun,
    resolution: number,
): void {
    // The mesh from one box requires only 3 faces:
    //  - F1, the top face (dcgh).
    //  - F2, the right face (efgc).
    //  - F3, the down face (abcd).
    //
    // It is necessary to get the heights from the adjacent boxes (the right and down boxes) for the
    // z value of a, b, e and f.
    //
    //        Top box
    //           v
    //        h------g
    //       /      /|
    //      /  F1  / |
    //     /      /  |
    //    /      /   |
    //   d------c    |
    //   |      | F3 f------*
    //   |  F2  |   /      /|
    //   a------b  /      / |
    //  /      /| /      /  ⋮
    // *------* |/      /
    // |      | e------*     < Right box
    // |      | |      |
    // ⋮      ⋮ |      |
    //     ^    ⋮      ⋮
    // Down box

    // The height of a box is the height in its center so the height function must be shifted by
    // half a cell.
    const halfcell = .5 / resolution;
    const shiftedFun = (x: number, y: number) => fun(x + halfcell, y + halfcell);

    // Since each block needs the heights of the neighboring down and right blocks,
    //  - Each block needs the heights of 3 blocks to construct all its faces.
    //    So it's pertinent to store a height matrix since computing heights can be somewhat
    //    expensive.
    //  - Some out-of-chunk heights are needed (in the right column and in the down row).
    //    Which means that the height matrix needs an additional row and column.
    const heights = heightMatrix(
        heightCache, shiftedFun, resolution,
        { up: 0, down: 1, left: 0, right: 1 },
    );
    const heightSide = resolution + 1;

    // Each block has 3 faces made of 2 triangles with 3 vertices each.
    // This means 18 vertices per box and 18 * nblocks vertices per side.
    const verticesPerBox = 18;
    const stride = 3; // Number of components of one vertex (xyz for both positions and normals).
    const nvertices = resolution * resolution * verticesPerBox;
    const positions = positionCache.asFloat32(nvertices, stride);
    const normals = normalCache.asInt8(nvertices, stride);

    let idver = 0, idnor = 0;
    for (let blockX = 0; blockX < resolution; ++blockX) {
        for (let blockY = 0; blockY < resolution; ++blockY) {
            const adhx = blockX;
            const bcefgx = blockX + 1;
            const abcdey = blockY;
            const fghy = blockY + 1;
            const topz = heights[blockX * heightSide + blockY + 1];
            const downz = heights[blockX * heightSide + blockY];
            const rightz = heights[(blockX + 1) * heightSide + blockY + 1];

            const position = (x: number, y: number, z: number) => {
                positions[idver++] = x; positions[idver++] = y; positions[idver++] = z;
            }
            const a = () => position(adhx, abcdey, downz);
            const b = () => position(bcefgx, abcdey, downz);
            const c = () => position(bcefgx, abcdey, topz);
            const d = () => position(adhx, abcdey, topz);
            const e = () => position(bcefgx, abcdey, rightz);
            const f = () => position(bcefgx, fghy, rightz);
            const g = () => position(bcefgx, fghy, topz);
            const h = () => position(adhx, fghy, topz);

            // Normals for a face (2 triangles * 3 vertices).
            const normal = (x: number, y: number, z: number) => {
                normals[idnor++] = x; normals[idnor++] = y; normals[idnor++] = z;
                normals[idnor++] = x; normals[idnor++] = y; normals[idnor++] = z;
                normals[idnor++] = x; normals[idnor++] = y; normals[idnor++] = z;
                normals[idnor++] = x; normals[idnor++] = y; normals[idnor++] = z;
                normals[idnor++] = x; normals[idnor++] = y; normals[idnor++] = z;
                normals[idnor++] = x; normals[idnor++] = y; normals[idnor++] = z;
            }
            // Normals are trivial to compute because everything is facing only one direction.
            const top = () => normal(0, 0, 1);
            const bottom = () => normal(0, 0, -1);
            const left = () => normal(-1, 0, 0);
            const right = () => normal(1, 0, 0);
            const up = () => normal(0, -1, 0);

            // Top face.
            c(); g(); h();
            c(); h(); d();
            top();

            // Right face.
            c(); e(); f();
            c(); f(); g();
            topz > rightz ? right() : left();

            // Down face.
            a(); b(); c();
            a(); c(); d();
            topz > downz ? bottom() : up();
        }
    }
}
