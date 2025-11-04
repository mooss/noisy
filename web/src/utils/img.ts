/**
 * Converts an RGB array to a PNG blob.
 *
 * @param data   - Array of RGB values in sequence (R, G, B for each pixel).
 * @param width  - Width of the resulting image in pixels.
 * @param height - Height of the resulting image in pixels.
 *
 * @returns a promise that resolves with a PNG Blob.
 * @throws an error on input data length mismatch or failure to get canvas context.
 */
export async function rgbArrayToPngBlob(
    data: Uint8ClampedArray,
    width: number,
    height: number
): Promise<Blob> {
    const nPixels = width * height;
    if (data.length !== nPixels * 3) {
        throw new Error(`RGB data length does not match the provided width and height (expected ${nPixels * 3} (${width}x${height}x3), got ${data.length})`);
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    const imageData = ctx.createImageData(width, height);
    const pixels = imageData.data;
    let datidx = 0;
    for (let i = 0; i < pixels.length; i += 4) {
        pixels[i] = data[datidx++];     // Red.
        pixels[i + 1] = data[datidx++]; // Green.
        pixels[i + 2] = data[datidx++]; // Blue.
        pixels[i + 3] = 255;            // Alpha (fully opaque).
    }

    ctx.putImageData(imageData, 0, 0);
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error('Failed to create PNG blob'));
                return;
            }
            resolve(blob);
        }, 'image/png');
    });
}
