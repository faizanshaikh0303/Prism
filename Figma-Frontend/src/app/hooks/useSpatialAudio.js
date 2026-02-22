import { useRef, useCallback, useEffect } from 'react';
import { stemUrl } from '../services/api';
import { CANVAS_RADIUS, AUDIO_REF_DISTANCE, AUDIO_MAX_DISTANCE } from '../constants';

export default function useSpatialAudio() {
  const ctxRef         = useRef(null);
  const buffersRef     = useRef({});
  const sourcesRef     = useRef({});
  const gainNodesRef   = useRef({});
  const pannerNodesRef = useRef({});
  const masterGainRef  = useRef(null);
  const playingRef     = useRef(false);
  const startAtRef     = useRef(0);
  const offsetRef      = useRef(0);

  const getCtx = useCallback(() => {
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      masterGainRef.current = ctxRef.current.createGain();
      masterGainRef.current.connect(ctxRef.current.destination);

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
    const scale = AUDIO_MAX_DISTANCE / CANVAS_RADIUS;
    return { x: canvasX * scale, y: 0, z: -canvasY * scale };
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
    sourcesRef.current   = {};
    gainNodesRef.current = {};
    pannerNodesRef.current = {};
  }, []);

  const loadStems = useCallback(async (stems) => {
    const ctx = getCtx();
    if (ctx.state === 'suspended') await ctx.resume();

    const results = await Promise.allSettled(
      stems.map(async (stem) => {
        if (buffersRef.current[stem.id]) return;
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

      const source    = ctx.createBufferSource();
      source.buffer   = buffer;
      source.loop     = true;

      const gainNode  = ctx.createGain();
      gainNode.gain.value = stemMutes[stem.id] ? 0 : 1;

      const panner = ctx.createPanner();
      panner.panningModel  = 'HRTF';
      panner.distanceModel = 'inverse';
      panner.refDistance   = AUDIO_REF_DISTANCE;
      panner.maxDistance   = AUDIO_MAX_DISTANCE * 10;
      panner.rolloffFactor = 1;
      panner.coneInnerAngle = 360;

      const pos = nodePositions[stem.id] ?? { x: 0, y: 0 };
      const { x, y, z } = canvasTo3D(pos.x, pos.y);
      setPannerPosition(panner, x, y, z);

      source.connect(gainNode);
      gainNode.connect(panner);
      panner.connect(masterGainRef.current);

      sourcesRef.current[stem.id]     = source;
      gainNodesRef.current[stem.id]   = gainNode;
      pannerNodesRef.current[stem.id] = panner;
    });

    const startAt = ctx.currentTime + 0.05;
    Object.values(sourcesRef.current).forEach((s) => s.start(startAt, startOffset));
    startAtRef.current = startAt;
    playingRef.current = true;
  }, [getCtx, stopSources, canvasTo3D, setPannerPosition]);

  const pause = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx || !playingRef.current) return;
    const elapsed = ctx.currentTime - startAtRef.current;
    offsetRef.current += elapsed;
    playingRef.current = false;
    stopSources();
  }, [stopSources]);

  const updatePosition = useCallback((stemId, canvasX, canvasY) => {
    const panner = pannerNodesRef.current[stemId];
    if (!panner) return;
    const { x, y, z } = canvasTo3D(canvasX, canvasY);
    setPannerPosition(panner, x, y, z);
  }, [canvasTo3D, setPannerPosition]);

  const setMute = useCallback((stemId, muted) => {
    const gain = gainNodesRef.current[stemId];
    if (!gain) return;
    const ctx = ctxRef.current;
    gain.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, 0.01);
  }, []);

  const setMasterVolume = useCallback((volume) => {
    if (!masterGainRef.current) return;
    const ctx = ctxRef.current;
    masterGainRef.current.gain.setTargetAtTime(volume, ctx.currentTime, 0.02);
  }, []);

  const resetOffset = useCallback(() => {
    offsetRef.current  = 0;
    playingRef.current = false;
    buffersRef.current = {};
    stopSources();
  }, [stopSources]);

  const getDuration = useCallback(() => {
    const buf = Object.values(buffersRef.current)[0];
    return buf?.duration ?? 0;
  }, []);

  const getCurrentTime = useCallback(() => {
    const duration = getDuration();
    if (!duration) return 0;
    const ctx = ctxRef.current;
    if (playingRef.current && ctx) {
      const elapsed = ctx.currentTime - startAtRef.current;
      return (offsetRef.current + elapsed) % duration;
    }
    return offsetRef.current % duration;
  }, [getDuration]);

  const seek = useCallback((newTime) => {
    const wasPlaying = playingRef.current;
    if (wasPlaying) {
      playingRef.current = false;
      stopSources();
    }
    offsetRef.current = newTime;
    return wasPlaying;
  }, [stopSources]);

  useEffect(() => {
    return () => {
      stopSources();
      ctxRef.current?.close();
    };
  }, [stopSources]);

  return { loadStems, play, pause, updatePosition, setMute, setMasterVolume, resetOffset, getCurrentTime, getDuration, seek };
}
