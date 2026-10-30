import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopStatusBar } from './TopStatusBar';
import { FlagSubmissionModal } from '../FlagSubmissionModal';
import { KeyboardShortcutsModal } from '../KeyboardShortcutsModal';
import { usePreferencesStore } from '../../store/preferencesStore';

export const AppShell: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [isFlagModalOpen, setIsFlagModalOpen] = useState<boolean>(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState<boolean>(false);

  const { crtActive, reducedMotion } = usePreferencesStore();

  // Listen for global keyboard shortcuts (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsShortcutsModalOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsShortcutsModalOpen(false);
        setIsFlagModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      className={`flex h-screen w-screen bg-[#070a0f] text-slate-200 select-none overflow-hidden font-mono relative ${
        reducedMotion ? 'motion-reduce' : ''
      }`}
    >
      {/* CRT Scanline Overlay FX */}
      {crtActive && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-50 opacity-20 mix-blend-overlay"
          style={{
            backgroundImage:
              'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.5) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.03), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.03))',
            backgroundSize: '100% 3px, 6px 100%',
          }}
        />
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <TopStatusBar
          onOpenFlagModal={() => setIsFlagModalOpen(true)}
          onOpenShortcutsModal={() => setIsShortcutsModalOpen(true)}
        />

        <main className="flex-1 overflow-hidden p-2 relative bg-[#0a0d14]">
          <Outlet />
        </main>
      </div>

      {/* Flag Submission Modal */}
      <FlagSubmissionModal
        isOpen={isFlagModalOpen}
        onClose={() => setIsFlagModalOpen(false)}
      />

      {/* Keyboard Shortcuts Manual Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />
    </div>
  );
};
