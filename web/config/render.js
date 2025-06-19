import { palettes } from '../palettes.js';

export class RenderConfig {
    constructor() {
        this.style = 'quadPrism';        // How the terrain is rendered (quadPrism, hexPrism, surface).
        this.palette = 'Bright terrain'; // Name of the color palette to use.
    }

    ui(parent, update) {
        parent.select(this, 'style', {
            'Squares': 'quadPrism',
            'Hexagons': 'hexPrism',
            'Surface': 'surface'
        }).legend('Shape').onChange(update);

        parent.select(this, 'palette', palettes)
            .legend('Palette').onChange(update);
    }
}
