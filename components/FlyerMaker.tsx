"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toBlob } from "html-to-image";
import { flyerTemplates } from "@/lib/flyer-templates";
import type { FlyerTemplate, ProcessingStatus, TextAlign } from "@/lib/types";
import {
  preloadBackgroundRemoval,
  removeImageBackground,
  resizeImage
} from "@/lib/image-utils";

type PhotoAdjustment = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type ImageDimensions = {
  width: number;
  height: number;
};

type PhotoCrop = {
  zoom: number;
  offsetX: number;
  offsetY: number;
};

type TextAdjustment = {
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: string | number;
  fontStyle: "normal" | "italic";
  color: string;
  textAlign: TextAlign;
};

type ResizeDirection =
  | "north"
  | "south"
  | "east"
  | "west"
  | "north-east"
  | "north-west"
  | "south-east"
  | "south-west";

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const fontOptions = [
  {
    label: "Noto Sans",
    value: '"Noto Sans", "Noto Sans Devanagari", system-ui, sans-serif'
  },
  {
    label: "System Sans",
    value: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  },
  {
    label: "Serif",
    value: 'Georgia, "Times New Roman", serif'
  },
  {
    label: "Condensed",
    value: '"Arial Narrow", "Roboto Condensed", sans-serif'
  },
  {
    label: "Monospace",
    value: '"Courier New", monospace'
  }
];

const defaultPreviewFontFamily =
  '"Noto Sans", "Noto Sans Devanagari", system-ui, sans-serif';
const defaultPhotoPlacement: PhotoAdjustment = {
  left: 1913.853607,
  top: 2501.465164,
  width: 1286.042459,
  height: 1714.104918
};
const defaultPhotoCrop: PhotoCrop = { zoom: 1, offsetX: 0, offsetY: 0 };
const minPhotoZoom = 1;
const maxPhotoZoom = 3;

function isBestWishesBlueTemplate(template: FlyerTemplate): boolean {
  return template.backgroundImage === "/flyers-backgrounds/best wishes hm blue2.png";
}

function getPhotoPlacementForTemplate(template: FlyerTemplate): PhotoAdjustment {
  if (isBestWishesBlueTemplate(template)) {
    return {
      left: 1138.67538,
      top: 1550.934209,
      width: 965.21669,
      height: 989.463488
    };
  }

  return defaultPhotoPlacement;
}

function getCircularPhotoLayout(
  frame: PhotoAdjustment,
  dimensions: ImageDimensions,
  crop: PhotoCrop
) {
  const coverScale = Math.max(frame.width / dimensions.width, frame.height / dimensions.height);
  const width = dimensions.width * coverScale * crop.zoom;
  const height = dimensions.height * coverScale * crop.zoom;
  const maxOffsetX = Math.max(0, (width - frame.width) / 2);
  const maxOffsetY = Math.max(0, (height - frame.height) / 2);
  const offsetX = Math.max(-maxOffsetX, Math.min(maxOffsetX, crop.offsetX));
  const offsetY = Math.max(-maxOffsetY, Math.min(maxOffsetY, crop.offsetY));

  return {
    width,
    height,
    left: (frame.width - width) / 2 + offsetX,
    top: (frame.height - height) / 2 + offsetY,
    crop: { ...crop, offsetX, offsetY }
  };
}

const resizeDirections: ResizeDirection[] = [
  "north-west",
  "north",
  "north-east",
  "east",
  "south-east",
  "south",
  "south-west",
  "west"
];

const statusMessage: Record<ProcessingStatus, string> = {
  idle: "Upload a photo to get started.",
  preparing: "Preparing image...",
  removing: "Removing background...",
  composing: "Applying to flyer...",
  done: "Done",
  error: "Something went wrong."
};

function buildDefaultTextValues(template: FlyerTemplate): Record<string, string> {
  return Object.fromEntries(
    template.textFields.map((field) => [field.id, field.defaultValue ?? ""])
  );
}

function revokeObjectUrl(url: string | null) {
  if (url) {
    URL.revokeObjectURL(url);
  }
}

function loadImageDimensions(src: string): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => reject(new Error("Could not read the processed image dimensions."));
    image.src = src;
  });
}

function loadDrawableImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load image: ${src}`));
    image.src = src;
  });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = filename;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}

function getResizeCursor(direction: ResizeDirection) {
  if (direction === "north" || direction === "south") {
    return "ns-resize";
  }

  if (direction === "east" || direction === "west") {
    return "ew-resize";
  }

  if (direction === "north-east" || direction === "south-west") {
    return "nesw-resize";
  }

  return "nwse-resize";
}

function getResizeHandleStyle(
  direction: ResizeDirection,
  handleSize: number,
  target?: PhotoAdjustment | TextAdjustment
): React.CSSProperties {
  const inset = -handleSize / 2;
  const centerOffset = target ? (target.width - handleSize) / 2 : `calc(50% - ${handleSize / 2}px)`;
  const middleOffset = target ? (target.height - handleSize) / 2 : `calc(50% - ${handleSize / 2}px)`;

  const style: React.CSSProperties = {
    width: handleSize,
    height: handleSize,
    boxSizing: "border-box",
    cursor: getResizeCursor(direction)
  };

  if (direction.includes("north")) {
    style.top = inset;
  } else if (direction.includes("south")) {
    style.bottom = inset;
  } else {
    style.top = middleOffset;
  }

  if (direction.includes("west")) {
    style.left = inset;
  } else if (direction.includes("east")) {
    style.right = inset;
  } else {
    style.left = centerOffset;
  }

  return style;
}

function resizeRectFromDirection<T extends PhotoAdjustment | TextAdjustment>(
  rect: T,
  direction: ResizeDirection,
  deltaX: number,
  deltaY: number,
  minWidth: number,
  minHeight: number
): T {
  let nextLeft = "left" in rect ? rect.left : rect.x;
  let nextTop = "top" in rect ? rect.top : rect.y;
  let nextWidth = rect.width;
  let nextHeight = rect.height;

  if (direction.includes("east")) {
    nextWidth = Math.max(minWidth, rect.width + deltaX);
  }

  if (direction.includes("south")) {
    nextHeight = Math.max(minHeight, rect.height + deltaY);
  }

  if (direction.includes("west")) {
    const proposedWidth = rect.width - deltaX;
    nextWidth = Math.max(minWidth, proposedWidth);
    nextLeft += rect.width - nextWidth;
  }

  if (direction.includes("north")) {
    const proposedHeight = rect.height - deltaY;
    nextHeight = Math.max(minHeight, proposedHeight);
    nextTop += rect.height - nextHeight;
  }

  if ("left" in rect) {
    return {
      ...rect,
      left: nextLeft,
      top: nextTop,
      width: nextWidth,
      height: nextHeight
    };
  }

  return {
    ...rect,
    x: nextLeft,
    y: nextTop,
    width: nextWidth,
    height: nextHeight
  };
}

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Could not create PNG from flyer canvas."));
        return;
      }

      resolve(blob);
    }, "image/png");
  });
}

function wrapCanvasText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const lines: string[] = [];
  const paragraphs = text.split(/\r?\n/);

  paragraphs.forEach((paragraph, paragraphIndex) => {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    const tokens = words.length > 0 ? words : [paragraph];
    let line = "";

    tokens.forEach((token) => {
      const nextLine = line ? `${line} ${token}` : token;

      if (context.measureText(nextLine).width <= maxWidth) {
        line = nextLine;
        return;
      }

      if (line) {
        lines.push(line);
        line = "";
      }

      let chunk = "";
      Array.from(token).forEach((char) => {
        const nextChunk = `${chunk}${char}`;
        if (context.measureText(nextChunk).width <= maxWidth || !chunk) {
          chunk = nextChunk;
        } else {
          lines.push(chunk);
          chunk = char;
        }
      });
      line = chunk;
    });

    if (line || paragraph.length === 0) {
      lines.push(line);
    }

    if (paragraphIndex < paragraphs.length - 1) {
      lines.push("");
    }
  });

  return lines;
}

export default function FlyerMaker() {
  const [selectedTemplateId, setSelectedTemplateId] = useState(flyerTemplates[0].id);
  const selectedTemplate = useMemo(
    () => flyerTemplates.find((template) => template.id === selectedTemplateId) ?? flyerTemplates[0],
    [selectedTemplateId]
  );
  const selectedTemplateIndex = useMemo(
    () =>
      Math.max(
        0,
        flyerTemplates.findIndex((template) => template.id === selectedTemplate.id)
      ),
    [selectedTemplate.id]
  );

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState<string | null>(null);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [processedDimensions, setProcessedDimensions] = useState<ImageDimensions | null>(null);
  const [isUsingDirectUpload, setIsUsingDirectUpload] = useState(false);
  const [textValues, setTextValues] = useState<Record<string, string>>(() =>
    buildDefaultTextValues(selectedTemplate)
  );
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [photoAdjustment, setPhotoAdjustment] = useState<PhotoAdjustment>(() =>
    getPhotoPlacementForTemplate(selectedTemplate)
  );
  const [photoCrop, setPhotoCrop] = useState<PhotoCrop>(defaultPhotoCrop);
  const [textAdjustments, setTextAdjustments] = useState<Record<string, TextAdjustment>>({});
  const [deletedTextFieldIds, setDeletedTextFieldIds] = useState<string[]>([]);
  const [selectedTextFieldId, setSelectedTextFieldId] = useState<string | null>(null);
  const [previewScale, setPreviewScale] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  const previewRef = useRef<HTMLDivElement | null>(null);
  const previewShellRef = useRef<HTMLDivElement | null>(null);
  const originalUrlRef = useRef<string | null>(null);
  const processedUrlRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const photoProcessingIdRef = useRef(0);

  useEffect(() => {
    setTextValues((current) => ({
      ...buildDefaultTextValues(selectedTemplate),
      ...Object.fromEntries(
        selectedTemplate.textFields
          .filter((field) => Object.prototype.hasOwnProperty.call(current, field.id))
          .map((field) => [field.id, current[field.id]])
      )
    }));
    setPhotoAdjustment(getPhotoPlacementForTemplate(selectedTemplate));
    setPhotoCrop(defaultPhotoCrop);
    setTextAdjustments({});
    setDeletedTextFieldIds([]);
    setSelectedTextFieldId(null);
  }, [selectedTemplate]);

  useEffect(() => {
    return () => {
      revokeObjectUrl(originalUrlRef.current);
      revokeObjectUrl(processedUrlRef.current);
    };
  }, []);

  useEffect(() => {
    const preload = () => {
      void preloadBackgroundRemoval().catch(() => undefined);
    };

    if (typeof window.requestIdleCallback === "function") {
      const idleId = window.requestIdleCallback(preload, { timeout: 4000 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = globalThis.setTimeout(preload, 1800);
    return () => globalThis.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    const shell = previewShellRef.current;

    if (!shell) {
      return;
    }

    const updateScale = () => {
      const widthScale = shell.clientWidth / selectedTemplate.width;
      const heightScale =
        shell.clientHeight > 0 ? shell.clientHeight / selectedTemplate.height : widthScale;
      setPreviewScale(Math.min(1, widthScale, heightScale));
    };

    updateScale();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateScale);
      return () => window.removeEventListener("resize", updateScale);
    }

    const resizeObserver = new ResizeObserver(updateScale);
    resizeObserver.observe(shell);

    return () => resizeObserver.disconnect();
  }, [selectedTemplate.height, selectedTemplate.width]);

  const setOriginalUrl = useCallback((url: string | null) => {
    revokeObjectUrl(originalUrlRef.current);
    originalUrlRef.current = url;
    setOriginalPreviewUrl(url);
  }, []);

  const setProcessedUrl = useCallback((url: string | null) => {
    revokeObjectUrl(processedUrlRef.current);
    processedUrlRef.current = url;
    setProcessedImageUrl(url);
  }, []);

  const processPhotoBackground = useCallback(
    async (file: File, processingId?: number) => {
      const activeProcessingId = processingId ?? ++photoProcessingIdRef.current;

      try {
        setError(null);
        setStatus("preparing");
        const resizedBlob = await resizeImage(file);

        if (photoProcessingIdRef.current !== activeProcessingId) {
          return;
        }

        setStatus("removing");
        const transparentBlob = await removeImageBackground(resizedBlob);

        if (photoProcessingIdRef.current !== activeProcessingId) {
          return;
        }

        setStatus("composing");
        const nextUrl = URL.createObjectURL(transparentBlob);
        const dimensions = await loadImageDimensions(nextUrl);

        if (photoProcessingIdRef.current !== activeProcessingId) {
          revokeObjectUrl(nextUrl);
          return;
        }

        setProcessedUrl(nextUrl);
        setProcessedDimensions(dimensions);
        setIsUsingDirectUpload(false);
        setStatus("done");
      } catch (processingError) {
        if (photoProcessingIdRef.current !== activeProcessingId) {
          return;
        }

        setStatus("error");
        setError(
          processingError instanceof Error
            ? processingError.message
            : "Background removal failed. Try a smaller or clearer image."
        );
      }
    },
    [setProcessedUrl]
  );

  useEffect(() => {
    if (!uploadedFile || !originalPreviewUrl) {
      return;
    }

    const isBlue = isBestWishesBlueTemplate(selectedTemplate);
    if (isBlue && !isUsingDirectUpload) {
      const processingId = ++photoProcessingIdRef.current;
      const directUploadUrl = URL.createObjectURL(uploadedFile);
      setProcessedUrl(directUploadUrl);
      setIsUsingDirectUpload(true);
      setStatus("done");
      void loadImageDimensions(directUploadUrl).then((dimensions) => {
        if (photoProcessingIdRef.current === processingId) {
          setProcessedDimensions(dimensions);
        }
      }).catch(() => {
        if (photoProcessingIdRef.current === processingId) {
          setError("Could not load the uploaded image.");
          setStatus("error");
        }
      });
      return;
    }

    if (!isBlue && isUsingDirectUpload) {
      const file = uploadedFile;
      const processingId = ++photoProcessingIdRef.current;
      setIsUsingDirectUpload(false);
      setProcessedUrl(null);
      setProcessedDimensions(null);
      setStatus("preparing");
      void processPhotoBackground(file, processingId);
    }
  }, [
    selectedTemplate,
    uploadedFile,
    originalPreviewUrl,
    isUsingDirectUpload,
    processPhotoBackground,
    setProcessedUrl
  ]);

  const handleFile = useCallback(
    (file: File | null) => {
      if (!file) {
        return;
      }

      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        photoProcessingIdRef.current += 1;
        setError("Please upload a JPG, PNG, or WebP image.");
        setStatus("error");
        return;
      }

      setUploadedFile(file);
      setOriginalUrl(URL.createObjectURL(file));
      setProcessedDimensions(null);
      setIsUsingDirectUpload(false);
      setPhotoAdjustment(getPhotoPlacementForTemplate(selectedTemplate));
      setPhotoCrop(defaultPhotoCrop);
      setError(null);

      const processingId = photoProcessingIdRef.current + 1;
      photoProcessingIdRef.current = processingId;

      if (isBestWishesBlueTemplate(selectedTemplate)) {
        const displayUrl = URL.createObjectURL(file);
        setProcessedUrl(displayUrl);
        setIsUsingDirectUpload(true);
        setStatus("done");

        window.requestAnimationFrame(async () => {
          if (photoProcessingIdRef.current !== processingId) {
            revokeObjectUrl(displayUrl);
            return;
          }

          try {
            const dimensions = await loadImageDimensions(displayUrl);

            if (photoProcessingIdRef.current !== processingId) {
              revokeObjectUrl(displayUrl);
              return;
            }

            setProcessedDimensions(dimensions);
          } catch (error) {
            revokeObjectUrl(displayUrl);
            setProcessedUrl(null);
            setProcessedDimensions(null);
            setError("Could not load the uploaded image.");
            setStatus("error");
          }
        });

        return;
      }

      setProcessedUrl(null);
      window.requestAnimationFrame(() => {
        if (photoProcessingIdRef.current !== processingId) {
          return;
        }

        void processPhotoBackground(file, processingId);
      });
    },
    [processPhotoBackground, selectedTemplate, setOriginalUrl, setProcessedUrl]
  );

  const handleRemoveBackground = async () => {
    if (!uploadedFile) {
      setError("Upload a photo before removing the background.");
      setStatus("error");
      return;
    }

    if (status === "preparing" || status === "removing" || status === "composing") {
      return;
    }

    await processPhotoBackground(uploadedFile);
  };

  const createFlyerBlob = async () => {
    if (!previewRef.current) {
      throw new Error("The flyer preview is not ready yet.");
    }

    await new Promise((resolve) => requestAnimationFrame(resolve));
    const blob = await toBlob(previewRef.current, {
      cacheBust: true,
      pixelRatio: 1,
      canvasWidth: selectedTemplate.width,
      canvasHeight: selectedTemplate.height
    });

    if (!blob) {
      throw new Error("Could not create PNG from flyer preview.");
    }

    return blob;
  };

  const handleDownload = async () => {
    try {
      setError(null);
      setIsExporting(true);
      const blob = await createFlyerBlob();
      downloadBlob(blob, `flyer-${selectedTemplate.id}.png`);
    } catch (domExportError) {
      try {
        const blob = await exportWithCanvas();
        downloadBlob(blob, `flyer-${selectedTemplate.id}.png`);
      } catch (canvasExportError) {
        console.error("Flyer export failed", {
          domExportError,
          canvasExportError
        });
        setError("Could not export the flyer. Please try again.");
        setStatus("error");
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleReset = () => {
    photoProcessingIdRef.current += 1;
    setUploadedFile(null);
    setOriginalUrl(null);
    setProcessedUrl(null);
    setProcessedDimensions(null);
    setIsUsingDirectUpload(false);
    setTextValues(buildDefaultTextValues(selectedTemplate));
    setPhotoAdjustment(getPhotoPlacementForTemplate(selectedTemplate));
    setPhotoCrop(defaultPhotoCrop);
    setTextAdjustments({});
    setDeletedTextFieldIds([]);
    setSelectedTextFieldId(null);
    setError(null);
    setStatus("idle");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemovePhoto = () => {
    photoProcessingIdRef.current += 1;
    setUploadedFile(null);
    setOriginalUrl(null);
    setProcessedUrl(null);
    setProcessedDimensions(null);
    setIsUsingDirectUpload(false);
    setPhotoAdjustment(getPhotoPlacementForTemplate(selectedTemplate));
    setPhotoCrop(defaultPhotoCrop);
    setError(null);
    setStatus("idle");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePreviousTemplate = () => {
    const previousIndex =
      (selectedTemplateIndex - 1 + flyerTemplates.length) % flyerTemplates.length;
    setSelectedTemplateId(flyerTemplates[previousIndex].id);
  };

  const handleNextTemplate = () => {
    const nextIndex = (selectedTemplateIndex + 1) % flyerTemplates.length;
    setSelectedTemplateId(flyerTemplates[nextIndex].id);
  };

  const isProcessing = status === "preparing" || status === "removing" || status === "composing";
  const showRemoveBackgroundAction = !processedImageUrl;
  const flyerPhotoUrl = processedImageUrl;
  const displayedPhoto = flyerPhotoUrl ? photoAdjustment : null;
  const canvasHandleSize = 10 / Math.max(previewScale, 0.01);
  const canvasHandleBorder = 1 / Math.max(previewScale, 0.01);
  const canvasRingWidth = 2 / Math.max(previewScale, 0.01);
  const shouldUseCircularPhotoLayout = isBestWishesBlueTemplate(selectedTemplate);
  const photoOutlineStyle = shouldUseCircularPhotoLayout
    ? "15.737705px solid rgba(56, 189, 248, 0.7)"
    : `${canvasRingWidth}px solid rgb(56 189 248 / 0.7)`;
  const circularPhotoLayout =
    shouldUseCircularPhotoLayout && displayedPhoto && processedDimensions
      ? getCircularPhotoLayout(displayedPhoto, processedDimensions, photoCrop)
      : null;

  const getTextLayout = (field: FlyerTemplate["textFields"][number]): TextAdjustment =>
    textAdjustments[field.id] ?? {
      x: field.x,
      y: field.y,
      width: field.width,
      height: field.height,
      fontSize: field.fontSize,
      fontFamily: defaultPreviewFontFamily,
      fontWeight: field.fontWeight ?? 400,
      fontStyle: "normal",
      color: field.color,
      textAlign: field.textAlign ?? "left"
    };

  const selectedTextField = selectedTextFieldId
    ? selectedTemplate.textFields.find((field) => field.id === selectedTextFieldId) ?? null
    : null;
  const selectedTextLayout = selectedTextField ? getTextLayout(selectedTextField) : null;
  const selectedTextValue = selectedTextField ? textValues[selectedTextField.id] ?? "" : "";

  const updateSelectedTextLayout = (changes: Partial<TextAdjustment>) => {
    if (!selectedTextField) {
      return;
    }

    setTextAdjustments((current) => ({
      ...current,
      [selectedTextField.id]: {
        ...getTextLayout(selectedTextField),
        ...changes
      }
    }));
  };

  const updateSelectedTextValue = (value: string) => {
    if (!selectedTextField) {
      return;
    }

    setDeletedTextFieldIds((current) => current.filter((id) => id !== selectedTextField.id));
    setTextValues((current) => ({
      ...current,
      [selectedTextField.id]: value
    }));
  };

  const deleteSelectedTextValue = () => {
    if (!selectedTextField) {
      return;
    }

    const fieldId = selectedTextField.id;
    setDeletedTextFieldIds((current) =>
      current.includes(fieldId) ? current : [...current, fieldId]
    );
    setTextValues((current) => ({
      ...current,
      [fieldId]: ""
    }));
    setSelectedTextFieldId(null);
  };

  const startPhotoMove = (event: React.PointerEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const startX = event.clientX;
    const startY = event.clientY;
    const startPhoto = photoAdjustment;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      setPhotoAdjustment({
        ...startPhoto,
        left: startPhoto.left + (moveEvent.clientX - startX) / previewScale,
        top: startPhoto.top + (moveEvent.clientY - startY) / previewScale
      });
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  const updatePhotoZoom = (zoom: number) => {
    const nextZoom = Math.max(minPhotoZoom, Math.min(maxPhotoZoom, zoom));

    setPhotoCrop((current) => {
      const nextCrop = { ...current, zoom: nextZoom };
      return displayedPhoto && processedDimensions
        ? getCircularPhotoLayout(displayedPhoto, processedDimensions, nextCrop).crop
        : nextCrop;
    });
  };

  const startCircularPhotoPan = (event: React.PointerEvent<HTMLElement>) => {
    if (!displayedPhoto || !processedDimensions) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const startX = event.clientX;
    const startY = event.clientY;
    const startCrop = getCircularPhotoLayout(
      displayedPhoto,
      processedDimensions,
      photoCrop
    ).crop;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const nextCrop = {
        ...startCrop,
        offsetX: startCrop.offsetX + (moveEvent.clientX - startX) / previewScale,
        offsetY: startCrop.offsetY + (moveEvent.clientY - startY) / previewScale
      };
      setPhotoCrop(
        getCircularPhotoLayout(displayedPhoto, processedDimensions, nextCrop).crop
      );
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  const startPhotoResize = (
    event: React.PointerEvent<HTMLButtonElement>,
    direction: ResizeDirection
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const startX = event.clientX;
    const startY = event.clientY;
    const startPhoto = photoAdjustment;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      setPhotoAdjustment(
        resizeRectFromDirection(
          startPhoto,
          direction,
          (moveEvent.clientX - startX) / previewScale,
          (moveEvent.clientY - startY) / previewScale,
          120,
          120
        )
      );
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  const startTextMove = (
    event: React.PointerEvent<HTMLDivElement>,
    field: FlyerTemplate["textFields"][number]
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setSelectedTextFieldId(field.id);

    const startX = event.clientX;
    const startY = event.clientY;
    const startLayout = getTextLayout(field);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      setTextAdjustments((current) => ({
        ...current,
        [field.id]: {
          ...startLayout,
          x: startLayout.x + (moveEvent.clientX - startX) / previewScale,
          y: startLayout.y + (moveEvent.clientY - startY) / previewScale
        }
      }));
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  const startTextResize = (
    event: React.PointerEvent<HTMLButtonElement>,
    field: FlyerTemplate["textFields"][number],
    direction: ResizeDirection
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setSelectedTextFieldId(field.id);

    const startX = event.clientX;
    const startY = event.clientY;
    const startLayout = getTextLayout(field);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = (moveEvent.clientX - startX) / previewScale;
      const deltaY = (moveEvent.clientY - startY) / previewScale;
      const nextLayout = resizeRectFromDirection(startLayout, direction, deltaX, deltaY, 160, 70);
      const widthDelta = nextLayout.width - startLayout.width;
      const heightDelta = nextLayout.height - startLayout.height;
      const sizeDelta = Math.max(widthDelta, heightDelta);

      setTextAdjustments((current) => ({
        ...current,
        [field.id]: {
          ...nextLayout,
          fontSize: Math.max(24, Math.min(180, startLayout.fontSize + sizeDelta / 12))
        }
      }));
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  const exportWithCanvas = async (): Promise<Blob> => {
    const canvas = document.createElement("canvas");
    canvas.width = selectedTemplate.width;
    canvas.height = selectedTemplate.height;

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Canvas export is not supported in this browser.");
    }

    const backgroundImage = await loadDrawableImage(selectedTemplate.backgroundImage);
    context.drawImage(backgroundImage, 0, 0, selectedTemplate.width, selectedTemplate.height);

    if (flyerPhotoUrl && displayedPhoto) {
      const processedImage = await loadDrawableImage(flyerPhotoUrl);

      if (shouldUseCircularPhotoLayout) {
        context.save();
        context.beginPath();
        context.ellipse(
          displayedPhoto.left + displayedPhoto.width / 2,
          displayedPhoto.top + displayedPhoto.height / 2,
          displayedPhoto.width / 2,
          displayedPhoto.height / 2,
          0,
          0,
          Math.PI * 2
        );
        context.clip();
      }

      if (shouldUseCircularPhotoLayout && circularPhotoLayout) {
        context.drawImage(
          processedImage,
          displayedPhoto.left + circularPhotoLayout.left,
          displayedPhoto.top + circularPhotoLayout.top,
          circularPhotoLayout.width,
          circularPhotoLayout.height
        );
      } else {
        context.drawImage(
          processedImage,
          displayedPhoto.left,
          displayedPhoto.top,
          displayedPhoto.width,
          displayedPhoto.height
        );
      }

      if (shouldUseCircularPhotoLayout) {
        context.restore();
        context.save();
        context.beginPath();
        context.ellipse(
          displayedPhoto.left + displayedPhoto.width / 2,
          displayedPhoto.top + displayedPhoto.height / 2,
          displayedPhoto.width / 2,
          displayedPhoto.height / 2,
          0,
          0,
          Math.PI * 2
        );
        context.lineWidth = 15.737705;
        context.strokeStyle = "rgba(56, 189, 248, 0.7)";
        context.stroke();
        context.restore();
      }
    }

    selectedTemplate.textFields.forEach((field) => {
      if (deletedTextFieldIds.includes(field.id)) {
        return;
      }

      const value = textValues[field.id] ?? "";

      if (!value) {
        return;
      }

      const layout = getTextLayout(field);
      const lineHeight = layout.fontSize * (field.lineHeight ?? 1.15);
      context.font = `${layout.fontStyle} ${layout.fontWeight} ${layout.fontSize}px ${layout.fontFamily}`;
      const lines = wrapCanvasText(context, value, layout.width);
      const maxLines = Math.max(1, Math.floor(layout.height / lineHeight));

      context.save();
      context.beginPath();
      context.rect(layout.x, layout.y, layout.width, layout.height);
      context.clip();
      context.fillStyle = layout.color;
      context.textBaseline = "top";
      context.textAlign = layout.textAlign;

      const textX =
        layout.textAlign === "center"
          ? layout.x + layout.width / 2
          : layout.textAlign === "right"
            ? layout.x + layout.width
            : layout.x;

      lines.slice(0, maxLines).forEach((line, index) => {
        context.fillText(line, textX, layout.y + index * lineHeight);
      });
      context.restore();
    });

    return canvasToPngBlob(canvas);
  };

  return (
    <div className="grid gap-3 md:min-h-0 md:flex-1 md:grid-cols-[minmax(280px,360px)_1fr] md:overflow-hidden lg:grid-cols-[minmax(320px,420px)_1fr] lg:gap-4">
      <section className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm md:min-h-0 md:overflow-y-auto">
        <div>
          <h2 className="text-base font-semibold text-slate-950">Templates</h2>
          <div className="mt-2 grid grid-cols-[44px_1fr_44px] items-center gap-2">
            <button
              type="button"
              onClick={handlePreviousTemplate}
              className="flex h-11 w-11 items-center justify-center rounded-md border border-slate-300 text-xl font-bold text-slate-700 transition hover:bg-slate-50"
              aria-label="Previous template"
            >
              ‹
            </button>

            <div className="min-w-0">
              <button
                type="button"
                className="w-full rounded-lg border border-sky-500 bg-sky-50 p-1.5 text-left ring-2 ring-sky-200"
                aria-label={`Selected template: ${selectedTemplate.name}`}
              >
                <span
                  className="mx-auto block max-h-40 overflow-hidden rounded-md bg-slate-100"
                  style={{
                    aspectRatio: `${selectedTemplate.width} / ${selectedTemplate.height}`,
                    width: "min(100%, 120px)"
                  }}
                >
                  <img
                    key={selectedTemplate.backgroundImage}
                    src={selectedTemplate.backgroundImage}
                    alt={`${selectedTemplate.name} flyer template`}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                </span>
                <span className="mt-1 block truncate text-xs font-medium text-slate-800">
                  {selectedTemplate.name}
                </span>
                <span className="block text-xs text-slate-600">
                  {selectedTemplateIndex + 1} of {flyerTemplates.length}
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleNextTemplate}
              className="flex h-11 w-11 items-center justify-center rounded-md border border-slate-300 text-xl font-bold text-slate-700 transition hover:bg-slate-50"
              aria-label="Next template"
            >
              ›
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-base font-semibold text-slate-950">Photo</h2>
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              handleFile(event.dataTransfer.files.item(0));
            }}
            className={`mt-2 rounded-lg border-2 border-dashed p-3 text-center transition ${
              isDragging ? "border-sky-500 bg-sky-50" : "border-slate-300 bg-slate-50"
            }`}
          >
            <input
              ref={fileInputRef}
              id="photo-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => handleFile(event.target.files?.item(0) ?? null)}
            />
            <label
              htmlFor="photo-upload"
              className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
            >
              Choose Photo
            </label>
            <p className="mt-1 text-xs text-slate-600">JPG, PNG, or WebP.</p>
            {originalPreviewUrl ? (
              <img
                src={originalPreviewUrl}
                alt="Original uploaded preview"
                className="mx-auto mt-2 max-h-20 rounded-md object-contain sm:max-h-24"
              />
            ) : null}
          </div>

          <div
            className={`mt-2 grid gap-2 ${
              uploadedFile && showRemoveBackgroundAction ? "grid-cols-2" : "grid-cols-1"
            }`}
          >
            {showRemoveBackgroundAction ? (
              <button
                type="button"
                onClick={handleRemoveBackground}
                disabled={!uploadedFile || isProcessing}
                className="min-h-10 w-full rounded-md bg-sky-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isProcessing ? statusMessage[status] : "Remove Background"}
              </button>
            ) : null}
            {uploadedFile ? (
              <button
                type="button"
                onClick={handleRemovePhoto}
                disabled={isProcessing}
                className="min-h-10 w-full rounded-md border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
              >
                Remove Photo
              </button>
            ) : null}
          </div>
          {shouldUseCircularPhotoLayout && flyerPhotoUrl ? (
            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
              <div className="flex items-center justify-between gap-3">
                <label
                  htmlFor="photo-zoom"
                  className="text-xs font-semibold text-slate-800"
                >
                  Photo zoom
                </label>
                <span className="text-xs tabular-nums text-slate-600">
                  {Math.round(photoCrop.zoom * 100)}%
                </span>
              </div>
              <div className="mt-2 grid grid-cols-[36px_1fr_36px] items-center gap-2">
                <button
                  type="button"
                  aria-label="Zoom out photo"
                  onClick={() => updatePhotoZoom(photoCrop.zoom - 0.1)}
                  disabled={!processedDimensions || photoCrop.zoom <= minPhotoZoom}
                  className="h-9 rounded-md border border-slate-300 bg-white text-lg font-semibold text-slate-700 disabled:cursor-not-allowed disabled:text-slate-300"
                >
                  −
                </button>
                <input
                  id="photo-zoom"
                  type="range"
                  min={minPhotoZoom * 100}
                  max={maxPhotoZoom * 100}
                  step="1"
                  value={Math.round(photoCrop.zoom * 100)}
                  disabled={!processedDimensions}
                  onChange={(event) => updatePhotoZoom(Number(event.target.value) / 100)}
                  className="w-full accent-sky-600"
                />
                <button
                  type="button"
                  aria-label="Zoom in photo"
                  onClick={() => updatePhotoZoom(photoCrop.zoom + 0.1)}
                  disabled={!processedDimensions || photoCrop.zoom >= maxPhotoZoom}
                  className="h-9 rounded-md border border-slate-300 bg-white text-lg font-semibold text-slate-700 disabled:cursor-not-allowed disabled:text-slate-300"
                >
                  +
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-600">Drag the photo inside the circle to reposition it.</p>
            </div>
          ) : null}
          <p className="mt-1 text-xs text-slate-600" role="status">
            {statusMessage[status]}
          </p>
          {error ? (
            <p className="mt-2 rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <div>
          <h2 className="text-base font-semibold text-slate-950">Text</h2>
          <div className="mt-2 flex flex-col gap-2">
            {selectedTemplate.textFields.map((field) => {
              const sharedProps = {
                id: `field-${field.id}`,
                name: `field-${field.id}`,
                value: textValues[field.id] ?? "",
                placeholder: field.placeholder,
                maxLength: field.maxLength,
                onChange: (
                  event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
                ) => {
                  setDeletedTextFieldIds((current) =>
                    current.filter((deletedId) => deletedId !== field.id)
                  );
                  setTextValues((current) => ({ ...current, [field.id]: event.target.value }));
                },
                onFocus: () => setSelectedTextFieldId(field.id),
                className:
                  "mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-950 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              };

              return (
                <label key={field.id} htmlFor={`field-${field.id}`} className="text-xs font-medium text-slate-700">
                  {field.label}
                  {field.multiline ? (
                    <textarea {...sharedProps} rows={2} />
                  ) : (
                    <input {...sharedProps} type="text" />
                  )}
                </label>
              );
            })}
          </div>

          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-900">Text Style</h3>
              {selectedTextField ? (
                <button
                  type="button"
                  onClick={deleteSelectedTextValue}
                  className="min-h-8 rounded-md border border-rose-200 px-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                >
                  Delete Text
                </button>
              ) : (
                <span className="text-xs text-slate-600">Click text</span>
              )}
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="col-span-2 text-xs font-medium text-slate-700 sm:col-span-1">
                Font
                <select
                  id="text-font-family"
                  name="text-font-family"
                  value={selectedTextLayout?.fontFamily ?? defaultPreviewFontFamily}
                  onChange={(event) => updateSelectedTextLayout({ fontFamily: event.target.value })}
                  disabled={!selectedTextField}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-950 shadow-sm disabled:bg-slate-100 disabled:text-slate-400"
                >
                  {fontOptions.map((font) => (
                    <option key={font.value} value={font.value}>
                      {font.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs font-medium text-slate-700">
                Weight
                <select
                  id="text-font-weight"
                  name="text-font-weight"
                  value={String(selectedTextLayout?.fontWeight ?? 400)}
                  onChange={(event) =>
                    updateSelectedTextLayout({ fontWeight: Number(event.target.value) })
                  }
                  disabled={!selectedTextField}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-950 shadow-sm disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <option value="400">Regular</option>
                  <option value="600">Semibold</option>
                  <option value="700">Bold</option>
                  <option value="800">Extra Bold</option>
                  <option value="900">Black</option>
                </select>
              </label>

              <label className="text-xs font-medium text-slate-700">
                Style
                <select
                  id="text-font-style"
                  name="text-font-style"
                  value={selectedTextLayout?.fontStyle ?? "normal"}
                  onChange={(event) =>
                    updateSelectedTextLayout({
                      fontStyle: event.target.value as TextAdjustment["fontStyle"]
                    })
                  }
                  disabled={!selectedTextField}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-950 shadow-sm disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <option value="normal">Normal</option>
                  <option value="italic">Italic</option>
                </select>
              </label>

              <label className="text-xs font-medium text-slate-700">
                Color
                <input
                  id="text-color"
                  name="text-color"
                  type="color"
                  value={selectedTextLayout?.color ?? "#0b4f93"}
                  onChange={(event) => updateSelectedTextLayout({ color: event.target.value })}
                  disabled={!selectedTextField}
                  className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white p-1 shadow-sm disabled:opacity-50"
                />
              </label>

              <label className="text-xs font-medium text-slate-700">
                Size
                <input
                  id="text-font-size"
                  name="text-font-size"
                  type="number"
                  min="24"
                  max="180"
                  value={Math.round(selectedTextLayout?.fontSize ?? 48)}
                  onChange={(event) =>
                    updateSelectedTextLayout({
                      fontSize: Math.max(24, Math.min(180, Number(event.target.value)))
                    })
                  }
                  disabled={!selectedTextField}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-950 shadow-sm disabled:bg-slate-100 disabled:text-slate-400"
                />
              </label>

              <label className="col-span-2 text-xs font-medium text-slate-700 sm:col-span-1">
                Align
                <select
                  id="text-align"
                  name="text-align"
                  value={selectedTextLayout?.textAlign ?? "left"}
                  onChange={(event) =>
                    updateSelectedTextLayout({ textAlign: event.target.value as TextAlign })
                  }
                  disabled={!selectedTextField}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-950 shadow-sm disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </label>
            </div>
          </div>
        </div>

        <div className="sticky bottom-2 z-10 grid grid-cols-2 gap-2 rounded-lg bg-white/95 pt-1 backdrop-blur md:bg-white/95 lg:static lg:bg-transparent lg:pt-0 lg:backdrop-blur-0">
          <button
            type="button"
            onClick={handleDownload}
            disabled={isExporting}
            className="min-h-10 rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Download PNG
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={isExporting}
            className="min-h-10 rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
          >
            Reset
          </button>
        </div>
      </section>

      <section className="flex min-h-[380px] flex-col rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:min-h-[520px] sm:p-4 md:min-h-0 md:overflow-hidden">
        <div className="mb-2 flex items-center justify-between gap-3 sm:mb-3">
          <h2 className="text-base font-semibold text-slate-950 sm:text-lg">Live Preview</h2>
          <span className="text-sm text-slate-600">{selectedTemplate.name}</span>
        </div>
        {selectedTextField ? (
          <div className="sticky top-0 z-20 mb-2 rounded-lg border border-emerald-200 bg-white/95 p-2 shadow-sm backdrop-blur md:hidden">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="mobile-selected-text"
                className="text-xs font-semibold text-slate-800"
              >
                {selectedTextField.label}
              </label>
              <button
                type="button"
                onClick={deleteSelectedTextValue}
                className="min-h-9 rounded-md border border-rose-200 px-3 text-xs font-semibold text-rose-700"
              >
                Delete
              </button>
            </div>
            {selectedTextField.multiline ? (
              <textarea
                id="mobile-selected-text"
                rows={2}
                value={selectedTextValue}
                placeholder={selectedTextField.placeholder}
                maxLength={selectedTextField.maxLength}
                onChange={(event) => updateSelectedTextValue(event.target.value)}
                className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            ) : (
              <input
                id="mobile-selected-text"
                type="text"
                value={selectedTextValue}
                placeholder={selectedTextField.placeholder}
                maxLength={selectedTextField.maxLength}
                onChange={(event) => updateSelectedTextValue(event.target.value)}
                className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            )}
          </div>
        ) : null}
        <div
          ref={previewShellRef}
          className="flex min-h-[320px] max-h-[68dvh] w-full flex-1 items-start justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-100 sm:min-h-[440px] md:min-h-0 md:max-h-none"
        >
          <div
            style={{
              width: selectedTemplate.width * previewScale,
              height: selectedTemplate.height * previewScale,
              transform: `scale(${previewScale})`,
              transformOrigin: "top left"
            }}
          >
          <div
            ref={previewRef}
            className="relative overflow-hidden bg-white"
            style={{
              width: selectedTemplate.width,
              height: selectedTemplate.height,
              fontFamily: defaultPreviewFontFamily
            }}
          >
            <img
              src={selectedTemplate.backgroundImage}
              alt=""
              aria-hidden="true"
              fetchPriority="high"
              className="absolute inset-0 h-full w-full object-cover"
            />

            {flyerPhotoUrl && displayedPhoto ? (
              <div
                data-testid="flyer-photo"
                className="absolute max-w-none select-none touch-none"
                onPointerDown={
                  shouldUseCircularPhotoLayout ? startCircularPhotoPan : startPhotoMove
                }
                style={{
                  left: displayedPhoto.left,
                  top: displayedPhoto.top,
                  width: displayedPhoto.width,
                  height: displayedPhoto.height,
                  borderRadius: shouldUseCircularPhotoLayout ? "50%" : undefined,
                  overflow: "hidden",
                  backgroundColor: shouldUseCircularPhotoLayout ? "transparent" : undefined,
                  outline: !isExporting ? photoOutlineStyle : undefined
                }}
              >
                <img
                  src={flyerPhotoUrl}
                  alt={processedImageUrl ? "Background removed uploaded photo" : "Uploaded photo"}
                  className={
                    shouldUseCircularPhotoLayout
                      ? circularPhotoLayout
                        ? "absolute max-w-none cursor-move select-none"
                        : "absolute h-full w-full max-w-none cursor-move select-none object-cover"
                      : "h-full w-full cursor-move object-fill"
                  }
                  draggable={false}
                  style={{
                    backgroundColor: shouldUseCircularPhotoLayout ? "transparent" : undefined,
                    left: circularPhotoLayout?.left,
                    top: circularPhotoLayout?.top,
                    width: circularPhotoLayout?.width,
                    height: circularPhotoLayout?.height
                  }}
                />
                {!isExporting && !shouldUseCircularPhotoLayout
                  ? resizeDirections.map((direction) => (
                      <button
                        key={direction}
                        type="button"
                        aria-label={`Resize photo ${direction}`}
                        data-html-to-image-ignore
                        onPointerDown={(event) => startPhotoResize(event, direction)}
                        className="absolute touch-none rounded-full bg-sky-500 shadow-lg"
                        style={{
                          ...getResizeHandleStyle(direction, canvasHandleSize),
                          border: `${canvasHandleBorder}px solid white`
                        }}
                      />
                    ))
                  : null}
              </div>
            ) : null}

            {selectedTemplate.textFields.map((field) => {
              if (deletedTextFieldIds.includes(field.id)) {
                return null;
              }

              const layout = getTextLayout(field);
              const isSelected = selectedTextFieldId === field.id;

              return (
                <div
                  key={field.id}
                  data-testid={`flyer-text-${field.id}`}
                  className="absolute cursor-move select-none touch-none"
                  onPointerDown={(event) => startTextMove(event, field)}
                  style={{
                    left: layout.x,
                    top: layout.y,
                    width: layout.width,
                    height: layout.height,
                    color: layout.color,
                    fontFamily: layout.fontFamily,
                    fontSize: layout.fontSize,
                    fontWeight: layout.fontWeight,
                    fontStyle: layout.fontStyle,
                    lineHeight: field.lineHeight ?? 1.15,
                    textAlign: layout.textAlign,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    overflow: "hidden",
                    outline: isSelected && !isExporting
                      ? `${canvasRingWidth}px solid rgb(52 211 153 / 0.8)`
                      : undefined
                  }}
                >
                  {textValues[field.id]}
                  {isSelected && !isExporting
                    ? resizeDirections.map((direction) => (
                        <button
                          key={direction}
                          type="button"
                          aria-label={`Resize ${field.label} ${direction}`}
                          data-html-to-image-ignore
                          onPointerDown={(event) => startTextResize(event, field, direction)}
                          className="absolute touch-none rounded-full bg-emerald-500 shadow-lg"
                          style={{
                            ...getResizeHandleStyle(direction, canvasHandleSize),
                            border: `${canvasHandleBorder}px solid white`
                          }}
                        />
                      ))
                    : null}
                </div>
              );
            })}
          </div>
          </div>
        </div>
      </section>
    </div>
  );
}
