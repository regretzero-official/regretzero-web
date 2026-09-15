"use client";

import { useCallback, useEffect, useRef } from "react";

import type { SajuCharacterId } from "@/features/saju-chat/types";
import type {
  SajuEntryBeatId,
  SajuEntryContent,
} from "@/features/saju-report/entry-experience";
import type { SajuLandingSlug } from "@/features/saju-report/product-landings";
import { useTheaterAmbient } from "@/features/saju-report/hooks/use-theater-ambient";
import {
  getSfxForEntryBeat,
  LOADING_THEATER_SFX,
  THEATER_SFX_SRC,
  THEATER_VOICE_AUTOPLAY_ENABLED,
  type TheaterSfxId,
} from "@/features/saju-report/theater-audio";

function preferOgg(el: HTMLAudioElement) {
  return (
    typeof el.canPlayType === "function" &&
    el.canPlayType('audio/ogg; codecs="vorbis"') !== ""
  );
}

function sfxSrc(id: TheaterSfxId, ogg: boolean) {
  const pair = THEATER_SFX_SRC[id];
  return ogg ? pair.ogg : pair.mp3;
}

type EntryFields = {
  beat: SajuEntryBeatId;
  entry: Pick<SajuEntryContent, "shrineLine" | "lines" | "inviteLine">;
  slug: SajuLandingSlug;
};

type LoadingFields = {
  loadingLine: string;
};

export type TheaterAudioDirectorOpts = {
  active: boolean;
  characterId: SajuCharacterId | string | null | undefined;
} & (
  | ({ mode: "entry" } & EntryFields)
  | ({ mode: "loading" } & LoadingFields)
);

/**
 * Theater audio director: character-specific warm ambient bed + light scene SFX.
 * Character TTS / voice mp3 autoplay is disabled (BGM-only pivot).
 */
export function useTheaterAudioDirector(opts: TheaterAudioDirectorOpts) {
  const ambient = useTheaterAmbient(opts.active, opts.characterId);
  const { soundOn, mute: ambientMute } = ambient;

  const sfxPoolRef = useRef<Partial<Record<TheaterSfxId, HTMLAudioElement>>>({});
  const lastBeatRef = useRef<SajuEntryBeatId | null>(null);
  const loadingFiredRef = useRef(false);

  const mode = opts.mode;
  const beat = mode === "entry" ? opts.beat : null;

  const playSfx = useCallback(
    async (id: TheaterSfxId) => {
      if (!soundOn || typeof window === "undefined") return;
      try {
        let el = sfxPoolRef.current[id];
        if (!el) {
          el = new Audio();
          el.preload = "auto";
          el.src = sfxSrc(id, preferOgg(el));
          sfxPoolRef.current[id] = el;
        }
        // Keep one-shots soft under the character bed
        el.volume = 0.38;
        el.currentTime = 0;
        await el.play();
      } catch {
        /* autoplay / decode — ignore; UI must not break */
      }
    },
    [soundOn],
  );

  // Entry: beat change → light SFX only (no voice)
  useEffect(() => {
    if (mode !== "entry" || !beat) return;
    if (!opts.active || !soundOn) return;

    if (lastBeatRef.current === beat) return;
    lastBeatRef.current = beat;

    void playSfx(getSfxForEntryBeat(beat));
  }, [beat, mode, opts.active, playSfx, soundOn]);

  // Loading: soft enter SFX once when sound is on (no voice line)
  useEffect(() => {
    if (mode !== "loading") return;
    if (!opts.active || !soundOn) return;
    if (loadingFiredRef.current) return;
    loadingFiredRef.current = true;

    void playSfx(LOADING_THEATER_SFX);
    // THEATER_VOICE_AUTOPLAY_ENABLED gates any future voice re-enable
    if (THEATER_VOICE_AUTOPLAY_ENABLED) {
      /* intentionally empty — voice disabled */
    }
  }, [mode, opts.active, playSfx, soundOn]);

  // When sound turns off, stop one-shots; allow replay on re-enable
  useEffect(() => {
    if (!soundOn) {
      lastBeatRef.current = null;
      loadingFiredRef.current = false;
      for (const el of Object.values(sfxPoolRef.current)) {
        if (!el) continue;
        el.pause();
      }
    }
  }, [soundOn]);

  // Inactive reset + unmount cleanup
  useEffect(() => {
    if (!opts.active) {
      lastBeatRef.current = null;
      loadingFiredRef.current = false;
    }
  }, [opts.active]);

  useEffect(() => {
    return () => {
      for (const el of Object.values(sfxPoolRef.current)) {
        if (!el) continue;
        el.pause();
        try {
          el.currentTime = 0;
        } catch {
          /* ignore */
        }
      }
      sfxPoolRef.current = {};
    };
  }, []);

  const mute = useCallback(() => {
    ambientMute();
  }, [ambientMute]);

  return {
    ...ambient,
    mute,
    playSfx,
  };
}
