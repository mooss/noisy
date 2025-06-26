import { createHexagonMesh, createSquareMesh, createSurfaceMesh } from '../mesh.js';
import { palettes } from '../palettes.js';

export class RenderConfig {
    constructor() {
        this.style = 'surface';              // How the terrain is rendered.
        this.paletteName = 'Bright terrain'; // Name of the color palette to use.
    }

    ui(parent, update) {
        parent.select(this, 'style', {
            'Surface': 'surface',
            'Squares': 'quadPrism',
            'Hexagons': 'hexPrism',
        }).legend('Shape').onChange(update);

        parent.select(this, 'paletteName', palettes)
            .legend('Palette').onChange(update);
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
