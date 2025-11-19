function facet(a: number[], b: number[], c: number[], normal: number[]): string {
    return `facet normal ${normal.join(' ')}
  outer loop
    vertex ${a.join(' ')}
    vertex ${b.join(' ')}
    vertex ${c.join(' ')}
  endloop
endfacet`
}

export function indexedToSTL(
    vertices: NumberArray,
    indices: NumberArray,
): string {
    const stl: string[] = ['solid model'];
    const writeFacet = (i0: number, i1: number, i2: number) => {
        const a = [vertices[i0 * 3], vertices[i0 * 3 + 1], vertices[i0 * 3 + 2]];
        const b = [vertices[i1 * 3], vertices[i1 * 3 + 1], vertices[i1 * 3 + 2]];
        const c = [vertices[i2 * 3], vertices[i2 * 3 + 1], vertices[i2 * 3 + 2]];

        const normal = [
            (b[1] - a[1]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[1] - a[1]),
            (b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2]),
            (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]),
        ];

        stl.push(facet(a, b, c, normal));
    };

    const idx = indices instanceof Uint16Array ? indices : new Uint16Array(indices);
    for (let i = 0; i < idx.length; i += 3) {
        writeFacet(idx[i], idx[i + 1], idx[i + 2]);
    }

    stl.push('endsolid model');
    return stl.join('\n');
}
