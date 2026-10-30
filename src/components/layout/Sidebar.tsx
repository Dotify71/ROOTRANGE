import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Terminal,
  Server,
  Network,
  Globe,
  Bot,
  Briefcase,
  Award,
  BookOpen,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { soundManager } from '../../audio/soundManager';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggleCollapse }) => {
  const { machines, claimedFlags, rank } = useGameStore();

  const totalFlags = machines.length * 2;
  const capturedFlags = claimedFlags.length;

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/range', label: 'Cyber Range', icon: Terminal, badge: 'LIVE' },
    { to: '/machines', label: 'Machines', icon: Server, count: machines.length },
    { to: '/graph', label: 'Attack Graph', icon: Network },
    { to: '/repeater', label: 'Web Repeater', icon: Globe },
    { to: '/ai', label: 'GhostOps AI', icon: Bot, highlight: true },
    { to: '/inventory', label: 'Loot Vault', icon: Briefcase },
    { to: '/achievements', label: 'Achievements', icon: Award },
    { to: '/docs', label: 'Field Manual', icon: BookOpen },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={`h-full bg-[#0a0d14] border-r border-slate-800/80 flex flex-col justify-between transition-all duration-300 font-mono select-none z-30 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Brand & Header */}
      <div>
        <div className="flex items-center justify-between p-3.5 border-b border-slate-800/80">
          {!collapsed ? (
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-extrabold tracking-wider text-white">
                ROOT<span className="text-emerald-400">RANGE</span>
              </span>
            </div>
          ) : (
            <div className="mx-auto">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
          )}

          <button
            onClick={() => {
              soundManager.playKey();
              onToggleCollapse();
            }}
            className="p-1 rounded text-slate-500 hover:text-slate-200 hover:bg-slate-800/60 transition"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-2 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => soundManager.playKey()}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 rounded-lg text-xs font-semibold transition-all group focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                  isActive
                    ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                }`
              }
              title={collapsed ? item.label : undefined}
            >
              <item.icon
                className={`w-4 h-4 shrink-0 transition ${
                  item.highlight ? 'text-cyan-400' : 'text-slate-400 group-hover:text-emerald-400'
                }`}
              />
              {!collapsed && (
                <div className="flex items-center justify-between flex-1 ml-3">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                      {item.badge}
                    </span>
                  )}
                  {item.count !== undefined && (
                    <span className="text-[10px] text-slate-600 font-mono">
                      {item.count}
                    </span>
                  )}
                </div>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Bottom User / Rank Card */}
      {!collapsed ? (
        <div className="p-3 border-t border-slate-800/80 bg-[#070a0f] text-[11px] space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-[10px]">OPERATIVE RANK</span>
            <span className="text-emerald-400 font-bold">{rank}</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-1.5 border border-slate-800 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (capturedFlags / totalFlags) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>FLAGS: {capturedFlags}/{totalFlags}</span>
            <span className="text-slate-400">10.10.14.22</span>
          </div>
        </div>
      ) : (
        <div className="p-2 border-t border-slate-800/80 text-center">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
        </div>
      )}
    </aside>
  );
};
