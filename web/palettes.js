function rgb(r, g, b) { return new THREE.Color(r/255, g/255, b/255); };

const brightTerrainPalette = [
    rgb(0, 50, 100),    // Ocean (Deep water).
    rgb(0, 100, 150),   // Ocean (Shallow water).
    rgb(0, 191, 255),   // Ocean (Deep Sky Blue).
    rgb(210, 180, 140), // Continental (Sand/beach).
    rgb(34, 139, 34),   // Continental (Grassland).
    rgb(0, 100, 0),     // Continental (Forest).
    rgb(139, 137, 137), // Continental (Rock/stone).
    rgb(255, 250, 250), // Continental (Snow).
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

const fantasyPalette = [
    rgb(50, 50, 150),   // Deep magical water.
    rgb(100, 100, 200), // Enchanted shallow water.
    rgb(200, 150, 100), // Sunken ruins/ancient sands.
    rgb(0, 120, 0),     // Lush enchanted forests.
    rgb(150, 0, 150),   // Mystic bogs/cursed lands.
    rgb(100, 50, 0),    // Dragon's mountains/volcanic rock.
    rgb(255, 255, 255), // Cloud kingdom/celestial plains.
];

const sunsetPalette = [
    rgb(253, 94, 83),   // Coral.
    rgb(252, 186, 3),   // Gold.
    rgb(129, 3, 252),   // Purple.
    rgb(3, 248, 252)    // Teal.
];

export const palettes = {
    'Bright terrain': brightTerrainPalette,
    'Fantasy': fantasyPalette,
    'Sunset': sunsetPalette,
    'Black & white': blackWhite,
    'Cyberpuke': cyberPuke,
    'Continental': continentalPalette,
};
