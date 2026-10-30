import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { Network, Server, Shield, ShieldCheck, Skull, ArrowRight, Lock, Key } from 'lucide-react';
import { soundManager } from '../audio/soundManager';

export const AttackGraph: React.FC = () => {
  const { networkNodes, machines, activeMachineId, setActiveMachine } = useGameStore();
  const [selectedNodeId, setSelectedNodeId] = useState<string>(activeMachineId);

  const selectedNode = networkNodes.find((n) => n.id === selectedNodeId) || networkNodes[1];
  const matchedMachine = machines.find((m) => m.id === selectedNode.id);

  const handleNodeClick = (nodeId: string) => {
    soundManager.playKey();
    setSelectedNodeId(nodeId);
  };

  const handleTargetMachine = (machineId: string) => {
    soundManager.playConnect();
    setActiveMachine(machineId);
  };

  return (
    <div className="flex h-full bg-[#070a0f] border border-slate-800 rounded-lg overflow-hidden font-mono shadow-2xl">
      {/* Main Interactive Canvas */}
      <div className="flex-1 relative flex flex-col justify-between p-6 overflow-hidden bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.03)_0%,rgba(10,13,20,0.95)_100%)]">
        {/* Header Legend */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 z-10">
          <div className="flex items-center space-x-2">
            <Network className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm tracking-wider text-slate-100">
              ENTERPRISE ATTACK GRAPH & PIVOT TOPOLOGY
            </span>
          </div>

          <div className="flex items-center space-x-4 text-[10px]">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-700 inline-block" /> LOCKED
            </span>
            <span className="flex items-center gap-1.5 text-cyan-400">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" /> RECON
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> USER FOOTHOLD
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse inline-block" /> ROOTED
            </span>
          </div>
        </div>

        {/* 2D Vector Circuit Canvas */}
        <div className="flex-1 flex items-center justify-center relative py-12">
          {/* Connecting SVG Path Line */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.8" />
              </linearGradient>
            </defs>
            <path
              d="M 150,220 L 380,220 L 620,220 L 860,220"
              stroke="url(#lineGrad)"
              strokeWidth="3"
              strokeDasharray="6,4"
              fill="none"
              className="opacity-40 animate-pulse"
            />
          </svg>

          {/* Topology Node Cards */}
          <div className="grid grid-cols-4 gap-6 w-full max-w-5xl z-10">
            {networkNodes.map((node, index) => {
              const machine = machines.find((m) => m.id === node.id);
              const isSelected = selectedNodeId === node.id;
              const isRooted = node.status === 'root' || machine?.rootClaimed;
              const isUser = node.status === 'user' || machine?.userClaimed;

              return (
                <div
                  key={node.id}
                  onClick={() => handleNodeClick(node.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer relative backdrop-blur-md flex flex-col justify-between ${
                    isSelected
                      ? 'border-emerald-400 bg-emerald-950/30 shadow-[0_0_20px_rgba(16,185,129,0.25)]'
                      : isRooted
                      ? 'border-emerald-600/60 bg-emerald-950/20 hover:border-emerald-500'
                      : isUser
                      ? 'border-amber-600/60 bg-amber-950/20 hover:border-amber-500'
                      : 'border-slate-800 bg-[#0c1017] hover:border-slate-700'
                  }`}
                >
                  {/* Step Sequence Badge */}
                  <div className="flex items-center justify-between mb-3 text-[10px]">
                    <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-bold">
                      NODE 0{index + 1}
                    </span>
                    {isRooted ? (
                      <span className="flex items-center gap-1 text-emerald-400 font-bold">
                        <Skull className="w-3.5 h-3.5" /> ROOTED
                      </span>
                    ) : isUser ? (
                      <span className="flex items-center gap-1 text-amber-400 font-bold">
                        <Key className="w-3.5 h-3.5" /> USER PWNED
                      </span>
                    ) : node.status === 'locked' ? (
                      <span className="flex items-center gap-1 text-slate-600 font-bold">
                        <Lock className="w-3 h-3" /> LOCKED
                      </span>
                    ) : (
                      <span className="text-cyan-400 font-bold">DISCOVERED</span>
                    )}
                  </div>

                  {/* Icon & Label */}
                  <div className="flex items-center space-x-3 mb-4">
                    <div
                      className={`p-2.5 rounded-lg border ${
                        isRooted
                          ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                          : isUser
                          ? 'bg-amber-950/80 border-amber-500 text-amber-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      {node.type === 'gateway' ? (
                        <Shield className="w-5 h-5" />
                      ) : (
                        <Server className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-200 truncate max-w-[130px]">
                        {node.label}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{node.subnet}</div>
                    </div>
                  </div>

                  {/* Bottom Stats */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                    <span className="text-slate-400 font-mono">{node.ip}</span>
                    {machine && (
                      <span className="text-emerald-400 font-bold">
                        {machine.points.user + machine.points.root} PTS
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Subnet Guidance */}
        <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between text-xs text-slate-500">
          <span>PIVOT PATH: Perimeter Gateway (10.10.10.1) ➔ E-Corp DMZ ➔ Internal LAN ➔ AD Domain Forest</span>
          <span className="text-emerald-400 font-bold">AUTO-SYNC ACTIVE</span>
        </div>
      </div>

      {/* Right Inspection Panel */}
      <div className="w-80 lg:w-96 border-l border-slate-800 bg-[#0a0f17] p-5 flex flex-col justify-between text-xs">
        <div>
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
              // NODE FORENSICS
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-emerald-400">
              {selectedNode.ip}
            </span>
          </div>

          {matchedMachine ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">{matchedMachine.name}</h3>
                <p className="text-slate-400 text-xs leading-relaxed">{matchedMachine.description}</p>
              </div>

              {/* OS & Difficulty */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 block text-[9px]">OPERATING SYSTEM</span>
                  <span className="text-white font-bold">{matchedMachine.os}</span>
                </div>
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 block text-[9px]">DIFFICULTY</span>
                  <span className="text-emerald-400 font-bold">{matchedMachine.difficulty}</span>
                </div>
              </div>

              {/* Ports */}
              <div className="p-3 rounded bg-slate-900/60 border border-slate-800 space-y-1.5">
                <span className="text-slate-400 font-bold block text-[10px]">OPEN VULNERABLE PORTS</span>
                {matchedMachine.ports.map((p) => (
                  <div key={p.port} className="flex justify-between text-[11px] font-mono">
                    <span className="text-cyan-400 font-bold">{p.port}/TCP</span>
                    <span className="text-slate-300 truncate max-w-[170px]">{p.version}</span>
                  </div>
                ))}
              </div>

              {/* CVEs */}
              <div className="p-3 rounded bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-slate-400 font-bold block text-[10px]">KNOWN VULNERABILITY VECTORS</span>
                {matchedMachine.cves.map((cve, idx) => (
                  <div key={idx} className="text-red-400 text-[11px] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                    <span>{cve}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded bg-slate-900 border border-slate-800 text-slate-400 text-xs">
              Perimeter Routing Gateway providing initial NAT translation to internal test subnets.
            </div>
          )}
        </div>

        {matchedMachine && (
          <div className="pt-4 border-t border-slate-800 mt-4">
            <button
              onClick={() => handleTargetMachine(matchedMachine.id)}
              disabled={activeMachineId === matchedMachine.id}
              className={`w-full py-2.5 px-4 rounded text-xs font-bold transition flex items-center justify-center gap-2 ${
                activeMachineId === matchedMachine.id
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-600/60 cursor-default'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-black shadow-lg shadow-emerald-900/40'
              }`}
            >
              {activeMachineId === matchedMachine.id ? (
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
          </div>
        )}
      </div>
    </div>
  );
};
