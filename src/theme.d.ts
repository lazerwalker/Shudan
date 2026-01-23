import type { CanvasTheme, ShadowConfig } from "./types";

export interface LoadThemeOptions {
  basePath?: string;
  stonePreRenderSize?: number;
  stoneShadow?: ShadowConfig;
  blackStoneUrls?: string[];
  whiteStoneUrls?: string[];
  boardImageUrl?: string;
}

export function loadTheme(
  containerEl: HTMLElement,
  options?: LoadThemeOptions
): Promise<CanvasTheme>;

export function createDefaultTheme(): CanvasTheme;

export function updateThemeCachedStones(
  theme: CanvasTheme,
  size: number
): CanvasTheme;
