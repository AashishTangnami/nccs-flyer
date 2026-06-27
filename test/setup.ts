import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

const objectUrlStore = new Map<string, Blob | MediaSource>();
let objectUrlCounter = 0;

Object.defineProperty(URL, "createObjectURL", {
  writable: true,
  value: vi.fn((object: Blob | MediaSource) => {
    objectUrlCounter += 1;
    const url = `blob:mock-${objectUrlCounter}`;
    objectUrlStore.set(url, object);
    return url;
  })
});

Object.defineProperty(URL, "revokeObjectURL", {
  writable: true,
  value: vi.fn((url: string) => {
    objectUrlStore.delete(url);
  })
});

Object.defineProperty(globalThis, "requestAnimationFrame", {
  writable: true,
  value: (callback: FrameRequestCallback) => window.setTimeout(() => callback(Date.now()), 0)
});

Object.defineProperty(window, "requestIdleCallback", {
  writable: true,
  value: (callback: IdleRequestCallback) =>
    window.setTimeout(
      () =>
        callback({
          didTimeout: false,
          timeRemaining: () => 50
        }),
      0
    )
});

Object.defineProperty(window, "cancelIdleCallback", {
  writable: true,
  value: (id: number) => window.clearTimeout(id)
});

Object.defineProperty(HTMLElement.prototype, "clientWidth", {
  configurable: true,
  get() {
    return 3240;
  }
});

Object.defineProperty(HTMLElement.prototype, "clientHeight", {
  configurable: true,
  get() {
    return 4320;
  }
});

class ResizeObserverMock {
  private callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe(target: Element) {
    this.callback(
      [
        {
          target,
          contentRect: target.getBoundingClientRect()
        } as ResizeObserverEntry
      ],
      this as ResizeObserver
    );
  }

  unobserve() {}

  disconnect() {}
}

Object.defineProperty(globalThis, "ResizeObserver", {
  writable: true,
  value: ResizeObserverMock
});

Object.defineProperty(globalThis, "createImageBitmap", {
  writable: true,
  value: vi.fn(async (file: Blob & { mockWidth?: number; mockHeight?: number }) => ({
    width: file.mockWidth ?? 2400,
    height: file.mockHeight ?? 1200,
    close: vi.fn()
  }))
});

const canvasContext = {
  beginPath: vi.fn(),
  clip: vi.fn(),
  drawImage: vi.fn(),
  ellipse: vi.fn(),
  fillText: vi.fn(),
  measureText: vi.fn((text: string) => ({ width: text.length * 20 })),
  rect: vi.fn(),
  restore: vi.fn(),
  save: vi.fn(),
  stroke: vi.fn(),
  set fillStyle(_value: string) {},
  set font(_value: string) {},
  set lineWidth(_value: number) {},
  set strokeStyle(_value: string | CanvasGradient | CanvasPattern) {},
  set textAlign(_value: CanvasTextAlign) {},
  set textBaseline(_value: CanvasTextBaseline) {}
};

Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
  writable: true,
  value: vi.fn(function getContext(this: HTMLCanvasElement) {
    Object.defineProperty(globalThis, "__lastCanvas", {
      configurable: true,
      value: this
    });
    return canvasContext;
  })
});

Object.defineProperty(HTMLCanvasElement.prototype, "toBlob", {
  writable: true,
  value: vi.fn(function toBlob(callback: BlobCallback) {
    callback(new Blob(["png"], { type: "image/png" }));
  })
});

Object.defineProperty(HTMLAnchorElement.prototype, "click", {
  writable: true,
  value: vi.fn()
});

Object.defineProperty(globalThis, "Image", {
  writable: true,
  value: class ImageMock {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    naturalWidth = 640;
    naturalHeight = 960;

    set src(_value: string) {
      window.setTimeout(() => this.onload?.(), 0);
    }
  }
});

afterEach(() => {
  cleanup();
  objectUrlStore.clear();
  vi.clearAllMocks();
});
