import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import {
  Server,
  Network,
  ShieldAlert,
  Skull,
  Lock,
  Terminal,
  Radio,
  AlertTriangle,
  CheckCircle2,
  Key,
  Radar,
} from 'lucide-react';
import { AttackGraphNodeData, AttackGraphNodeState } from '../../types/attackGraph';

export const AttackGraphNodeComponent: React.FC<NodeProps<AttackGraphNodeData>> = ({
  data,
  selected,
}) => {
  const {
    displayIp,
    displayName,
    subnet,
    type,
    state,
    os,
    difficulty,
    discoveredPorts,
    totalPortsCount,
    userFlagClaimed,
    rootFlagClaimed,
    completedObjectivesCount,
    totalObjectivesCount,
    isTargetedInPwnbox,
    isFogOfWar,
  } = data;

  const getStateMeta = (nodeState: AttackGraphNodeState) => {
    switch (nodeState) {
      case 'unknown':
        return {
          label: 'UNKNOWN / LOCKED',
          color: 'text-slate-500',
          bg: 'bg-slate-900/90 border-slate-800',
          badgeBg: 'bg-slate-800 text-slate-400 border-slate-700',
          glow: '',
          icon: Lock,
        };
      case 'discovered':
        return {
          label: 'DISCOVERED',
          color: 'text-slate-300',
          bg: 'bg-[#0e141f] border-slate-700',
          badgeBg: 'bg-slate-800 text-slate-300 border-slate-600',
          glow: 'shadow-[0_0_15px_rgba(100,116,139,0.2)]',
          icon: Radar,
        };
      case 'reachable':
        return {
          label: 'REACHABLE',
          color: 'text-cyan-400',
          bg: 'bg-[#091522] border-cyan-800/80',
          badgeBg: 'bg-cyan-950 text-cyan-300 border-cyan-700',
          glow: 'shadow-[0_0_18px_rgba(6,182,212,0.2)]',
          icon: Radio,
        };
      case 'vulnerable':
        return {
          label: 'VULNERABLE',
          color: 'text-amber-400',
          bg: 'bg-[#1b1509] border-amber-700/80',
          badgeBg: 'bg-amber-950 text-amber-300 border-amber-600',
          glow: 'shadow-[0_0_20px_rgba(245,158,11,0.25)]',
          icon: AlertTriangle,
        };
      case 'initial-access':
        return {
          label: 'FOOTHOLD (USER)',
          color: 'text-yellow-400',
          bg: 'bg-[#1a1705] border-yellow-500/80',
          badgeBg: 'bg-yellow-950 text-yellow-300 border-yellow-500',
          glow: 'shadow-[0_0_22px_rgba(234,179,8,0.3)]',
          icon: Terminal,
        };
      case 'privileged':
        return {
          label: 'PRIVILEGED',
          color: 'text-purple-400',
          bg: 'bg-[#180d24] border-purple-600/80',
          badgeBg: 'bg-purple-950 text-purple-300 border-purple-500',
          glow: 'shadow-[0_0_22px_rgba(168,85,247,0.3)]',
          icon: Key,
        };
      case 'compromised':
        return {
          label: 'COMPROMISED (ROOT)',
          color: 'text-red-400',
          bg: 'bg-[#21090c] border-red-600/90',
          badgeBg: 'bg-red-950 text-red-300 border-red-500 animate-pulse',
          glow: 'shadow-[0_0_25px_rgba(239,68,68,0.35)]',
          icon: Skull,
        };
      case 'completed':
        return {
          label: 'CHALLENGE COMPLETE',
          color: 'text-emerald-400',
          bg: 'bg-[#061c14] border-emerald-500',
          badgeBg: 'bg-emerald-950 text-emerald-300 border-emerald-400 font-bold',
          glow: 'shadow-[0_0_25px_rgba(16,185,129,0.35)]',
          icon: CheckCircle2,
        };
    }
  };

  const meta = getStateMeta(state);
  const StateIcon = meta.icon;

  const getNodeTypeIcon = () => {
    switch (type) {
      case 'gateway':
        return <Network className="w-4 h-4 text-cyan-400" />;
      case 'pivot':
        return <Radio className="w-4 h-4 text-purple-400" />;
      case 'dc':
        return <ShieldAlert className="w-4 h-4 text-red-400" />;
      default:
        return <Server className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Network node ${displayName}, IP ${displayIp}, status ${meta.label}`}
      className={`w-72 rounded-xl border p-4 text-xs font-mono transition-all duration-200 select-none relative backdrop-blur-md ${
        meta.bg
      } ${meta.glow} ${
        selected ? 'ring-2 ring-emerald-400 border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.4)]' : ''
      } ${isFogOfWar ? 'opacity-80' : 'opacity-100'}`}
    >
      {/* React Flow Connection Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-slate-700 !border-2 !border-slate-400"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-slate-700 !border-2 !border-slate-400"
      />

      {/* Active Pwnbox Target Glow Badge */}
      {isTargetedInPwnbox && (
        <div className="absolute -top-3 left-4 px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider bg-emerald-500 text-black flex items-center gap-1 shadow-lg shadow-emerald-500/50">
          <Terminal className="w-3 h-3" />
          <span>ACTIVE TARGET</span>
        </div>
      )}

      {/* Top Header: Role Icon + Status Badge */}
      <div className="flex items-center justify-between gap-2 mb-2 pt-1">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
            {getNodeTypeIcon()}
          </div>
          <span className="text-[10px] text-slate-400 font-semibold tracking-wide uppercase">
            {type === 'gateway' ? 'GATEWAY' : type === 'pivot' ? 'PIVOT' : type === 'dc' ? 'DOMAIN CONTROLLER' : 'TARGET'}
          </span>
        </div>

        <span
          className={`px-2 py-0.5 rounded border text-[9px] font-bold flex items-center gap-1 tracking-wider ${meta.badgeBg}`}
        >
          <StateIcon className="w-3 h-3" />
          <span>{meta.label}</span>
        </span>
      </div>

      {/* Machine Name & IP */}
      <div className="mb-3">
        <div className="text-sm font-bold text-slate-100 truncate" title={displayName}>
          {displayName}
        </div>
        <div className="text-[11px] font-mono font-bold text-slate-400 flex items-center gap-1.5 mt-0.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
          <span>{displayIp}</span>
          {difficulty && !isFogOfWar && (
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-normal">
              {difficulty}
            </span>
          )}
        </div>
      </div>

      {/* Subnet Badge */}
      <div className="text-[10px] text-slate-400 truncate bg-slate-950/70 rounded px-2 py-1 border border-slate-800/80 mb-3">
        {subnet}
      </div>

      {/* Specs / Open Ports Count */}
      <div className="grid grid-cols-2 gap-2 text-[10px] mb-3">
        <div className="bg-slate-950/50 rounded p-1.5 border border-slate-800/60">
          <span className="text-slate-500 block text-[8px] uppercase">OPERATING SYS</span>
          <span className="text-slate-200 font-bold truncate block">{os || (isFogOfWar ? '[HIDDEN]' : 'Unknown')}</span>
        </div>
        <div className="bg-slate-950/50 rounded p-1.5 border border-slate-800/60">
          <span className="text-slate-500 block text-[8px] uppercase">OPEN PORTS</span>
          <span className="text-cyan-400 font-bold block">
            {isFogOfWar ? 'Locked' : `${discoveredPorts.length}/${totalPortsCount} Seen`}
          </span>
        </div>
      </div>

      {/* Objectives Progress Bar (if target machine) */}
      {totalObjectivesCount > 0 && (
        <div className="space-y-1 mb-2">
          <div className="flex justify-between text-[9px] text-slate-400">
            <span>OBJECTIVES</span>
            <span className="font-bold text-slate-200">
              {completedObjectivesCount} / {totalObjectivesCount}
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                state === 'completed'
                  ? 'bg-emerald-400'
                  : state === 'compromised'
                  ? 'bg-red-400'
                  : state === 'privileged'
                  ? 'bg-purple-400'
                  : state === 'initial-access'
                  ? 'bg-yellow-400'
                  : 'bg-cyan-400'
              }`}
              style={{
                width: `${(completedObjectivesCount / totalObjectivesCount) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Flags Status Row */}
      {totalObjectivesCount > 0 && (
        <div className="flex items-center justify-between text-[9px] pt-1 border-t border-slate-800/60">
          <span className="flex items-center gap-1 text-slate-400">
            <span
              className={`w-2 h-2 rounded-full ${
                userFlagClaimed ? 'bg-amber-400' : 'bg-slate-700'
              }`}
            />
            <span>USER {userFlagClaimed ? 'CLAIMED' : 'UNCLAIMED'}</span>
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <span
              className={`w-2 h-2 rounded-full ${
                rootFlagClaimed ? 'bg-red-500 animate-pulse' : 'bg-slate-700'
              }`}
            />
            <span>ROOT {rootFlagClaimed ? 'PWNED' : 'LOCKED'}</span>
          </span>
        </div>
      )}
    </div>
  );
};
