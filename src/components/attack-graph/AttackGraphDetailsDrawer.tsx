import React from 'react';
import {
  Server,
  ShieldCheck,
  Skull,
  Lock,
  Terminal,
  ArrowRight,
  ExternalLink,
  X,
  CheckCircle2,
  AlertTriangle,
  Key,
  Radio,
} from 'lucide-react';
import { AttackGraphNodeData } from '../../types/attackGraph';
import { EvidenceItem } from '../../simulation/types';

export interface AttackGraphDetailsDrawerProps {
  nodeData: AttackGraphNodeData | null;
  evidence: EvidenceItem[];
  activeMachineId: string;
  onTargetMachine: (machineId: string) => void;
  onNavigateToMachine: (machineId: string) => void;
  onClose: () => void;
}

export const AttackGraphDetailsDrawer: React.FC<AttackGraphDetailsDrawerProps> = ({
  nodeData,
  evidence,
  activeMachineId,
  onTargetMachine,
  onNavigateToMachine,
  onClose,
}) => {
  if (!nodeData) return null;

  const {
    id,
    displayIp,
    displayName,
    subnet,
    type,
    state,
    os,
    difficulty,
    points,
    discoveredPorts,
    totalPortsCount,
    knownCves,
    userFlagClaimed,
    rootFlagClaimed,
    isFogOfWar,
    description,
  } = nodeData;

  const machineEvidence = evidence.filter((e) => e.machineId === id);
  const isTargetable = type === 'target' || type === 'dc';

  return (
    <div className="w-80 lg:w-96 border-l border-slate-800 bg-[#090d16]/95 flex flex-col justify-between font-mono text-xs z-20 backdrop-blur-md shadow-2xl overflow-y-auto">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 sticky top-0 z-10 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-slate-200 tracking-wider text-[11px] uppercase">
            // NODE FORENSICS
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-emerald-400 font-bold">
            {displayIp}
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            title="Close panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content Body */}
      <div className="p-5 space-y-4 flex-1 overflow-y-auto">
        {/* Title & Description */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-bold text-white truncate">{displayName}</h3>
            {difficulty && !isFogOfWar && (
              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-900 border border-slate-800 text-emerald-400">
                {difficulty}
              </span>
            )}
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">
            {description || 'Internal network infrastructure node.'}
          </p>
        </div>

        {/* Status Alert Banner */}
        <div
          className={`p-3 rounded-lg border text-[11px] ${
            state === 'completed'
              ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300'
              : state === 'compromised'
              ? 'bg-red-950/30 border-red-500/50 text-red-300'
              : state === 'privileged'
              ? 'bg-purple-950/30 border-purple-500/50 text-purple-300'
              : state === 'initial-access'
              ? 'bg-yellow-950/30 border-yellow-500/50 text-yellow-300'
              : state === 'vulnerable'
              ? 'bg-amber-950/30 border-amber-500/50 text-amber-300'
              : state === 'reachable'
              ? 'bg-cyan-950/30 border-cyan-500/50 text-cyan-300'
              : state === 'discovered'
              ? 'bg-slate-900 border-slate-700 text-slate-300'
              : 'bg-slate-950 border-slate-800 text-slate-500'
          }`}
        >
          <div className="font-bold flex items-center gap-1.5 uppercase tracking-wider text-[10px] mb-0.5">
            {state === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
            {state === 'compromised' && <Skull className="w-3.5 h-3.5 text-red-400" />}
            {state === 'privileged' && <Key className="w-3.5 h-3.5 text-purple-400" />}
            {state === 'initial-access' && <Terminal className="w-3.5 h-3.5 text-yellow-400" />}
            {state === 'vulnerable' && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
            {state === 'reachable' && <Radio className="w-3.5 h-3.5 text-cyan-400" />}
            {state === 'unknown' && <Lock className="w-3.5 h-3.5 text-slate-500" />}
            <span>STATUS: {state.toUpperCase().replace('-', ' ')}</span>
          </div>
          <div className="text-[10px] leading-tight">
            {state === 'unknown' && 'Isolated target behind uncompromised pivot. Upstream penetration required to reveal.'}
            {state === 'reachable' && 'Target responds to network routing. Run nmap to discover running services.'}
            {state === 'discovered' && 'Services enumerated. Investigate ports and endpoints for vulnerability vectors.'}
            {state === 'vulnerable' && 'Exploit vector identified. Establish initial user shell or token bypass.'}
            {state === 'initial-access' && 'Low-privilege session established. Enumerate local filesystem for privesc vectors.'}
            {state === 'privileged' && 'Elevated privilege state attained. Finalize root capture.'}
            {state === 'compromised' && 'Root / Administrator access established. Verify all training objectives.'}
            {state === 'completed' && 'All objectives fulfilled and all challenge flags submitted.'}
          </div>
        </div>

        {/* Specifications Matrix */}
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
            <span className="text-slate-500 block text-[9px] uppercase">SUBNET</span>
            <span className="text-slate-200 font-bold truncate block">{subnet}</span>
          </div>
          <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
            <span className="text-slate-500 block text-[9px] uppercase">OS & ARCH</span>
            <span className="text-slate-200 font-bold truncate block">{os || (isFogOfWar ? '[HIDDEN]' : 'Unknown')}</span>
          </div>
          {points && (
            <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800 col-span-2 flex justify-between">
              <div>
                <span className="text-slate-500 block text-[9px] uppercase">USER FLAG</span>
                <span className={`font-bold ${userFlagClaimed ? 'text-amber-400' : 'text-slate-400'}`}>
                  {userFlagClaimed ? 'CLAIMED (+ ' + points.user + ' PTS)' : 'UNCLAIMED (' + points.user + ' PTS)'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block text-[9px] uppercase">ROOT FLAG</span>
                <span className={`font-bold ${rootFlagClaimed ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {rootFlagClaimed ? 'PWNED (+ ' + points.root + ' PTS)' : 'LOCKED (' + points.root + ' PTS)'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Discovered Ports Table */}
        <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">
              DISCOVERED OPEN PORTS
            </span>
            <span className="text-[10px] text-cyan-400 font-bold">
              {isFogOfWar ? '0' : discoveredPorts.length} / {totalPortsCount}
            </span>
          </div>

          {isFogOfWar ? (
            <div className="text-slate-500 text-[10px] italic py-1">
              [LOCKED] Host unreachable from external subnet. Pivot required.
            </div>
          ) : discoveredPorts.length === 0 ? (
            <div className="text-slate-500 text-[10px] italic py-1">
              No open ports enumerated yet. Execute: <code className="text-cyan-400">nmap -sV {displayIp}</code>
            </div>
          ) : (
            <div className="space-y-1.5">
              {discoveredPorts.map((p) => (
                <div key={p.port} className="flex items-center justify-between text-[11px] font-mono bg-slate-950/60 px-2 py-1 rounded border border-slate-800/80">
                  <span className="text-cyan-400 font-bold">{p.port}/TCP</span>
                  <span className="text-slate-300 truncate max-w-[160px] text-[10px]">{p.version || p.service}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Known Vulnerabilities & CVEs */}
        {!isFogOfWar && knownCves.length > 0 && (
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1.5">
            <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider block">
              IDENTIFIED VULNERABILITY VECTORS
            </span>
            {knownCves.map((cve, idx) => (
              <div key={idx} className="text-red-400 text-[11px] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                <span className="truncate">{cve}</span>
              </div>
            ))}
          </div>
        )}

        {/* Discovered Evidence Artifacts */}
        {machineEvidence.length > 0 && (
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                HARVESTED EVIDENCE & CREDS
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-bold">
                {machineEvidence.length}
              </span>
            </div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {machineEvidence.map((ev) => (
                <div key={ev.id} className="p-2 rounded bg-slate-950/70 border border-slate-800 text-[10px]">
                  <div className="flex justify-between font-bold text-slate-300">
                    <span>{ev.name}</span>
                    <span className="text-emerald-400">{ev.type}</span>
                  </div>
                  <div className="text-slate-500 truncate mt-0.5 font-mono">{ev.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Footer Buttons */}
      {isTargetable && (
        <div className="p-4 border-t border-slate-800 bg-slate-950/90 space-y-2 sticky bottom-0 z-10 backdrop-blur-md">
          <button
            onClick={() => onTargetMachine(id)}
            disabled={activeMachineId === id}
            className={`w-full py-2.5 px-4 rounded text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeMachineId === id
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-600/60 cursor-default'
                : 'bg-emerald-600 hover:bg-emerald-500 text-black shadow-lg shadow-emerald-900/40'
            }`}
          >
            {activeMachineId === id ? (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>CURRENTLY TARGETED IN PWNBOX</span>
              </>
            ) : (
              <>
                <ArrowRight className="w-4 h-4" />
                <span>TARGET THIS MACHINE IN PWNBOX</span>
              </>
            )}
          </button>

          <button
            onClick={() => onNavigateToMachine(id)}
            className="w-full py-2 px-4 rounded text-xs font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 transition flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>VIEW FULL MACHINE DOSSIER</span>
          </button>
        </div>
      )}
    </div>
  );
};
