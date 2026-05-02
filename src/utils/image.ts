/**
 * Preprocesses an image for AI analysis and storage.
 * Resizes the image to max 1024px on the longer side and re-encodes as JPEG quality 0.85.
 */
export async function preprocessImage(file: File): Promise<Blob> {
  // Use createImageBitmap with orientation support if available
  const bitmap = await createImageBitmap(file, {
    imageOrientation: 'from-image',
  });

  const maxDim = 1024;
  let { width, height } = bitmap;

  if (width > maxDim || height > maxDim) {
    const ratio = width / height;
    if (width > height) {
      width = maxDim;
      height = Math.round(maxDim / ratio);
    } else {
      height = maxDim;
      width = Math.round(maxDim * ratio);
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas toBlob failed'));
        }
      },
      'image/jpeg',
      0.85
    );
  });
}
