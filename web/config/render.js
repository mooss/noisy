export class RenderConfig {
    constructor() {
        this.style = 'quadPrism';    // How the terrain is rendered (quadPrism, hexPrism, surface).
        this.palette = 0;            // Index of the color palette to use.
    }

    ui(parent, update) {
        parent.select(this, 'style', {
            'Squares': 'quadPrism',
            'Hexagons': 'hexPrism',
            'Surface': 'surface'
        }).legend('Shape').onChange(update);

        parent.select(this, 'palette', {
            'Bright terrain': 0,
            'Continental': 1,
            'Cyberpuke': 2,
            'Black & white': 3,
            'Fantasy': 4,
            'Sunset': 5
        }).legend('Palette').onChange(update);
    }
}
