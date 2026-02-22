/** Colour assigned to each stem type for the spatial canvas and UI. */
export const STEM_COLORS = {
  vocals:  '#f472b6',
  drums:   '#60a5fa',
  bass:    '#34d399',
  guitar:  '#a78bfa',
  piano:   '#fbbf24',
  other:   '#fb923c',
};

/** Canvas geometry constants (pixels). */
export const CANVAS_SIZE   = 580;
export const CANVAS_CENTER = CANVAS_SIZE / 2;
export const CANVAS_RADIUS = 235;
export const NODE_RADIUS   = 22;

/** Spatial audio distance constants (Web Audio API units). */
export const AUDIO_REF_DISTANCE = 1;
export const AUDIO_MAX_DISTANCE = 12;
