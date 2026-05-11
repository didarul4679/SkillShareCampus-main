export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Creates a cropped and compressed image from the given source
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: CropArea,
  maxWidth: number = 1200
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  // Calculate the scale factor if we need to resize
  const scale = pixelCrop.width > maxWidth ? maxWidth / pixelCrop.width : 1;
  
  canvas.width = pixelCrop.width * scale;
  canvas.height = pixelCrop.height * scale;

  // Draw the cropped image
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  // Return as JPEG blob with 85% quality for good balance of quality and size
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Canvas is empty"));
        }
      },
      "image/jpeg",
      0.85
    );
  });
}

/**
 * Helper function to create an image element from a source URL
 */
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.src = url;
  });
}

/**
 * Compresses an image file to fit within size limits
 */
export async function compressImage(
  file: File,
  maxSizeMB: number = 2,
  maxWidth: number = 1200
): Promise<File> {
  // If file is already small enough, return as-is
  if (file.size <= maxSizeMB * 1024 * 1024) {
    return file;
  }

  const imageSrc = await readFileAsDataURL(file);
  const image = await createImage(imageSrc);
  
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  // Calculate dimensions
  let width = image.width;
  let height = image.height;

  if (width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(image, 0, 0, width, height);

  // Try different quality levels until we get under the size limit
  let quality = 0.85;
  let blob: Blob | null = null;

  while (quality > 0.1) {
    blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/jpeg", quality);
    });

    if (blob && blob.size <= maxSizeMB * 1024 * 1024) {
      break;
    }

    quality -= 0.1;
  }

  if (!blob) {
    throw new Error("Failed to compress image");
  }

  return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
    type: "image/jpeg",
  });
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
