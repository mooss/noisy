function crossProduct(v1: number[], v2: number[]): number[] {
    return [
        v1[1] * v2[2] - v1[2] * v2[1],
        v1[2] * v2[0] - v1[0] * v2[2],
        v1[0] * v2[1] - v1[1] * v2[0],
    ];
}

function facet(a: number[], b: number[], c: number[], normal: number[]): string {
    return `facet normal ${normal.join(' ')}
  outer loop
    vertex ${a.join(' ')}
    vertex ${b.join(' ')}
    vertex ${c.join(' ')}
  endloop
endfacet`
}

/**
 * Converts a flat array of triangle vertices into an ASCII STL string.
 * The input array is expected to contain 9 values per triangle (3 vertices × 3 coordinates in the
 * order x, y, z).
 * Face normals are computed automatically via cross-product.
 *
 * @param vertices - Flat array of vertex coordinates.
 * @returns the complete ASCII STL representation of the mesh.
 */
export function verticesToSTL(vertices: NumberArray): string {
    const stl: string[] = ['solid model'];

    for (let i = 0; i < vertices.length; i += 9) {
        const a = [vertices[i], vertices[i + 1], vertices[i + 2]];
        const b = [vertices[i + 3], vertices[i + 4], vertices[i + 5]];
        const c = [vertices[i + 6], vertices[i + 7], vertices[i + 8]];

        const ba = [b[0]-a[0], b[1]-a[1], b[2]-a[2]];
        const ca = [c[0]-a[0], c[1]-a[1], c[2]-a[2]];
        const normal = crossProduct(ba, ca);

        stl.push(facet(a, b, c, normal));
    }

    stl.push('endsolid model');
    return stl.join('\n');
}
