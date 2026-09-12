"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const SAJU_AMBIENT_SRC_MP3 = "/saju/audio/ambient-shrine.mp3";
export const SAJU_AMBIENT_SRC_OGG = "/saju/audio/ambient-shrine.ogg";

/**
 * Foxbunny-style theater ambient: requires a user gesture to start (autoplay policy).
 * Toggle on/off; mute + stop when inactive (skip / unmount).
 */
export function useTheaterAmbient(active: boolean) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [soundOn, setSoundOn] = useState(false);
  const [needsGesture, setNeedsGesture] = useState(false);

  const ensureAudio = useCallback(() => {
    if (typeof window === "undefined") return null;
    if (audioRef.current) return audioRef.current;
    const el = new Audio();
    el.loop = true;
    el.preload = "auto";
    el.volume = 0.38;
    // Prefer ogg when supported, else mp3
    const canOgg =
      typeof el.canPlayType === "function" &&
      el.canPlayType('audio/ogg; codecs="vorbis"') !== "";
    el.src = canOgg ? SAJU_AMBIENT_SRC_OGG : SAJU_AMBIENT_SRC_MP3;
    audioRef.current = el;
    return el;
  }, []);

  const stop = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    el.pause();
    try {
      el.currentTime = 0;
    } catch {
      /* ignore */
    }
  }, []);

  const play = useCallback(async () => {
    const el = ensureAudio();
    if (!el) return false;
    try {
      await el.play();
      setNeedsGesture(false);
      return true;
    } catch {
      setNeedsGesture(true);
      setSoundOn(false);
      return false;
    }
  }, [ensureAudio]);

  const toggleSound = useCallback(async () => {
    if (soundOn) {
      stop();
      setSoundOn(false);
      setNeedsGesture(false);
      return;
    }
    setSoundOn(true);
    const ok = await play();
    if (!ok) setSoundOn(false);
  }, [play, soundOn, stop]);

  // Mute when theater becomes inactive (skipped / dismissed)
  useEffect(() => {
    if (!active) {
      stop();
      setSoundOn(false);
      setNeedsGesture(false);
    }
  }, [active, stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
      audioRef.current = null;
    };
  }, [stop]);

  return {
    soundOn,
    needsGesture,
    toggleSound,
    mute: stop,
  };
}
