import { create } from 'zustand';
import { CANVAS_RADIUS } from '../constants';

function defaultPositions(stems) {
  const positions = {};
  const r = CANVAS_RADIUS * 0.6;
  stems.forEach((stem, i) => {
    const angle = (i / stems.length) * Math.PI * 2 - Math.PI / 2;
    positions[stem.id] = {
      x: Math.cos(angle) * r,
      y: Math.sin(angle) * r,
    };
  });
  return positions;
}

const useAudioStore = create((set) => ({
  currentSong:   null,
  stems:         [],
  nodePositions: {},
  isPlaying:     false,
  masterVolume:  1,
  stemMutes:     {},

  setCurrentSong: (song) => {
    const stems = song?.stems ?? [];
    set({
      currentSong:   song,
      stems,
      nodePositions: defaultPositions(stems),
      isPlaying:     false,
      stemMutes:     Object.fromEntries(stems.map((s) => [s.id, false])),
    });
  },

  updateNodePosition: (stemId, x, y) =>
    set((state) => ({
      nodePositions: { ...state.nodePositions, [stemId]: { x, y } },
    })),

  toggleMute: (stemId) =>
    set((state) => ({
      stemMutes: { ...state.stemMutes, [stemId]: !state.stemMutes[stemId] },
    })),

  setIsPlaying:    (v) => set({ isPlaying: v }),
  setMasterVolume: (v) => set({ masterVolume: v }),
}));

export default useAudioStore;
