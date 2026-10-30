export type TerminalFontSize = 'sm' | 'base' | 'lg';

export interface PreferencesState {
  volume: number; // 0 to 1
  isMuted: boolean;
  crtActive: boolean;
  reducedMotion: boolean;
  terminalFontSize: TerminalFontSize;

  // Actions
  setVolume: (volume: number) => void;
  toggleMute: () => boolean;
  setCrtActive: (active: boolean) => void;
  setReducedMotion: (reduced: boolean) => void;
  setTerminalFontSize: (size: TerminalFontSize) => void;
}
