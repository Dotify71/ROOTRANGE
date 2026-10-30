import React from 'react';
import {
  History,
  Trash2,
  ChevronDown,
  ChevronUp,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { HistoryItem, HttpMethod } from '../../types/httpRepeater';

export interface RequestHistoryDrawerProps {
  history: HistoryItem[];
  selectedHistoryId: string | null;
  onSelectHistoryItem: (item: HistoryItem) => void;
  onClearHistory: () => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const RequestHistoryDrawer: React.FC<RequestHistoryDrawerProps> = ({
  history,
  selectedHistoryId,
  onSelectHistoryItem,
  onClearHistory,
  isOpen,
  onToggleOpen,
}) => {
  const getMethodBadge = (m: HttpMethod) => {
    switch (m) {
      case 'GET':
        return 'text-sky-400';
      case 'POST':
        return 'text-emerald-400';
      case 'PUT':
        return 'text-amber-400';
      case 'PATCH':
        return 'text-purple-400';
      case 'DELETE':
        return 'text-red-400';
      default:
        return 'text-slate-400';
    }
  };

  const getStatusBadge = (code: number) => {
    if (code >= 200 && code < 300) {
      return 'bg-emerald-950 text-emerald-400 border-emerald-800';
    }
    if (code >= 300 && code < 400) {
      return 'bg-cyan-950 text-cyan-400 border-cyan-800';
    }
    if (code >= 400 && code < 500) {
      return 'bg-amber-950 text-amber-400 border-amber-800';
    }
    return 'bg-red-950 text-red-400 border-red-800';
  };

  return (
    <div className="border-t border-slate-800 bg-[#090d16] font-mono text-xs z-10 transition-all duration-300">
      {/* Drawer Header Toggle */}
      <div className="px-4 py-2 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/80">
        <button
          onClick={onToggleOpen}
          className="flex items-center gap-2 text-slate-300 hover:text-white font-bold text-xs"
        >
          <History className="w-3.5 h-3.5 text-cyan-400" />
          <span>REQUEST HISTORY</span>
          <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-slate-800 text-slate-400">
            {history.length}
          </span>
          {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>

        {isOpen && history.length > 0 && (
          <button
            onClick={onClearHistory}
            className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-red-400 transition"
            title="Clear all request history"
          >
            <Trash2 className="w-3 h-3" />
            <span>CLEAR HISTORY</span>
          </button>
        )}
      </div>

      {/* Drawer Content */}
      {isOpen && (
        <div className="max-h-48 overflow-y-auto p-2 space-y-1">
          {history.length === 0 ? (
            <div className="p-4 text-center text-slate-600 text-[11px] italic">
              No previous requests in history. Fired HTTP requests will be recorded here for instant replay.
            </div>
          ) : (
            <div className="space-y-1">
              {history.map((item) => {
                const isSelected = selectedHistoryId === item.id;
                const dateStr = new Date(item.timestamp).toLocaleTimeString();

                return (
                  <div
                    key={item.id}
                    onClick={() => onSelectHistoryItem(item)}
                    className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-between text-xs ${
                      isSelected
                        ? 'bg-emerald-950/40 border-emerald-500/60 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                        : 'bg-slate-900/60 border-slate-800 hover:bg-slate-900 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      {/* Method */}
                      <span className={`font-bold text-[11px] w-12 ${getMethodBadge(item.method)}`}>
                        {item.method}
                      </span>

                      {/* URL */}
                      <span className="font-mono text-slate-300 truncate max-w-md text-[11px]" title={item.url}>
                        {item.url}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 text-[10px] shrink-0">
                      {/* Status Code */}
                      <span className={`px-2 py-0.5 rounded border font-bold ${getStatusBadge(item.response.statusCode)}`}>
                        {item.response.statusCode}
                      </span>

                      {/* Duration */}
                      <span className="text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-600" />
                        <span>{item.response.durationMs}ms</span>
                      </span>

                      {/* Timestamp */}
                      <span className="text-slate-600 hidden sm:inline">{dateStr}</span>

                      {/* Replay action icon */}
                      <div className="p-1 rounded text-slate-500 hover:text-emerald-400" title="Replay this request">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
