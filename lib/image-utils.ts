import type { Config } from "@imgly/background-removal";

type BackgroundRemovalModule = typeof import("@imgly/background-removal");
let backgroundRemovalModulePromise: Promise<BackgroundRemovalModule> | null = null;

export function preloadBackgroundRemoval(): Promise<BackgroundRemovalModule> {
  backgroundRemovalModulePromise ??= import("@imgly/background-removal");
  return backgroundRemovalModulePromise;
}

type WebGpuNavigator = Navigator & {
  gpu?: {
    requestAdapter: () => Promise<unknown>;
  };
};

export async function getBestDevice(): Promise<"gpu" | "cpu"> {
  try {
    const gpu = (navigator as WebGpuNavigator).gpu;

    if (!gpu) {
      return "cpu";
    }

    const adapter = await gpu.requestAdapter();
    return adapter ? "gpu" : "cpu";
  } catch {
    return "cpu";
  }
}

export async function resizeImage(file: File, maxSize = 1280): Promise<Blob> {
  const imageBitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(imageBitmap.width, imageBitmap.height));
  const width = Math.max(1, Math.round(imageBitmap.width * scale));
  const height = Math.max(1, Math.round(imageBitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", {
    alpha: true,
    willReadFrequently: false
  });

  if (!context) {
    imageBitmap.close();
    throw new Error("Canvas is not supported in this browser.");
  }

  context.drawImage(imageBitmap, 0, 0, width, height);
  imageBitmap.close();

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Could not resize the selected image."));
        }
      },
      "image/png",
      0.92
    );
  });
}

export async function removeImageBackground(input: Blob | File): Promise<Blob> {
  const { removeBackground } = await preloadBackgroundRemoval();
  const device = await getBestDevice();
  const config: Config = {
    device,
    output: {
      format: "image/png",
      quality: 1
    }
  };

  try {
    return await removeBackground(input, config);
  } catch (error) {
    if (device === "gpu") {
      return removeBackground(input, {
        ...config,
        device: "cpu"
      });
    }

    throw error;
  }
}

export function fitImageToSlot(
  imageWidth: number,
  imageHeight: number,
  slotWidth: number,
  slotHeight: number
): {
  drawWidth: number;
  drawHeight: number;
  offsetX: number;
  offsetY: number;
} {
  const scale = Math.min(slotWidth / imageWidth, slotHeight / imageHeight);
  const drawWidth = imageWidth * scale;
  const drawHeight = imageHeight * scale;

  return {
    drawWidth,
    drawHeight,
    offsetX: (slotWidth - drawWidth) / 2,
    offsetY: (slotHeight - drawHeight) / 2
  };
}
