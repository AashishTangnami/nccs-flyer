import { beforeEach, describe, expect, it, vi } from "vitest";

const removeBackground = vi.fn();

vi.mock("@imgly/background-removal", () => ({
  removeBackground
}));

async function loadImageUtils() {
  vi.resetModules();
  return import("./image-utils");
}

function setGpu(requestAdapter?: () => Promise<unknown>) {
  Object.defineProperty(navigator, "gpu", {
    configurable: true,
    value: requestAdapter ? { requestAdapter } : undefined
  });
}

describe("image-utils", () => {
  beforeEach(() => {
    removeBackground.mockReset();
    setGpu();
  });

  it("uses WebGPU when an adapter is available", async () => {
    setGpu(async () => ({}));
    const { getBestDevice } = await loadImageUtils();

    await expect(getBestDevice()).resolves.toBe("gpu");
  });

  it("falls back to CPU when WebGPU is missing, unavailable, or throws", async () => {
    let utils = await loadImageUtils();
    await expect(utils.getBestDevice()).resolves.toBe("cpu");

    setGpu(async () => null);
    utils = await loadImageUtils();
    await expect(utils.getBestDevice()).resolves.toBe("cpu");

    setGpu(async () => {
      throw new Error("blocked");
    });
    utils = await loadImageUtils();
    await expect(utils.getBestDevice()).resolves.toBe("cpu");
  });

  it("resizes large images while preserving aspect ratio", async () => {
    const { resizeImage } = await loadImageUtils();
    const file = new File(["image"], "large.png", { type: "image/png" }) as File & {
      mockWidth: number;
      mockHeight: number;
    };
    file.mockWidth = 4000;
    file.mockHeight = 2000;

    const blob = await resizeImage(file, 1000);
    const canvas = (globalThis as typeof globalThis & { __lastCanvas: HTMLCanvasElement })
      .__lastCanvas;

    expect(blob.type).toBe("image/png");
    expect(canvas.width).toBe(1000);
    expect(canvas.height).toBe(500);
    expect(createImageBitmap).toHaveBeenCalledWith(file);
  });

  it("calls background removal with GPU and retries CPU when GPU fails", async () => {
    setGpu(async () => ({}));
    const input = new Blob(["image"], { type: "image/png" });
    const output = new Blob(["transparent"], { type: "image/png" });
    removeBackground
      .mockRejectedValueOnce(new Error("gpu failed"))
      .mockResolvedValueOnce(output);

    const { removeImageBackground } = await loadImageUtils();

    await expect(removeImageBackground(input)).resolves.toBe(output);
    expect(removeBackground).toHaveBeenNthCalledWith(
      1,
      input,
      expect.objectContaining({ device: "gpu" })
    );
    expect(removeBackground).toHaveBeenNthCalledWith(
      2,
      input,
      expect.objectContaining({ device: "cpu" })
    );
  });

  it("fits an image inside a slot and centers it", async () => {
    const { fitImageToSlot } = await loadImageUtils();

    expect(fitImageToSlot(2000, 1000, 500, 500)).toEqual({
      drawWidth: 500,
      drawHeight: 250,
      offsetX: 0,
      offsetY: 125
    });
  });
});
