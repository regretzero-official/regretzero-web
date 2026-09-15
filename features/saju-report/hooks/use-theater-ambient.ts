"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const SAJU_AMBIENT_SRC_MP3 = "/saju/audio/ambient-shrine.mp3";
export const SAJU_AMBIENT_SRC_OGG = "/saju/audio/ambient-shrine.ogg";
export const SAJU_AMBIENT_PAD_MP3 = "/saju/audio/ambient-pad.mp3";
export const SAJU_AMBIENT_PAD_OGG = "/saju/audio/ambient-pad.ogg";

/** Session-scoped preference so entry → loading can inherit “already enabled”. */
export const SAJU_AMBIENT_PREF_KEY = "saju-theater-ambient-on";

const TARGET_VOLUME = 0.36;
const PAD_VOLUME = 0.22;
/** While character TTS speaks, duck the bed so voices read clearly. */
const DUCK_MAIN = 0.12;
const DUCK_PAD = 0.08;
const FADE_MS = 420;
const FADE_STEPS = 14;

function preferOgg(el: HTMLAudioElement) {
  return (
    typeof el.canPlayType === "function" &&
    el.canPlayType('audio/ogg; codecs="vorbis"') !== ""
  );
}

function readAmbientPref(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(SAJU_AMBIENT_PREF_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeAmbientPref(on: boolean) {
  if (typeof window === "undefined") return;
  try {
    if (on) sessionStorage.setItem(SAJU_AMBIENT_PREF_KEY, "1");
    else sessionStorage.removeItem(SAJU_AMBIENT_PREF_KEY);
  } catch {
    /* ignore quota / private mode */
  }
}

/**
 * Foxbunny-style theater ambient: gesture-gated, volume ramps, session persist.
 * Soft second pad layer under the shrine loop for a slightly richer bed.
 */
export function useTheaterAmbient(active: boolean) {
  const mainRef = useRef<HTMLAudioElement | null>(null);
  const padRef = useRef<HTMLAudioElement | null>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wantSoundRef = useRef(false);
  const duckedRef = useRef(false);
  const [soundOn, setSoundOn] = useState(false);
  const [needsGesture, setNeedsGesture] = useState(false);
  /** True until the user has successfully enabled sound once this session. */
  const [awaitingFirstEnable, setAwaitingFirstEnable] = useState(() => !readAmbientPref());

  const clearFade = useCallback(() => {
    if (fadeTimerRef.current) {
      clearInterval(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
  }, []);

  const ensureAudio = useCallback(() => {
    if (typeof window === "undefined") return null;
    if (mainRef.current && padRef.current) {
      return { main: mainRef.current, pad: padRef.current };
    }
    const main = mainRef.current ?? new Audio();
    const pad = padRef.current ?? new Audio();
    const ogg = preferOgg(main);
    main.loop = true;
    pad.loop = true;
    main.preload = "auto";
    pad.preload = "auto";
    main.volume = 0;
    pad.volume = 0;
    if (!main.src) main.src = ogg ? SAJU_AMBIENT_SRC_OGG : SAJU_AMBIENT_SRC_MP3;
    if (!pad.src) pad.src = ogg ? SAJU_AMBIENT_PAD_OGG : SAJU_AMBIENT_PAD_MP3;
    mainRef.current = main;
    padRef.current = pad;
    return { main, pad };
  }, []);

  const targetVolumes = useCallback(() => {
    if (duckedRef.current) return { main: DUCK_MAIN, pad: DUCK_PAD };
    return { main: TARGET_VOLUME, pad: PAD_VOLUME };
  }, []);

  const rampVolumes = useCallback(
    (toMain: number, toPad: number, then?: () => void) => {
      clearFade();
      const pair = ensureAudio();
      if (!pair) {
        then?.();
        return;
      }
      const fromMain = pair.main.volume;
      const fromPad = pair.pad.volume;
      let step = 0;
      fadeTimerRef.current = setInterval(() => {
        step += 1;
        const t = Math.min(1, step / FADE_STEPS);
        // ease-out cubic
        const e = 1 - (1 - t) ** 3;
        pair.main.volume = Math.max(0, Math.min(1, fromMain + (toMain - fromMain) * e));
        pair.pad.volume = Math.max(0, Math.min(1, fromPad + (toPad - fromPad) * e));
        if (t >= 1) {
          clearFade();
          then?.();
        }
      }, Math.max(16, Math.floor(FADE_MS / FADE_STEPS)));
    },
    [clearFade, ensureAudio],
  );

  const hardStop = useCallback(() => {
    clearFade();
    duckedRef.current = false;
    for (const el of [mainRef.current, padRef.current]) {
      if (!el) continue;
      el.pause();
      el.volume = 0;
      try {
        el.currentTime = 0;
      } catch {
        /* ignore */
      }
    }
  }, [clearFade]);

  const fadeOutAndStop = useCallback(() => {
    duckedRef.current = false;
    rampVolumes(0, 0, () => {
      hardStop();
    });
  }, [hardStop, rampVolumes]);

  const play = useCallback(async () => {
    const pair = ensureAudio();
    if (!pair) return false;
    try {
      pair.main.volume = 0;
      pair.pad.volume = 0;
      await Promise.all([pair.main.play(), pair.pad.play()]);
      const vol = targetVolumes();
      rampVolumes(vol.main, vol.pad);
      setNeedsGesture(false);
      setAwaitingFirstEnable(false);
      writeAmbientPref(true);
      return true;
    } catch {
      setNeedsGesture(true);
      setSoundOn(false);
      wantSoundRef.current = false;
      return false;
    }
  }, [ensureAudio, rampVolumes, targetVolumes]);

  const setVoiceDucking = useCallback(
    (ducked: boolean) => {
      duckedRef.current = ducked;
      if (!wantSoundRef.current && !soundOn) return;
      const pair = ensureAudio();
      if (!pair || pair.main.paused) return;
      const vol = targetVolumes();
      rampVolumes(vol.main, vol.pad);
    },
    [ensureAudio, rampVolumes, soundOn, targetVolumes],
  );

  const toggleSound = useCallback(async () => {
    if (soundOn) {
      wantSoundRef.current = false;
      writeAmbientPref(false);
      setSoundOn(false);
      setNeedsGesture(false);
      fadeOutAndStop();
      return;
    }
    wantSoundRef.current = true;
    setSoundOn(true);
    const ok = await play();
    if (!ok) {
      setSoundOn(false);
      wantSoundRef.current = false;
    }
  }, [fadeOutAndStop, play, soundOn]);

  /** Full-screen / primary gesture enable — same as turning on. */
  const enableFromGesture = useCallback(async () => {
    if (soundOn) return true;
    wantSoundRef.current = true;
    setSoundOn(true);
    const ok = await play();
    if (!ok) {
      setSoundOn(false);
      wantSoundRef.current = false;
    }
    return ok;
  }, [play, soundOn]);

  // Mute with fade when theater becomes inactive (skipped / dismissed)
  useEffect(() => {
    if (!active) {
      wantSoundRef.current = false;
      setSoundOn(false);
      setNeedsGesture(false);
      fadeOutAndStop();
    }
  }, [active, fadeOutAndStop]);

  // Inherit session preference when mounting an active theater (entry → loading)
  useEffect(() => {
    if (!active) return;
    if (!readAmbientPref()) return;
    if (wantSoundRef.current || soundOn) return;
    let cancelled = false;
    (async () => {
      wantSoundRef.current = true;
      setSoundOn(true);
      const ok = await play();
      if (cancelled) return;
      if (!ok) {
        // Autoplay blocked — keep pref, show gesture overlay
        setSoundOn(false);
        wantSoundRef.current = false;
        setNeedsGesture(true);
        setAwaitingFirstEnable(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // intentionally once when becoming active
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // Cleanup on unmount — fade then release
  useEffect(() => {
    return () => {
      clearFade();
      for (const el of [mainRef.current, padRef.current]) {
        if (!el) continue;
        el.pause();
        try {
          el.currentTime = 0;
        } catch {
          /* ignore */
        }
      }
      mainRef.current = null;
      padRef.current = null;
    };
  }, [clearFade]);

  return {
    soundOn,
    needsGesture,
    /** Show full-screen tap target until sound has been enabled once this session. */
    showGestureOverlay: awaitingFirstEnable && !soundOn && active,
    toggleSound,
    enableFromGesture,
    mute: fadeOutAndStop,
    /** Lower ambient bed while character TTS speaks. */
    setVoiceDucking,
  };
}
