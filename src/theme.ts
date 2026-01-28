import { useState, useEffect, useRef } from "react";

export interface Theme {
  boardBackgroundColor: string;
  boardForegroundColor: string;
  blackBackgroundColor: string;
  blackForegroundColor: string;
  whiteBackgroundColor: string;
  whiteForegroundColor: string;
}

export interface ThemeWithImages extends Theme {
  blackStoneImage: HTMLCanvasElement | null;
  whiteStoneImage: HTMLCanvasElement | null;
}

const defaultTheme: Theme = {
  boardBackgroundColor: "#F1B458",
  boardForegroundColor: "#5E2E0C",
  blackBackgroundColor: "#222",
  blackForegroundColor: "#eee",
  whiteBackgroundColor: "#eee",
  whiteForegroundColor: "#222",
};

export function getThemeFromElement(element: Element | null): Theme {
  if (!element) return { ...defaultTheme };

  const style = getComputedStyle(element);

  return {
    boardBackgroundColor:
      style.getPropertyValue("--shudan-board-background-color").trim() ||
      defaultTheme.boardBackgroundColor,
    boardForegroundColor:
      style.getPropertyValue("--shudan-board-foreground-color").trim() ||
      defaultTheme.boardForegroundColor,
    blackBackgroundColor:
      style.getPropertyValue("--shudan-black-background-color").trim() ||
      defaultTheme.blackBackgroundColor,
    blackForegroundColor:
      style.getPropertyValue("--shudan-black-foreground-color").trim() ||
      defaultTheme.blackForegroundColor,
    whiteBackgroundColor:
      style.getPropertyValue("--shudan-white-background-color").trim() ||
      defaultTheme.whiteBackgroundColor,
    whiteForegroundColor:
      style.getPropertyValue("--shudan-white-foreground-color").trim() ||
      defaultTheme.whiteForegroundColor,
  };
}

// Stone image cache keyed by "vertexSize-dpr"
const stoneImageCache = new Map<
  string,
  { black: HTMLCanvasElement | null; white: HTMLCanvasElement | null }
>();

// Load an image and render it to a canvas at the specified size
async function loadImageToCanvas(
  url: string,
  size: number
): Promise<HTMLCanvasElement | null> {
  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, size, size);
      }
      resolve(canvas);
    };

    img.onerror = () => {
      resolve(null);
    };

    img.src = url;
  });
}

// Get the resolved URL for stone assets by using the browser's CSS resolution
function getStoneUrl(sign: 1 | -1): string | null {
  // Create a temporary element with the stone-image classes
  // The browser will resolve the background-image URL for us
  const temp = document.createElement("div");
  temp.className = `shudan-stone-image shudan-sign_${sign}`;
  temp.style.position = "absolute";
  temp.style.visibility = "hidden";
  temp.style.pointerEvents = "none";
  document.body.appendChild(temp);

  try {
    const style = getComputedStyle(temp);
    const bgImage = style.backgroundImage;

    if (bgImage && bgImage !== "none") {
      // Extract URL from url("...") or url('...') or url(...)
      // Need to handle data URLs which may contain parentheses
      let url: string | null = null;

      // Try double-quoted first: url("...")
      const doubleQuoteMatch = bgImage.match(/url\("([^"]+)"\)/);
      if (doubleQuoteMatch) {
        url = doubleQuoteMatch[1];
      } else {
        // Try single-quoted: url('...')
        const singleQuoteMatch = bgImage.match(/url\('([^']+)'\)/);
        if (singleQuoteMatch) {
          url = singleQuoteMatch[1];
        } else {
          // Try unquoted (but this won't work for data URLs with parens)
          const unquotedMatch = bgImage.match(/url\(([^)]+)\)/);
          if (unquotedMatch) {
            url = unquotedMatch[1];
          }
        }
      }

      if (url) {
        return url;
      }
    }
  } finally {
    document.body.removeChild(temp);
  }

  return null;
}

export async function loadStoneImages(
  vertexSize: number,
  dpr: number = 1
): Promise<{
  black: HTMLCanvasElement | null;
  white: HTMLCanvasElement | null;
}> {
  const cacheKey = `${vertexSize}-${dpr}`;
  const cached = stoneImageCache.get(cacheKey);
  if (cached) return cached;

  // Stone size is slightly smaller than vertex (the .04em margin from CSS)
  // Load at DPR-scaled size for sharp rendering on high-density displays
  const stoneSize = Math.round(vertexSize * 0.92 * dpr);

  const blackUrl = getStoneUrl(1);
  const whiteUrl = getStoneUrl(-1);

  const [black, white] = await Promise.all([
    blackUrl ? loadImageToCanvas(blackUrl, stoneSize) : Promise.resolve(null),
    whiteUrl ? loadImageToCanvas(whiteUrl, stoneSize) : Promise.resolve(null),
  ]);

  const result = { black, white };
  stoneImageCache.set(cacheKey, result);
  return result;
}

export function useTheme(
  elementRef: React.RefObject<Element | null>,
  vertexSize: number
): ThemeWithImages {
  const [theme, setTheme] = useState<Theme>({ ...defaultTheme });
  const [stoneImages, setStoneImages] = useState<{
    black: HTMLCanvasElement | null;
    white: HTMLCanvasElement | null;
  }>({ black: null, white: null });

  // Extract theme colors from CSS
  useEffect(() => {
    if (elementRef.current) {
      setTheme(getThemeFromElement(elementRef.current));
    }
  }, [elementRef]);

  // Load stone images when vertex size changes
  useEffect(() => {
    const dpr = window.devicePixelRatio || 1;
    let cancelled = false;
    loadStoneImages(vertexSize, dpr).then((images) => {
      if (!cancelled) {
        setStoneImages(images);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [vertexSize]);

  return {
    ...theme,
    blackStoneImage: stoneImages.black,
    whiteStoneImage: stoneImages.white,
  };
}