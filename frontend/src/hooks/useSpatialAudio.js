/**
 * useSpatialAudio
 *
 * Manages the Web Audio API graph for binaural spatial playback.
 *
 * Architecture per stem:
 *   AudioBufferSourceNode → GainNode (mute/volume) → PannerNode (HRTF) → destination
 *
 * The listener is fixed at the origin facing -Z (forward = top of canvas).
 * Canvas coords (x, y) are converted to 3D space:
 *   audioX =  canvasX / CANVAS_RADIUS * MAX_DIST
 *   audioZ = -canvasY / CANVAS_RADIUS * MAX_DIST   (canvas +Y is down, audio -Z is forward)
 *   audioY = 0                                      (horizontal plane only)
 *
 * Distance model: 'inverse' with rolloffFactor 1 → gain halves each time distance doubles.
 */
import { useRef, useCallback, useEffect } from 'react';
import { stemUrl } from '../services/api';
import { CANVAS_RADIUS, AUDIO_REF_DISTANCE, AUDIO_MAX_DISTANCE } from '../constants';

export default function useSpatialAudio() {
  const ctxRef      = useRef(null);   // AudioContext
  const buffersRef  = useRef({});     // { stemId: AudioBuffer }
  const sourcesRef  = useRef({});     // { stemId: AudioBufferSourceNode }
  const gainNodesRef   = useRef({});  // { stemId: GainNode }
  const pannerNodesRef = useRef({});  // { stemId: PannerNode }
  const masterGainRef  = useRef(null);
  const playingRef  = useRef(false);
  const startAtRef  = useRef(0);      // AudioContext time when playback started
  const offsetRef   = useRef(0);      // accumulated play offset in seconds

  // ── Helpers ────────────────────────────────────────────────────────────────

  const getCtx = useCallback(() => {
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();

      // Master gain → destination
      masterGainRef.current = ctxRef.current.createGain();
      masterGainRef.current.connect(ctxRef.current.destination);

      // Listener: at origin, facing -Z, up = +Y
      const l = ctxRef.current.listener;
      if (l.positionX) {
        l.positionX.value = 0; l.positionY.value = 0; l.positionZ.value = 0;
        l.forwardX.value  = 0; l.forwardY.value  = 0; l.forwardZ.value  = -1;
        l.upX.value       = 0; l.upY.value       = 1; l.upZ.value       = 0;
      } else {
        l.setPosition(0, 0, 0);
        l.setOrientation(0, 0, -1, 0, 1, 0);
      }
    }
    return ctxRef.current;
  }, []);

  const canvasTo3D = useCallback((canvasX, canvasY) => {
    // Clamp to some reasonable distance (nodes may be placed outside circle)
    const scale = AUDIO_MAX_DISTANCE / CANVAS_RADIUS;
    return {
      x:  canvasX * scale,
      y:  0,
      z: -canvasY * scale,
    };
  }, []);

  const setPannerPosition = useCallback((panner, x, y, z) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const t = ctx.currentTime;
    if (panner.positionX) {
      panner.positionX.setValueAtTime(x, t);
      panner.positionY.setValueAtTime(y, t);
      panner.positionZ.setValueAtTime(z, t);
    } else {
      panner.setPosition(x, y, z);
    }
  }, []);

  const stopSources = useCallback(() => {
    Object.values(sourcesRef.current).forEach((s) => {
      try { s.stop(0); s.disconnect(); } catch (_) {}
    });
    sourcesRef.current  = {};
    gainNodesRef.current   = {};
    pannerNodesRef.current = {};
  }, []);

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Decode and cache all audio buffers for a song's stems.
   * Must be called before play().
   */
  const loadStems = useCallback(async (stems) => {
    const ctx = getCtx();
    if (ctx.state === 'suspended') await ctx.resume();

    const results = await Promise.allSettled(
      stems.map(async (stem) => {
        if (buffersRef.current[stem.id]) return; // already cached
        const url = stemUrl(stem.file_path);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
        const raw = await response.arrayBuffer();
        buffersRef.current[stem.id] = await ctx.decodeAudioData(raw);
      })
    );

    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        console.warn(`Failed to load stem ${stems[i]?.stem_type}:`, r.reason);
      }
    });
  }, [getCtx]);

  /**
   * Start playback.
   * @param {Array}  stems         — stem objects from the store
   * @param {Object} nodePositions — { [stemId]: { x, y } } canvas coords
   * @param {Object} stemMutes     — { [stemId]: boolean }
   * @param {number} masterVolume  — 0..1
   */
  const play = useCallback((stems, nodePositions, stemMutes = {}, masterVolume = 1) => {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();

    stopSources();

    masterGainRef.current.gain.setValueAtTime(masterVolume, ctx.currentTime);

    const loopDuration = Object.values(buffersRef.current)[0]?.duration ?? 0;
    const startOffset  = loopDuration > 0 ? offsetRef.current % loopDuration : 0;

    stems.forEach((stem) => {
      const buffer = buffersRef.current[stem.id];
      if (!buffer) return;

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop   = true;

      const gainNode = ctx.createGain();
      gainNode.gain.value = stemMutes[stem.id] ? 0 : 1;

      const panner = ctx.createPanner();
      panner.panningModel  = 'HRTF';
      panner.distanceModel = 'inverse';
      panner.refDistance   = AUDIO_REF_DISTANCE;
      panner.maxDistance   = AUDIO_MAX_DISTANCE * 10;
      panner.rolloffFactor = 1;
      panner.coneInnerAngle = 360;

      // Apply initial position
      const pos = nodePositions[stem.id] ?? { x: 0, y: 0 };
      const { x, y, z } = canvasTo3D(pos.x, pos.y);
      setPannerPosition(panner, x, y, z);

      source.connect(gainNode);
      gainNode.connect(panner);
      panner.connect(masterGainRef.current);

      sourcesRef.current[stem.id]    = source;
      gainNodesRef.current[stem.id]  = gainNode;
      pannerNodesRef.current[stem.id] = panner;
    });

    const startAt = ctx.currentTime + 0.05;
    Object.values(sourcesRef.current).forEach((s) => s.start(startAt, startOffset));

    startAtRef.current = startAt;
    playingRef.current = true;
  }, [getCtx, stopSources, canvasTo3D, setPannerPosition]);

  /**
   * Pause — saves playback offset so resume works.
   */
  const pause = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx || !playingRef.current) return;

    const elapsed = ctx.currentTime - startAtRef.current;
    offsetRef.current += elapsed;
    playingRef.current = false;
    stopSources();
  }, [stopSources]);

  /**
   * Update a single node's 3D position while playing.
   */
  const updatePosition = useCallback((stemId, canvasX, canvasY) => {
    const panner = pannerNodesRef.current[stemId];
    if (!panner) return;
    const { x, y, z } = canvasTo3D(canvasX, canvasY);
    setPannerPosition(panner, x, y, z);
  }, [canvasTo3D, setPannerPosition]);

  /**
   * Toggle mute for a single stem.
   */
  const setMute = useCallback((stemId, muted) => {
    const gain = gainNodesRef.current[stemId];
    if (!gain) return;
    const ctx = ctxRef.current;
    gain.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, 0.01);
  }, []);

  /**
   * Set master volume (0–1).
   */
  const setMasterVolume = useCallback((volume) => {
    if (!masterGainRef.current) return;
    const ctx = ctxRef.current;
    masterGainRef.current.gain.setTargetAtTime(volume, ctx.currentTime, 0.02);
  }, []);

  /**
   * Reset offset when switching songs.
   */
  const resetOffset = useCallback(() => {
    offsetRef.current  = 0;
    playingRef.current = false;
    buffersRef.current = {};
    stopSources();
  }, [stopSources]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSources();
      ctxRef.current?.close();
    };
  }, [stopSources]);

  return {
    loadStems,
    play,
    pause,
    updatePosition,
    setMute,
    setMasterVolume,
    resetOffset,
    isLoaded: (stemId) => !!buffersRef.current[stemId],
  };
}
