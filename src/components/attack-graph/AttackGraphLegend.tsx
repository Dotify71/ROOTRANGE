import React from 'react';
import {
  Lock,
  Radar,
  Radio,
  AlertTriangle,
  Terminal,
  Key,
  Skull,
  CheckCircle2,
  Network,
  Server,
  ShieldAlert,
  X,
} from 'lucide-react';

export interface AttackGraphLegendProps {
  onClose: () => void;
}

export const AttackGraphLegend: React.FC<AttackGraphLegendProps> = ({ onClose }) => {
  const states = [
    {
      label: 'UNKNOWN / LOCKED',
      desc: 'Target hidden behind unbreached pivot; IP, ports and CVEs redacted.',
      icon: Lock,
      color: 'text-slate-500',
      badgeBg: 'bg-slate-800 text-slate-400 border-slate-700',
    },
    {
      label: 'DISCOVERED',
      desc: 'Discovered through network reconnaissance/scan; no exploit verified.',
      icon: Radar,
      color: 'text-slate-300',
      badgeBg: 'bg-slate-800 text-slate-300 border-slate-600',
    },
    {
      label: 'REACHABLE',
      desc: 'Network route is reachable from attacker pwnbox or active pivot host.',
      icon: Radio,
      color: 'text-cyan-400',
      badgeBg: 'bg-cyan-950 text-cyan-300 border-cyan-700',
    },
    {
      label: 'VULNERABLE',
      desc: 'Open vulnerable services or confirmed CVEs (e.g. Log4Shell, SQLi).',
      icon: AlertTriangle,
      color: 'text-amber-400',
      badgeBg: 'bg-amber-950 text-amber-300 border-amber-600',
    },
    {
      label: 'FOOTHOLD (USER)',
      desc: 'Low-privilege session or initial user access established on host.',
      icon: Terminal,
      color: 'text-yellow-400',
      badgeBg: 'bg-yellow-950 text-yellow-300 border-yellow-500',
    },
    {
      label: 'PRIVILEGED',
      desc: 'Privilege escalation objective achieved (sudoers, cron, or DA hash).',
      icon: Key,
      color: 'text-purple-400',
      badgeBg: 'bg-purple-950 text-purple-300 border-purple-500',
    },
    {
      label: 'COMPROMISED (ROOT)',
      desc: 'Full root or NT AUTHORITY\\SYSTEM access confirmed by simulation.',
      icon: Skull,
      color: 'text-red-400',
      badgeBg: 'bg-red-950 text-red-300 border-red-500',
    },
    {
      label: 'CHALLENGE COMPLETE',
      desc: 'All training objectives completed and both user/root flags submitted.',
      icon: CheckCircle2,
      color: 'text-emerald-400',
      badgeBg: 'bg-emerald-950 text-emerald-300 border-emerald-400 font-bold',
    },
  ];

  return (
    <div className="absolute top-20 left-4 z-30 w-80 max-h-[85vh] overflow-y-auto rounded-xl bg-[#090d15]/95 border border-slate-800 p-4 font-mono text-xs shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
        <span className="font-bold text-slate-100 tracking-wider text-[11px] uppercase flex items-center gap-1.5">
          <Network className="w-4 h-4 text-emerald-400" />
          <span>ATTACK GRAPH TOPOLOGY LEGEND</span>
        </span>
        <button
          onClick={onClose}
          className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          title="Close legend"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Node States */}
      <div className="space-y-2 mb-4">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
          // NODE COMPROMISE STATES (8 LEVELS)
        </span>
        {states.map((st, i) => {
          const Icon = st.icon;
          return (
            <div
              key={i}
              className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded border text-[9px] font-bold flex items-center gap-1 ${st.badgeBg}`}>
                  <Icon className="w-3 h-3" />
                  <span>{st.label}</span>
                </span>
              </div>
              <p className="text-slate-400 text-[10px] leading-tight">{st.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Edge Styles */}
      <div className="space-y-2 border-t border-slate-800 pt-3 mb-4">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
          // DIRECTED PIVOT EDGES
        </span>
        <div className="space-y-1.5 text-[10px]">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="w-6 border-b-2 border-dashed border-slate-600 inline-block" />
            <span>LOCKED / UNREACHABLE PIVOT BOUNDARY</span>
          </div>
          <div className="flex items-center gap-2 text-cyan-400">
            <span className="w-6 border-b-2 border-cyan-400 inline-block" />
            <span>ACTIVE ROUTE / TRANSIT SUBWAY</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <span className="w-6 border-b-2 border-emerald-400 inline-block shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            <span>COMPROMISED PIVOT TUNNEL (OWNED)</span>
          </div>
        </div>
      </div>

      {/* Node Roles */}
      <div className="space-y-1.5 border-t border-slate-800 pt-3">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
          // TOPOLOGY NODE ROLES
        </span>
        <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-300">
          <div className="flex items-center gap-1.5 p-1.5 rounded bg-slate-900/80 border border-slate-800">
            <Network className="w-3.5 h-3.5 text-cyan-400" />
            <span>Gateway</span>
          </div>
          <div className="flex items-center gap-1.5 p-1.5 rounded bg-slate-900/80 border border-slate-800">
            <Radio className="w-3.5 h-3.5 text-purple-400" />
            <span>Pivot Router</span>
          </div>
          <div className="flex items-center gap-1.5 p-1.5 rounded bg-slate-900/80 border border-slate-800">
            <Server className="w-3.5 h-3.5 text-emerald-400" />
            <span>Target Host</span>
          </div>
          <div className="flex items-center gap-1.5 p-1.5 rounded bg-slate-900/80 border border-slate-800">
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            <span>Domain Controller</span>
          </div>
        </div>
      </div>
    </div>
  );
};
