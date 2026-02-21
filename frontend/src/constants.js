/** Colour assigned to each stem type for the spatial canvas and UI. */
export const STEM_COLORS = {
  vocals:  '#FF6B6B',
  drums:   '#4ECDC4',
  bass:    '#45B7D1',
  guitar:  '#96CEB4',
  piano:   '#FFEAA7',
  other:   '#C9A0DC',
};

/** Canvas geometry constants (pixels). */
export const CANVAS_SIZE   = 500;
export const CANVAS_CENTER = CANVAS_SIZE / 2;
export const CANVAS_RADIUS = 200;   // max placement radius on the circle UI
export const NODE_RADIUS   = 22;    // draggable node hit radius

/** Spatial audio distance constants (Web Audio API units). */
export const AUDIO_REF_DISTANCE = 1;    // distance at which gain = 1
export const AUDIO_MAX_DISTANCE = 12;   // gain approaches 0 here
