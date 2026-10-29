import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { CyberRangePage } from './pages/CyberRangePage';
import { MachinesPage } from './pages/MachinesPage';
import { MachineDetailPage } from './pages/MachineDetailPage';
import { AttackGraphPage } from './pages/AttackGraphPage';
import { WebRepeaterPage } from './pages/WebRepeaterPage';
import { GhostOpsAiPage } from './pages/GhostOpsAiPage';
import { InventoryPage } from './pages/InventoryPage';
import { AchievementsPage } from './pages/AchievementsPage';
import { DocumentationPage } from './pages/DocumentationPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="range" element={<CyberRangePage />} />
          <Route path="machines" element={<MachinesPage />} />
          <Route path="machines/:id" element={<MachineDetailPage />} />
          <Route path="graph" element={<AttackGraphPage />} />
          <Route path="repeater" element={<WebRepeaterPage />} />
          <Route path="ai" element={<GhostOpsAiPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="achievements" element={<AchievementsPage />} />
          <Route path="docs" element={<DocumentationPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
