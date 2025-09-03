import * as THREE from 'three';

export type Palette = THREE.Color[];

function rgb(r: number, g: number, b: number): THREE.Color {
    return new THREE.Color().setRGB(r/255, g/255, b/255, THREE.SRGBColorSpace);
}

const brightSea: Palette = [
    rgb(0, 50, 100),    // Deep water.
    rgb(0, 100, 150),   // Shallow water.
    rgb(0, 191, 255),   // Shore water.
];

const brightLow: Palette = [
    rgb(210, 180, 140), // Sand/beach.
    rgb(34, 139, 34),   // Grassland.
    rgb(0, 100, 0),     // Forest.
];

const brightHills: Palette = [
    rgb(100, 50, 0), // Low hills.
    rgb(50, 25, 0),  // Foothills.
];

const brightMountains: Palette = [
    rgb(139, 137, 137), // Rock/stone.
    rgb(255, 250, 250), // Snow.
];

const brightContinent: Palette = brightLow.concat(brightHills, brightMountains);

const brightTerrain: Palette = brightSea.concat(brightLow, brightMountains);

// Interesting for the underside which can be used to seed continents.
const tectonic: Palette = [
    rgb(100, 200, 50), // Land.
    rgb(100, 200, 50), // Land.
    rgb(50, 100, 200), // Sea.
    rgb(50, 100, 200), // Sea.
    rgb(100, 200, 50), // Land.
    rgb(100, 200, 50), // Land.
    rgb(100, 200, 50), // Land.
];

const cyberPuke: Palette = [
    rgb(255, 0, 255), // Magenta.
    rgb(0, 255, 255), // Cyan.
];

const blackWhite: Palette = [
    rgb(0, 0, 0),       // Black.
    rgb(255, 255, 255), // White.
];

const fantasy: Palette = [
    rgb(50, 50, 150),   // Deep magical water.
    rgb(100, 100, 200), // Enchanted shallow water.
    rgb(200, 150, 100), // Sunken ruins/ancient sands.
    rgb(0, 120, 0),     // Lush enchanted forests.
    rgb(150, 0, 150),   // Mystic bogs/cursed lands.
    rgb(100, 50, 0),    // Dragon's mountains/volcanic rock.
    rgb(255, 255, 255), // Cloud kingdom/celestial plains.
];

const sunset: Palette = [
    rgb(253, 94, 83),   // Coral.
    rgb(252, 186, 3),   // Gold.
    rgb(129, 3, 252),   // Purple.
    rgb(3, 248, 252)    // Teal.
];

const coffeeAndMilk: Palette = [
    rgb(76, 29, 13),    // Dark coffee.
    rgb(139, 69, 19),   // Coffee.
    rgb(160, 82, 45),   // Light coffee.
    rgb(222, 184, 135), // Milk.
    rgb(255, 255, 255), // Cream.
];

const rainbow: Palette = [
    rgb(255, 0, 0),     // Red.
    rgb(255, 165, 0),   // Orange.
    rgb(255, 255, 0),   // Yellow.
    rgb(0, 255, 0),     // Green.
    rgb(0, 0, 255),     // Blue.
    rgb(75, 0, 130),    // Indigo.
    rgb(238, 130, 238), // Violet.
];

export const palettes: Record<string, Palette> = {
    'Bright terrain': brightTerrain,
    'Bright continent': brightContinent,
    'Fantasy': fantasy,
    'Sunset': sunset,
    'Black & white': blackWhite,
    'Cyberpuke': cyberPuke,
    'Coffee & milk': coffeeAndMilk,
    'Rainbow': rainbow,
    // 'Tectonic': tectonic,
};
