import React, { useState } from 'react';
import {
  Briefcase,
  Key,
  Database,
  FileText,
  Copy,
  Check,
  Search,
  Hash,
} from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { soundManager } from '../audio/soundManager';
import { FlagRegistry } from '../services/flagRegistry';

interface UnifiedLootItem {
  id: string;
  category: 'FLAG' | 'CREDENTIAL' | 'HASH' | 'JWT' | 'TOKEN';
  name: string;
  source: string;
  value: string;
  description: string;
  points?: number;
  timestamp?: number;
}

export const InventoryPage: React.FC = () => {
  const { claimedFlags, evidence, machines } = useGameStore();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');

  const handleCopy = (id: string, text: string) => {
    soundManager.playKey();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 1. Build captured flags items
  const flagLoot: UnifiedLootItem[] = claimedFlags.map((flagToken, idx) => {
    const flagDef = FlagRegistry.getFlagByValue(flagToken);
    const machine = flagDef?.machineId ? machines.find((m) => m.id === flagDef.machineId) : undefined;

    return {
      id: `claimed-flag-${idx}`,
      category: 'FLAG',
      name: flagDef ? flagDef.title : `Captured CTF Token #${idx + 1}`,
      source: machine ? `${machine.name} (${machine.ip})` : 'Simulation Target Range',
      value: flagToken,
      description: flagDef ? flagDef.description : 'Cryptographically verified capture-the-flag proof of compromise.',
      points: flagDef?.points || 20,
    };
  });

  // 2. Build evidence items
  const evidenceLoot: UnifiedLootItem[] = evidence.map((ev) => {
    let cat: UnifiedLootItem['category'] = 'CREDENTIAL';
    if (ev.type === 'JWT') cat = 'JWT';
    else if (ev.type === 'HASH') cat = 'HASH';
    else if (ev.type === 'FLAG') cat = 'FLAG';

    const machine = machines.find((m) => m.id === ev.machineId);

    return {
      id: ev.id,
      category: cat,
      name: ev.name,
      source: machine ? `${machine.name} (${ev.source || machine.ip})` : ev.source || 'Pwnbox Memory',
      value: ev.value,
      description: ev.description,
      timestamp: ev.discoveredAt,
    };
  });

  // Combine and deduplicate by value
  const seenValues = new Set<string>();
  const combinedLoot: UnifiedLootItem[] = [];

  for (const item of [...flagLoot, ...evidenceLoot]) {
    if (!seenValues.has(item.value)) {
      seenValues.add(item.value);
      combinedLoot.push(item);
    }
  }

  // Filter and search
  const filteredLoot = combinedLoot.filter((item) => {
    if (selectedFilter !== 'ALL' && item.category !== selectedFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.source.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.value.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filterTabs = [
    { id: 'ALL', label: 'All Artifacts', count: combinedLoot.length },
    { id: 'FLAG', label: 'Flags', count: combinedLoot.filter((l) => l.category === 'FLAG').length },
    { id: 'CREDENTIAL', label: 'Credentials', count: combinedLoot.filter((l) => l.category === 'CREDENTIAL').length },
    { id: 'JWT', label: 'JWT Tokens', count: combinedLoot.filter((l) => l.category === 'JWT').length },
    { id: 'HASH', label: 'Hashes', count: combinedLoot.filter((l) => l.category === 'HASH').length },
  ];

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4 font-mono text-xs select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h1 className="text-base font-bold text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-emerald-400" />
            <span>LOOT VAULT & EXFILTRATED ARTIFACTS</span>
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Cryptographic proof of compromise, captured flags, dumped hashes, and exfiltrated user sessions.
          </p>
        </div>
        <div className="text-[11px] text-slate-500">
          TOTAL LOOT: <strong className="text-emerald-400">{combinedLoot.length} ARTIFACTS</strong>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0c1017] border border-slate-800 p-3 rounded-xl">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search loot, hashes, users..."
            className="w-full bg-[#070a0f] border border-slate-800 focus:border-emerald-500 pl-9 pr-3 py-1.5 rounded text-xs text-slate-200 outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                selectedFilter === tab.id
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 shadow-sm'
                  : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-[10px] px-1 py-0.2 rounded bg-black/50 text-slate-400">
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Loot Cards Grid */}
      {filteredLoot.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredLoot.map((item) => (
            <div
              key={item.id}
              className="bg-[#0c1017] border border-slate-800 p-4 rounded-xl space-y-2 relative hover:border-slate-700 transition"
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-bold text-xs text-white">
                  {item.category === 'FLAG' ? (
                    <Key className="w-4 h-4 text-amber-400" />
                  ) : item.category === 'JWT' ? (
                    <Database className="w-4 h-4 text-cyan-400" />
                  ) : item.category === 'HASH' ? (
                    <Hash className="w-4 h-4 text-purple-400" />
                  ) : (
                    <FileText className="w-4 h-4 text-emerald-400" />
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
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  title="Copy artifact value"
                >
                  {copiedId === item.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {item.points && (
                <div className="text-[10px] text-amber-400 font-bold flex items-center justify-between pt-1">
                  <span>CTF REWARD: +{item.points} XP</span>
                  <span className="text-slate-500 text-[9px]">Verified Capture</span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center bg-[#0c1017] border border-slate-800 rounded-xl space-y-2">
          <Briefcase className="w-8 h-8 text-slate-600 mx-auto" />
          <h3 className="font-bold text-white text-xs">No Exfiltrated Artifacts Found</h3>
          <p className="text-slate-500 text-[11px] max-w-md mx-auto">
            {searchQuery
              ? `No artifacts matched the search filter "${searchQuery}".`
              : 'As you uncover credentials, extract tokens via the HTTP Repeater, or capture CTF flags, they will be stored securely in your Loot Vault.'}
          </p>
        </div>
      )}
    </div>
  );
};
