function rgb(r, g, b) { return new THREE.Color(r/255, g/255, b/255); };

const realisticTerrainPalette = [
    rgb(0, 50, 100),    // Deep water.
    rgb(0, 100, 150),   // Shallow water.
    rgb(210, 180, 140), // Sand/beach.
    rgb(34, 139, 34),   // Grassland.
    rgb(0, 100, 0),     // Forest.
    rgb(139, 137, 137), // Rock/stone.
    rgb(255, 250, 250), // Snow.
];

// Interesting for the underside which can be used to seed continents.
const continentalPalette = [
    rgb(100, 200, 50), // Land.
    rgb(100, 200, 50), // Land.
    rgb(50, 100, 200), // Sea.
    rgb(50, 100, 200), // Sea.
    rgb(100, 200, 50), // Land.
    rgb(100, 200, 50), // Land.
    rgb(100, 200, 50), // Land.
];

const cyberPuke = [
    rgb(255, 0, 255), // Magenta.
    rgb(0, 255, 255), // Cyan.
];

const blackWhite = [
    rgb(0, 0, 0),       // Black.
    rgb(255, 255, 255), // White.
];

export const palettes = [realisticTerrainPalette, continentalPalette, cyberPuke, blackWhite];
