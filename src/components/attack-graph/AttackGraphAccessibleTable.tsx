import React from 'react';
import { Node } from 'reactflow';
import { AttackGraphNodeData } from '../../types/attackGraph';
import { ExternalLink } from 'lucide-react';

export interface AttackGraphAccessibleTableProps {
  nodes: Node<AttackGraphNodeData>[];
  selectedNodeId: string;
  activeMachineId: string;
  onSelectNode: (nodeId: string) => void;
  onTargetMachine: (machineId: string) => void;
  onNavigateToMachine: (machineId: string) => void;
}

export const AttackGraphAccessibleTable: React.FC<AttackGraphAccessibleTableProps> = ({
  nodes,
  selectedNodeId,
  activeMachineId,
  onSelectNode,
  onTargetMachine,
  onNavigateToMachine,
}) => {
  return (
    <div className="flex-1 overflow-auto p-6 font-mono text-xs bg-[#070a0f]">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-white tracking-wider uppercase">
              Accessible Network Attack Topology
            </h2>
            <p className="text-slate-400 text-xs">
              Screen-reader friendly and keyboard navigable inventory of enterprise network nodes.
            </p>
          </div>
          <span className="text-[10px] px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-emerald-400 font-bold">
            {nodes.length} TOTAL NODES
          </span>
        </div>

        <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950/60 shadow-2xl">
          <table
            role="table"
            aria-label="Enterprise Network Topology Nodes and Attack States"
            className="w-full text-left border-collapse"
          >
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 text-[10px] uppercase">
                <th scope="col" className="p-3 font-semibold">Node Name</th>
                <th scope="col" className="p-3 font-semibold">IP Address</th>
                <th scope="col" className="p-3 font-semibold">Subnet / Type</th>
                <th scope="col" className="p-3 font-semibold">Compromise State</th>
                <th scope="col" className="p-3 font-semibold">Open Ports</th>
                <th scope="col" className="p-3 font-semibold">Objectives</th>
                <th scope="col" className="p-3 font-semibold">Flags</th>
                <th scope="col" className="p-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {nodes.map(({ id, data }) => {
                const isSelected = selectedNodeId === id;
                const isCurrentTarget = activeMachineId === id;

                return (
                  <tr
                    key={id}
                    onClick={() => onSelectNode(id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-emerald-950/30'
                        : 'hover:bg-slate-900/50'
                    }`}
                  >
                    <td className="p-3 font-bold text-white flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          data.state === 'completed'
                            ? 'bg-emerald-400'
                            : data.state === 'compromised'
                            ? 'bg-red-400'
                            : data.state === 'initial-access'
                            ? 'bg-yellow-400'
                            : 'bg-cyan-400'
                        }`}
                      />
                      <span>{data.displayName}</span>
                    </td>
                    <td className="p-3 font-mono text-cyan-400">{data.displayIp}</td>
                    <td className="p-3 text-[11px] text-slate-400">
                      <div>{data.subnet}</div>
                      <div className="text-[9px] uppercase text-slate-500">{data.type}</div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${
                          data.state === 'completed'
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-500'
                            : data.state === 'compromised'
                            ? 'bg-red-950 text-red-400 border-red-500'
                            : data.state === 'privileged'
                            ? 'bg-purple-950 text-purple-400 border-purple-500'
                            : data.state === 'initial-access'
                            ? 'bg-yellow-950 text-yellow-400 border-yellow-500'
                            : data.state === 'vulnerable'
                            ? 'bg-amber-950 text-amber-400 border-amber-500'
                            : data.state === 'reachable'
                            ? 'bg-cyan-950 text-cyan-400 border-cyan-500'
                            : 'bg-slate-900 text-slate-400 border-slate-700'
                        }`}
                      >
                        {data.state.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="p-3">
                      {data.isFogOfWar ? (
                        <span className="text-slate-500">Locked</span>
                      ) : (
                        <span>{data.discoveredPorts.length} / {data.totalPortsCount} Seen</span>
                      )}
                    </td>
                    <td className="p-3">
                      {data.totalObjectivesCount > 0 ? (
                        <span>{data.completedObjectivesCount} / {data.totalObjectivesCount}</span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="p-3 text-[10px]">
                      {data.totalObjectivesCount > 0 ? (
                        <div className="space-y-0.5">
                          <span className={data.userFlagClaimed ? 'text-amber-400 font-bold block' : 'text-slate-600 block'}>
                            USER: {data.userFlagClaimed ? 'CLAIMED' : 'UNCLAIMED'}
                          </span>
                          <span className={data.rootFlagClaimed ? 'text-red-400 font-bold block' : 'text-slate-600 block'}>
                            ROOT: {data.rootFlagClaimed ? 'PWNED' : 'LOCKED'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {(data.type === 'target' || data.type === 'dc') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onTargetMachine(id);
                            }}
                            disabled={isCurrentTarget}
                            className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                              isCurrentTarget
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-600/60'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-black'
                            }`}
                          >
                            {isCurrentTarget ? 'TARGETED' : 'TARGET'}
                          </button>
                        )}
                        {(data.type === 'target' || data.type === 'dc') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigateToMachine(id);
                            }}
                            className="p-1 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-white"
                            title="View machine dossier"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
