import React, { useState } from 'react';
import { Briefcase, Key, Database, FileText, Copy, Check, Lock } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { soundManager } from '../audio/soundManager';

interface LootItem {
  id: string;
  type: 'FLAG' | 'CREDENTIAL' | 'HASH' | 'JWT';
  name: string;
  source: string;
  value: string;
  description: string;
}

export const InventoryPage: React.FC = () => {
  const { claimedFlags } = useGameStore();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    soundManager.playKey();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Dynamic loot derived from claimed flags and machines
  const lootItems: LootItem[] = [
    {
      id: 'l1',
      type: 'CREDENTIAL',
      name: 'Default IoT Telnet Pair',
      source: 'wordlists/common.txt',
      value: 'admin:password123',
      description: 'Extracted from factory default credential dictionary on Pwnbox.',
    },
    {
      id: 'l2',
      type: 'JWT',
      name: 'Forged Finance Admin JWT Token',
      source: 'IronBank API (10.10.11.82:8080)',
      value: 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJ1c2VyIjoiYWRtaW4iLCJyb2xlIjoiZmluYW5jZV9hZG1pbiJ9.',
      description: 'Algorithm "none" signature bypass token granting root API privileges.',
    },
    ...claimedFlags.map((flag, idx) => ({
      id: `flag-${idx}`,
      type: 'FLAG' as const,
      name: `Capture The Flag Token #${idx + 1}`,
      source: 'Target Machine Loot',
      value: flag,
      description: 'Cryptographically validated flag captured during active penetration test.',
    })),
  ];

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4 font-mono text-xs select-none">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h1 className="text-base font-bold text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-emerald-400" />
            <span>LOOT VAULT & EXFILTRATED ARTIFACTS</span>
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Artifacts, captured tokens, and dumped cryptographic credentials gathered across your engagements.
          </p>
        </div>
        <div className="text-[11px] text-slate-500">
          TOTAL LOOT: <strong className="text-emerald-400">{lootItems.length} ARTIFACTS</strong>
        </div>
      </div>

      {lootItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {lootItems.map((item) => (
            <div
              key={item.id}
              className="bg-[#0c1017] border border-slate-800 p-4 rounded-xl space-y-2 relative hover:border-slate-700 transition"
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-bold text-xs text-white">
                  {item.type === 'FLAG' ? (
                    <Key className="w-4 h-4 text-amber-400" />
                  ) : item.type === 'JWT' ? (
                    <Database className="w-4 h-4 text-cyan-400" />
                  ) : (
                    <FileText className="w-4 h-4 text-purple-400" />
                  )}
                  <span>{item.name}</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                  {item.source}
                </span>
              </div>

              <p className="text-slate-400 text-xs leading-relaxed">{item.description}</p>

              <div className="flex items-center justify-between bg-black/60 p-2 rounded border border-slate-800/80">
                <code className="text-emerald-400 text-[11px] truncate max-w-[280px]">
                  {item.value}
                </code>
                <button
                  onClick={() => handleCopy(item.id, item.value)}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
                  title="Copy to clipboard"
                >
                  {copiedId === item.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center text-slate-600 space-y-2 border border-slate-800/60 rounded-xl bg-[#0a0f17]">
          <Lock className="w-8 h-8 mx-auto opacity-40 text-slate-500" />
          <div className="font-bold text-slate-400">VAULT CURRENTLY EMPTY</div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Run an nmap scan, exploit a target in Pwnbox, or capture flags to harvest credentials and tokens here.
          </p>
        </div>
      )}
    </div>
  );
};
