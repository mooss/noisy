import { createHexagonMesh, createSquareMesh, createSurfaceMesh } from '../mesh.js';
import { palettes } from '../palettes';

export class RenderConfig {
    constructor() {
        this.style = 'surface';              // How the terrain is rendered.
        this.paletteName = 'Bright terrain'; // Name of the color palette to use.
        this.light = {
            ambient: {intensity: .5},
            directional: {intensity: 4},
        }
    }

    ui(parent, update) {
        parent.select(this, 'style', {
            'Surface': 'surface',
            'Squares': 'quadPrism',
            'Hexagons': 'hexPrism',
        }).legend('Shape').onChange(update);

        parent.select(this, 'paletteName', palettes)
            .legend('Palette').onChange(update);

        parent.range(this.light.ambient, 'intensity', 0, 10, .2)
            .legend('Ambient Light').onChange(update);

        parent.range(this.light.directional, 'intensity', 0, 10, .2)
            .legend('Directional Light').onChange(update);
    }

    get palette() { return palettes[this.paletteName]; }
    mesh(heights) {
        switch (this.style) {
        case 'hexPrism':
            return createHexagonMesh(heights, this.palette);
        case 'quadPrism':
            return createSquareMesh(heights, this.palette);
        case 'surface':
            return createSurfaceMesh(heights, this.palette);
        }
        throw new Error(`Unknown render style ${style}`);
    }
}
