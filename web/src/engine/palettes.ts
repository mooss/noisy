import * as THREE from 'three';

export class Palette {
    constructor(public colors: THREE.Color[]) { }
    get size() { return this.colors.length }

    toArray(): Float32Array {
        const res = new Float32Array(4 * this.size);
        for (let i = 0; i < this.size; ++i) {
            const col = this.colors[i];
            const j = 4 * i;
            res[j] = col.r;
            res[j + 1] = col.g;
            res[j + 2] = col.b;
            res[j + 3] = 0;
        }

        return res;
    }

    cat(...other: Palette[]): Palette {
        const res = new Palette([...this.colors]);
        for (const pal of other) {
            res.colors.push(...pal.colors);
        }
        return res;
    }
}

function rgb(r: number, g: number, b: number): THREE.Color {
    return new THREE.Color().setRGB(r / 255, g / 255, b / 255, THREE.SRGBColorSpace);
}

const brightSea = new Palette([
    rgb(0, 50, 100),    // Deep water.
    rgb(0, 100, 150),   // Shallow water.
    rgb(0, 191, 255),   // Shore water.
]);

const brightLow = new Palette([
    rgb(210, 180, 140), // Sand/beach.
    rgb(34, 139, 34),   // Grassland.
    rgb(0, 100, 0),     // Forest.
]);

const brightHills = new Palette([
    rgb(100, 50, 0), // Low hills.
    rgb(50, 25, 0),  // Foothills.
]);

const brightMountains = new Palette([
    rgb(139, 137, 137), // Rock/stone.
    rgb(255, 250, 250), // Snow.
]);

const brightContinent: Palette = brightLow.cat(brightHills, brightMountains);
const brightTerrain: Palette = brightSea.cat(brightLow, brightMountains);
const paradise: Palette = brightSea.cat(brightLow, brightHills);

// Interesting for the underside which can be used to seed continents.
const tectonic = new Palette([
    rgb(100, 200, 50), // Land.
    rgb(100, 200, 50), // Land.
    rgb(50, 100, 200), // Sea.
    rgb(50, 100, 200), // Sea.
    rgb(100, 200, 50), // Land.
    rgb(100, 200, 50), // Land.
    rgb(100, 200, 50), // Land.
]);

const blackWhite = new Palette([
    rgb(0, 0, 0),       // Black.
    rgb(255, 255, 255), // White.
]);

const fantasy = new Palette([
    rgb(50, 50, 150),   // Deep magical water.
    rgb(100, 100, 200), // Enchanted shallow water.
    rgb(200, 150, 100), // Sunken ruins/ancient sands.
    rgb(0, 120, 0),     // Lush enchanted forests.
    rgb(150, 0, 150),   // Mystic bogs/cursed lands.
    rgb(100, 50, 0),    // Dragon's mountains/volcanic rock.
    rgb(255, 255, 255), // Cloud kingdom/celestial plains.
]);

const sunset = new Palette([
    rgb(253, 94, 83),   // Coral.
    rgb(252, 186, 3),   // Gold.
    rgb(129, 3, 252),   // Purple.
    rgb(3, 248, 252)    // Teal.
]);

const rainbow = new Palette([
    rgb(255, 0, 0),     // Red.
    rgb(255, 165, 0),   // Orange.
    rgb(255, 255, 0),   // Yellow.
    rgb(0, 255, 0),     // Green.
    rgb(0, 0, 255),     // Blue.
    rgb(75, 0, 130),    // Indigo.
    rgb(238, 130, 238), // Violet.
]);

const solarFlux = new Palette([
    rgb(255, 255, 180),
    rgb(255, 204, 0),
    rgb(255, 102, 0),
    rgb(255, 0, 85),
    rgb(125, 0, 255),
]);

const neonLight = new Palette([
    rgb(10, 10, 20),    // Near-black blue.
    rgb(0, 255, 180),   // Neon mint.
    rgb(255, 20, 147),  // Hot pink.
    rgb(255, 255, 255), // White glint.
]);

const alpineMeadow = new Palette([
    rgb(20, 60, 30),
    rgb(86, 176, 80),
    rgb(220, 120, 160),
    rgb(140, 140, 150),
    rgb(250, 250, 255),
]);

const orchidBloom = new Palette([
    rgb(100, 200, 50),
    rgb(90, 60, 40),
    rgb(220, 40, 140),
    rgb(135, 180, 220),
    rgb(235, 245, 245),
]);

const savanna = new Palette([
    rgb(208, 170, 60),
    rgb(60, 110, 40),
    rgb(110, 70, 30),
    rgb(40, 45, 80),
    rgb(245, 240, 210),
]);

const praclarush = new Palette([
    rgb(255, 220, 120),
    rgb(230, 80, 20),
    rgb(60, 20, 20),
    rgb(25, 25, 28),
    rgb(130, 130, 140),
]);

const glacier = new Palette([
    rgb(170, 220, 235),
    rgb(245, 250, 255),
    rgb(90, 80, 70),
    rgb(0, 120, 140),
    rgb(140, 150, 160),
]);

const camoWoodland = new Palette([
    rgb(107, 142, 35),
    rgb(34, 85, 34),
    rgb(101, 67, 33),
    rgb(160, 140, 90),
    rgb(15, 15, 15),
]);

const camoJungle = new Palette([
    rgb(16, 68, 32),
    rgb(54, 104, 32),
    rgb(84, 120, 60),
    rgb(90, 60, 40),
    rgb(55, 40, 30),
]);

export const palettes: Record<string, Palette> = {
    'Paradise': paradise,
    'Bright terrain': brightTerrain,
    'Bright continent': brightContinent,
    'Fantasy': fantasy,
    'Sunset': sunset,
    'Black & white': blackWhite,
    'Rainbow': rainbow,
    'Solar flux': solarFlux,
    'Neon light': neonLight,
    'Alpine meadow': alpineMeadow,
    'Orchid bloom': orchidBloom,
    'Savanna': savanna,
    'Praclarush': praclarush,
    'Glacier': glacier,
    'Woodland camo': camoWoodland,
    'Jungle camo': camoJungle,
    // 'Tectonic': tectonic,
};
