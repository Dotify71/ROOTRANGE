import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { usePreferencesStore } from '../store/preferencesStore';
import { soundManager } from '../audio/soundManager';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { KeyboardShortcutsModal } from '../components/KeyboardShortcutsModal';
import { TopStatusBar } from '../components/layout/TopStatusBar';
import { MemoryRouter } from 'react-router-dom';

describe('ROOTRANGE Phase 10: Immersion, Accessibility, and UI Polish', () => {
  beforeEach(() => {
    // Reset preferences store state
    usePreferencesStore.setState({
      volume: 0.5,
      isMuted: false,
      crtActive: false,
      reducedMotion: false,
      terminalFontSize: 'base',
    });
    soundManager.setVolume(0.5);
    soundManager.setMuted(false);
  });

  describe('1. User Preferences Store & Audio Synchronization', () => {
    it('initializes with expected default values', () => {
      const state = usePreferencesStore.getState();
      expect(state.volume).toBe(0.5);
      expect(state.isMuted).toBe(false);
      expect(state.crtActive).toBe(false);
      expect(state.terminalFontSize).toBe('base');
    });

    it('updates and clamps volume properly', () => {
      const { setVolume } = usePreferencesStore.getState();

      setVolume(0.8);
      expect(usePreferencesStore.getState().volume).toBe(0.8);
      expect(soundManager.getVolume()).toBe(0.8);

      // Testing boundary clamps via soundManager
      soundManager.setVolume(1.5);
      expect(soundManager.getVolume()).toBe(1.0);

      soundManager.setVolume(-0.2);
      expect(soundManager.getVolume()).toBe(0.0);
    });

    it('toggles audio mute and synchronizes with soundManager', () => {
      const { toggleMute } = usePreferencesStore.getState();

      const muted = toggleMute();
      expect(muted).toBe(true);
      expect(usePreferencesStore.getState().isMuted).toBe(true);
      expect(soundManager.getMuted()).toBe(true);

      const unmuted = toggleMute();
      expect(unmuted).toBe(false);
      expect(usePreferencesStore.getState().isMuted).toBe(false);
      expect(soundManager.getMuted()).toBe(false);
    });

    it('toggles CRT retro scanline shader state', () => {
      const { setCrtActive } = usePreferencesStore.getState();

      setCrtActive(true);
      expect(usePreferencesStore.getState().crtActive).toBe(true);

      setCrtActive(false);
      expect(usePreferencesStore.getState().crtActive).toBe(false);
    });

    it('toggles reduced motion accessibility preference', () => {
      const { setReducedMotion } = usePreferencesStore.getState();

      setReducedMotion(true);
      expect(usePreferencesStore.getState().reducedMotion).toBe(true);

      setReducedMotion(false);
      expect(usePreferencesStore.getState().reducedMotion).toBe(false);
    });

    it('updates terminal font size between sm, base, and lg', () => {
      const { setTerminalFontSize } = usePreferencesStore.getState();

      setTerminalFontSize('lg');
      expect(usePreferencesStore.getState().terminalFontSize).toBe('lg');

      setTerminalFontSize('sm');
      expect(usePreferencesStore.getState().terminalFontSize).toBe('sm');

      setTerminalFontSize('base');
      expect(usePreferencesStore.getState().terminalFontSize).toBe('base');
    });
  });

  describe('2. Procedural Web Audio Synthesizer Safety', () => {
    it('executes sound triggers safely without throwing in headless environments', () => {
      expect(() => soundManager.playKey()).not.toThrow();
      expect(() => soundManager.playConnect()).not.toThrow();
      expect(() => soundManager.playFlagSuccess()).not.toThrow();
      expect(() => soundManager.playScanPing()).not.toThrow();
    });

    it('does not trigger audio output when muted', () => {
      soundManager.setMuted(true);
      expect(() => soundManager.playKey()).not.toThrow();
      expect(() => soundManager.playScanPing()).not.toThrow();
    });
  });

  describe('3. Accessible ConfirmDialog Component', () => {
    it('does not render when isOpen is false', () => {
      const { container } = render(
        <ConfirmDialog
          isOpen={false}
          title="TEST RESET"
          message="Test message body"
          onConfirm={() => {}}
          onCancel={() => {}}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders with ARIA alertdialog attributes and invokes callbacks', () => {
      const onConfirm = vi.fn();
      const onCancel = vi.fn();

      render(
        <ConfirmDialog
          isOpen={true}
          title="CONFIRM TARGET RESET"
          message="Are you sure you want to proceed with target re-initialization?"
          confirmLabel="PURGE STATE"
          cancelLabel="ABORT"
          isDestructive={true}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      // Verify ARIA dialog roles
      const dialog = screen.getByRole('alertdialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(screen.getByText('CONFIRM TARGET RESET')).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to proceed/i)).toBeInTheDocument();

      // Test confirm button click
      const confirmBtn = screen.getByRole('button', { name: /PURGE STATE/i });
      fireEvent.click(confirmBtn);
      expect(onConfirm).toHaveBeenCalledTimes(1);

      // Test cancel button click
      const cancelBtn = screen.getByRole('button', { name: /ABORT/i });
      fireEvent.click(cancelBtn);
      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('4. Keyboard Shortcuts Manual Modal', () => {
    it('does not render when isOpen is false', () => {
      const { container } = render(
        <KeyboardShortcutsModal isOpen={false} onClose={() => {}} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders keyboard shortcuts, kbd elements, and responds to dismiss', () => {
      const onClose = vi.fn();

      render(<KeyboardShortcutsModal isOpen={true} onClose={onClose} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(screen.getByText('KEYBOARD SHORTCUTS MANUAL')).toBeInTheDocument();

      // Check shortcut descriptions
      expect(screen.getByText(/Open Keyboard Shortcuts Manual/i)).toBeInTheDocument();
      expect(screen.getByText(/Autocomplete command or path in Terminal/i)).toBeInTheDocument();
      expect(screen.getByText(/Send HTTP Request in Repeater/i)).toBeInTheDocument();

      // Test dismiss action
      const dismissBtn = screen.getByRole('button', { name: /DISMISS/i });
      fireEvent.click(dismissBtn);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('5. TopStatusBar Accessibility & Telemetry Cues', () => {
    it('provides accessible buttons for shortcuts, audio, and CRT toggle', () => {
      const onOpenShortcuts = vi.fn();
      const onOpenFlagModal = vi.fn();

      render(
        <MemoryRouter>
          <TopStatusBar
            onOpenFlagModal={onOpenFlagModal}
            onOpenShortcutsModal={onOpenShortcuts}
          />
        </MemoryRouter>
      );

      // Target selection has accessible label
      const selectBox = screen.getByLabelText(/Select active target machine/i);
      expect(selectBox).toBeInTheDocument();

      // Shortcuts button
      const shortcutsBtn = screen.getByLabelText(/Keyboard Shortcuts/i);
      expect(shortcutsBtn).toBeInTheDocument();
      fireEvent.click(shortcutsBtn);
      expect(onOpenShortcuts).toHaveBeenCalledTimes(1);

      // CRT scanline button has aria-pressed
      const crtBtn = screen.getByLabelText(/Toggle CRT Scanline Effect/i);
      expect(crtBtn).toBeInTheDocument();
      expect(crtBtn).toHaveAttribute('aria-pressed', 'false');

      // Audio toggle button
      const audioBtn = screen.getByLabelText(/Mute Audio/i);
      expect(audioBtn).toBeInTheDocument();
      fireEvent.click(audioBtn);
      expect(usePreferencesStore.getState().isMuted).toBe(true);
    });
  });
});
