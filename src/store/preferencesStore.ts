import { create } from 'zustand';
import { PreferencesState, TerminalFontSize } from '../types/preferences';
import { soundManager } from '../audio/soundManager';

const PREFS_STORAGE_KEY = 'rootrange_user_preferences_v1';

function loadStoredPreferences(): Partial<PreferencesState> {
  if (typeof window === 'undefined' || !window.localStorage) return {};
  try {
    const raw = window.localStorage.getItem(PREFS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return {};
}

function savePreferences(state: Partial<PreferencesState>) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export const usePreferencesStore = create<PreferencesState>((set, get) => {
  const stored = loadStoredPreferences();

  // Detect OS reduced motion preference
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const initialVolume = typeof stored.volume === 'number' ? stored.volume : 0.5;
  const initialMuted = typeof stored.isMuted === 'boolean' ? stored.isMuted : false;
  const initialCrt = typeof stored.crtActive === 'boolean' ? stored.crtActive : false;
  const initialMotion = typeof stored.reducedMotion === 'boolean' ? stored.reducedMotion : prefersReducedMotion;
  const initialFontSize: TerminalFontSize = stored.terminalFontSize || 'base';

  // Sync sound manager
  soundManager.setVolume(initialVolume);
  soundManager.setMuted(initialMuted);

  return {
    volume: initialVolume,
    isMuted: initialMuted,
    crtActive: initialCrt,
    reducedMotion: initialMotion,
    terminalFontSize: initialFontSize,

    setVolume: (volume: number) => {
      soundManager.setVolume(volume);
      set({ volume });
      savePreferences({
        ...get(),
        volume,
      });
    },

    toggleMute: () => {
      const isMuted = soundManager.toggleMute();
      set({ isMuted });
      savePreferences({
        ...get(),
        isMuted,
      });
      return isMuted;
    },

    setCrtActive: (crtActive: boolean) => {
      set({ crtActive });
      savePreferences({
        ...get(),
        crtActive,
      });
    },

    setReducedMotion: (reducedMotion: boolean) => {
      set({ reducedMotion });
      savePreferences({
        ...get(),
        reducedMotion,
      });
    },

    setTerminalFontSize: (terminalFontSize: TerminalFontSize) => {
      set({ terminalFontSize });
      savePreferences({
        ...get(),
        terminalFontSize,
      });
    },
  };
});
