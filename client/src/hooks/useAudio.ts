import { useRef, useCallback, useEffect, useState } from "react";

const VOLUME_KEY = "webware-volume";

function getSavedVolume(): number {
  const saved = localStorage.getItem(VOLUME_KEY);
  return saved ? Number(saved) : 0.5;
}

export function useAudio() {
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const [volume, setVolumeState] = useState(getSavedVolume);

  useEffect(() => {
    const audio = new Audio("/audio/music.mp3");
    audio.loop = true;
    audio.volume = getSavedVolume();
    musicRef.current = audio;
    return () => {
      audio.pause();
      if (musicRef.current === audio) {
        musicRef.current = null;
      }
    };
  }, []);

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    localStorage.setItem(VOLUME_KEY, String(v));
    if (musicRef.current) {
      musicRef.current.volume = v;
    }
  }, []);

  const playMusic = useCallback((rate = 1) => {
    const m = musicRef.current;
    if (!m) return;
    m.playbackRate = rate;
    m.play().catch(() => {
      // autoplay blocked
    });
  }, []);

  const stopMusic = useCallback(() => {
    musicRef.current?.pause();
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    if (musicRef.current) {
      musicRef.current.playbackRate = rate;
    }
  }, []);

  const playSfx = useCallback(
    (src: string) => {
      const sfx = new Audio(src);
      sfx.volume = volume;
      sfx.play().catch(() => {});
    },
    [volume],
  );

  return { volume, setVolume, playMusic, stopMusic, setPlaybackRate, playSfx };
}
