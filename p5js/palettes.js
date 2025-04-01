function rgb(r, g, b) { return new THREE.Color(r/255, g/255, b/255); };

export const terrainPalette = [
    rgb(100, 200, 50),  // Light green.
    rgb(100, 200, 50),  // Light green.
    rgb(75, 125, 25),   // Dark green.
    rgb(75, 125, 25),   // Dark green.
    rgb(100, 100, 100), // Grey.
    rgb(255, 255, 255), // White.
    rgb(255, 255, 255), // White.
];

// Interesting for the underside which can be used to seed continents.
export const continentalPalette = [
    rgb(100, 200, 50), // Land.
    rgb(100, 200, 50), // Land.
    rgb(50, 100, 200), // Sea.
    rgb(50, 100, 200), // Sea.
    rgb(100, 200, 50), // Land.
    rgb(100, 200, 50), // Land.
    rgb(100, 200, 50), // Land.
];

export const cyberPuke = [
    rgb(255, 0, 255), // Magenta.
    rgb(0, 255, 255), // Cyan.
];

export const palettes = [terrainPalette, continentalPalette, cyberPuke];
