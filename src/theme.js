// Default CSS custom property values (from goban.css)
const DEFAULT_COLORS = {
  boardBgColor: "#F1B458",
  boardFgColor: "#5E2E0C",
  boardBorderColor: "#CA933A",
  blackBgColor: "#222",
  blackFgColor: "#eee",
  whiteBgColor: "#eee",
  whiteFgColor: "#222",
};

// Default heat colors (from goban.css)
const DEFAULT_HEAT_COLORS = {
  9: { color: "#59A80F", glowRadius: 1.0, opacity: 0.8 },
  8: { color: "#59A80F", glowRadius: 0.9, opacity: 0.7 },
  7: { color: "#4886D5", glowRadius: 0.75, opacity: 0.8 },
  6: { color: "#4886D5", glowRadius: 0.6, opacity: 0.8 },
  5: { color: "#4886D5", glowRadius: 0.55, opacity: 0.7 },
  4: { color: "#92278F", glowRadius: 0.5, opacity: 0.8 },
  3: { color: "#92278F", glowRadius: 0.45, opacity: 0.7 },
  2: { color: "#F02311", glowRadius: 0.4, opacity: 0.8 },
  1: { color: "#F02311", glowRadius: 0.4, opacity: 0.7 },
};

// Default ghost type colors
const DEFAULT_GHOST_TYPE_COLORS = {
  good: "#59A80F",
  interesting: "#4886D5",
  doubtful: "#92278F",
  bad: "#F02311",
};

// Default stone shadow (from CSS ::before pseudo-element)
const DEFAULT_STONE_SHADOW = {
  dx: 0,
  dy: 0.1,
  blur: 0.12,
  color: "rgba(23, 10, 2, 0.4)",
};

/**
 * Extract CSS custom property value from computed style.
 */
function getCSSVar(style, name) {
  const value = style.getPropertyValue(name).trim();
  return value || null;
}

/**
 * Extract theme colors from CSS custom properties.
 */
function extractColorsFromCSS(style) {
  return {
    boardBgColor:
      getCSSVar(style, "--shudan-board-background-color") ??
      DEFAULT_COLORS.boardBgColor,
    boardFgColor:
      getCSSVar(style, "--shudan-board-foreground-color") ??
      DEFAULT_COLORS.boardFgColor,
    boardBorderColor:
      getCSSVar(style, "--shudan-board-border-color") ??
      DEFAULT_COLORS.boardBorderColor,
    blackBgColor:
      getCSSVar(style, "--shudan-black-background-color") ??
      DEFAULT_COLORS.blackBgColor,
    blackFgColor:
      getCSSVar(style, "--shudan-black-foreground-color") ??
      DEFAULT_COLORS.blackFgColor,
    whiteBgColor:
      getCSSVar(style, "--shudan-white-background-color") ??
      DEFAULT_COLORS.whiteBgColor,
    whiteFgColor:
      getCSSVar(style, "--shudan-white-foreground-color") ??
      DEFAULT_COLORS.whiteFgColor,
  };
}

/**
 * Load an image from a URL.
 */
function loadImage(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/**
 * Pre-render a stone with shadow to an offscreen canvas.
 */
function prerenderStoneWithShadow(stoneImage, shadow, size) {
  const canvas = document.createElement("canvas");
  const padding = shadow.blur * size * 2;
  canvas.width = size + padding * 2;
  canvas.height = size + padding * 2;

  const ctx = canvas.getContext("2d");

  // Draw shadow circle first
  ctx.shadowColor = shadow.color;
  ctx.shadowBlur = shadow.blur * size;
  ctx.shadowOffsetX = shadow.dx * size;
  ctx.shadowOffsetY = shadow.dy * size;

  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2, size / 2, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(23, 10, 2, 0.4)";
  ctx.fill();

  // Reset shadow for stone image
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Draw the stone image centered
  ctx.drawImage(stoneImage, padding, padding, size, size);

  return canvas;
}

/**
 * Pre-render all stone variants with shadows baked in.
 */
function prerenderStones(images, shadow, size) {
  return {
    cachedBlackStones: images.blackStoneImages.map((img) =>
      prerenderStoneWithShadow(img, shadow, size)
    ),
    cachedWhiteStones: images.whiteStoneImages.map((img) =>
      prerenderStoneWithShadow(img, shadow, size)
    ),
  };
}

/**
 * Load a complete theme configuration.
 *
 * @param {HTMLElement} containerEl - Container element to read CSS custom properties from
 * @param {Object} options - Optional configuration
 * @returns {Promise<Object>} Complete theme object for canvas rendering
 */
export async function loadTheme(containerEl, options = {}) {
  const {
    basePath = "",
    stonePreRenderSize = 50,
    stoneShadow = DEFAULT_STONE_SHADOW,
  } = options;

  // Read CSS custom properties
  const style = getComputedStyle(containerEl);
  const colors = extractColorsFromCSS(style);

  // Determine image URLs
  const blackStoneUrls = options.blackStoneUrls ?? [
    `${basePath}stone_1.svg`,
    `${basePath}stone_1.svg`,
    `${basePath}stone_1.svg`,
    `${basePath}stone_1.svg`,
  ];
  const whiteStoneUrls = options.whiteStoneUrls ?? [
    `${basePath}stone_-1.svg`,
    `${basePath}stone_-1.svg`,
    `${basePath}stone_-1.svg`,
    `${basePath}stone_-1.svg`,
  ];
  const boardImageUrl = options.boardImageUrl ?? `${basePath}board.png`;

  // Load all images in parallel
  const [boardImage, ...stoneImages] = await Promise.all([
    loadImage(boardImageUrl),
    ...blackStoneUrls.map(loadImage),
    ...whiteStoneUrls.map(loadImage),
  ]);

  const blackStoneImages = stoneImages.slice(0, 4).filter(Boolean);
  const whiteStoneImages = stoneImages.slice(4).filter(Boolean);

  // Pre-render stones with shadows if we have images and a size
  let cachedStones = {};
  if (
    stonePreRenderSize > 0 &&
    blackStoneImages.length > 0 &&
    whiteStoneImages.length > 0
  ) {
    cachedStones = prerenderStones(
      { blackStoneImages, whiteStoneImages },
      stoneShadow,
      stonePreRenderSize
    );
  }

  return {
    // Colors
    ...colors,

    // Board
    boardImage,
    borderWidth: 0.15,

    // Grid
    gridLineWidth: 1 / 40,
    hoshiRadius: 0.1,

    // Stones
    blackStoneImages,
    whiteStoneImages,
    stoneScale: 1.0,
    stoneOffset: { x: 0.04, y: 0.04 },
    stoneShadow,
    ...cachedStones,

    // Markers
    markerStrokeWidth: 0.07,

    // Coordinates
    coordFontSize: 0.6,

    // Heat colors
    heatColors: DEFAULT_HEAT_COLORS,

    // Selection
    selectionBorderColor: "#0082F0",
    selectionBorderWidth: 0.1,
    selectionBgColor: "rgba(0, 130, 240, 0.2)",
    selectionBorderRadius: 0.2,

    // Paint
    paintOpacity: 0.5,
    paintBorderRadius: 0.2,

    // Ghost stones
    ghostOpacity: 0.5,
    ghostFaintOpacity: 0.3,
    ghostRadius: 0.2,
    ghostTypeColors: DEFAULT_GHOST_TYPE_COLORS,

    // Lines
    lineStrokeWidth: 0.11,
  };
}

/**
 * Create a default theme without loading images.
 */
export function createDefaultTheme() {
  return {
    ...DEFAULT_COLORS,

    boardImage: null,
    borderWidth: 0.15,

    gridLineWidth: 1 / 40,
    hoshiRadius: 0.1,

    blackStoneImages: [],
    whiteStoneImages: [],
    stoneScale: 1.0,
    stoneOffset: { x: 0.04, y: 0.04 },
    stoneShadow: DEFAULT_STONE_SHADOW,

    markerStrokeWidth: 0.07,

    coordFontSize: 0.6,

    heatColors: DEFAULT_HEAT_COLORS,

    selectionBorderColor: "#0082F0",
    selectionBorderWidth: 0.1,
    selectionBgColor: "rgba(0, 130, 240, 0.2)",
    selectionBorderRadius: 0.2,

    paintOpacity: 0.5,
    paintBorderRadius: 0.2,

    ghostOpacity: 0.5,
    ghostFaintOpacity: 0.3,
    ghostRadius: 0.2,
    ghostTypeColors: DEFAULT_GHOST_TYPE_COLORS,

    lineStrokeWidth: 0.11,
  };
}

/**
 * Re-render cached stones at a new size.
 */
export function updateThemeCachedStones(theme, size) {
  if (
    theme.blackStoneImages.length === 0 ||
    theme.whiteStoneImages.length === 0
  ) {
    return theme;
  }

  const cachedStones = prerenderStones(
    {
      blackStoneImages: theme.blackStoneImages,
      whiteStoneImages: theme.whiteStoneImages,
    },
    theme.stoneShadow ?? DEFAULT_STONE_SHADOW,
    size
  );

  return {
    ...theme,
    ...cachedStones,
  };
}
