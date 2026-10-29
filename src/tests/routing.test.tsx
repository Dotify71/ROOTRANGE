import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { DashboardPage } from '../pages/DashboardPage';
import { MachinesPage } from '../pages/MachinesPage';
import { InventoryPage } from '../pages/InventoryPage';
import { AchievementsPage } from '../pages/AchievementsPage';
import { DocumentationPage } from '../pages/DocumentationPage';
import { SettingsPage } from '../pages/SettingsPage';

describe('ROOTRANGE Navigation & Routing Engine', () => {
  it('renders the Dashboard route on index path', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<AppShell />}>
            <Route index element={<DashboardPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/ROOTRANGE \/\/ OFFENSIVE CYBER WORKSTATION/i)).toBeInTheDocument();
    expect(screen.getByText(/LAUNCH PWNBOX/i)).toBeInTheDocument();
  });

  it('renders the Machines catalog route', () => {
    render(
      <MemoryRouter initialEntries={['/machines']}>
        <Routes>
          <Route path="/" element={<AppShell />}>
            <Route path="machines" element={<MachinesPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/SIMULATED TARGET MACHINES CATALOG/i)).toBeInTheDocument();
  });

  it('renders the Inventory route', () => {
    render(
      <MemoryRouter initialEntries={['/inventory']}>
        <Routes>
          <Route path="/" element={<AppShell />}>
            <Route path="inventory" element={<InventoryPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/LOOT VAULT & EXFILTRATED ARTIFACTS/i)).toBeInTheDocument();
  });

  it('renders the Achievements route', () => {
    render(
      <MemoryRouter initialEntries={['/achievements']}>
        <Routes>
          <Route path="/" element={<AppShell />}>
            <Route path="achievements" element={<AchievementsPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/OPERATIVE BADGES & MILESTONES/i)).toBeInTheDocument();
  });

  it('renders the Documentation Field Manual route', () => {
    render(
      <MemoryRouter initialEntries={['/docs']}>
        <Routes>
          <Route path="/" element={<AppShell />}>
            <Route path="docs" element={<DocumentationPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/ROOTRANGE FIELD MANUAL & OFFENSIVE PLAYBOOKS/i)).toBeInTheDocument();
  });

  it('renders the Settings route', () => {
    render(
      <MemoryRouter initialEntries={['/settings']}>
        <Routes>
          <Route path="/" element={<AppShell />}>
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/WORKSTATION & RANGE CONFIGURATION/i)).toBeInTheDocument();
  });
});
