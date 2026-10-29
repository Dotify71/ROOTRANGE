import React from 'react';
import {
  Search,
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Map,
  HelpCircle,
  Table,
  Network,
  Eye,
  EyeOff,
  Filter,
} from 'lucide-react';

export interface AttackGraphControlsProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  stateFilter: string;
  onStateFilterChange: (filter: string) => void;
  stats: {
    total: number;
    unknown: number;
    discovered: number;
    reachable: number;
    vulnerable: number;
    initialAccess: number;
    privileged: number;
    compromised: number;
    completed: number;
  };
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onResetLayout: () => void;
  showMinimap: boolean;
  onToggleMinimap: () => void;
  showLegend: boolean;
  onToggleLegend: () => void;
  isTableView: boolean;
  onToggleTableView: () => void;
  instructorMode: boolean;
  onToggleInstructorMode: () => void;
}

export const AttackGraphControls: React.FC<AttackGraphControlsProps> = ({
  searchQuery,
  onSearchChange,
  stateFilter,
  onStateFilterChange,
  stats,
  onZoomIn,
  onZoomOut,
  onFitView,
  onResetLayout,
  showMinimap,
  onToggleMinimap,
  showLegend,
  onToggleLegend,
  isTableView,
  onToggleTableView,
  instructorMode,
  onToggleInstructorMode,
}) => {
  const filterOptions = [
    { id: 'ALL', label: 'ALL', count: stats.total },
    { id: 'REACHABLE', label: 'REACHABLE', count: stats.reachable },
    { id: 'VULNERABLE', label: 'VULNERABLE', count: stats.vulnerable },
    { id: 'INITIAL_ACCESS', label: 'FOOTHOLD', count: stats.initialAccess },
    { id: 'COMPROMISED', label: 'ROOTED', count: stats.compromised },
    { id: 'COMPLETED', label: 'COMPLETE', count: stats.completed },
    { id: 'UNKNOWN', label: 'LOCKED', count: stats.unknown },
  ];

  return (
    <div className="flex flex-col gap-2.5 p-3 bg-[#0a0f18]/95 border-b border-slate-800 text-xs font-mono z-20 backdrop-blur-md">
      {/* Top Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search host, IP (e.g. 10.10.11.45), OS..."
            className="w-full pl-9 pr-8 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 text-slate-200 placeholder:text-slate-500 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* View Controls & Action Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Zoom In */}
          <button
            onClick={onZoomIn}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition"
            title="Zoom In"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {/* Zoom Out */}
          <button
            onClick={onZoomOut}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition"
            title="Zoom Out"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          {/* Fit View */}
          <button
            onClick={onFitView}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition"
            title="Fit to View"
            aria-label="Fit graph to view"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* Reset Layout */}
          <button
            onClick={onResetLayout}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition flex items-center gap-1 px-2"
            title="Reset Graph Layout"
            aria-label="Reset graph layout"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[10px]">RESET</span>
          </button>

          <div className="w-[1px] h-5 bg-slate-800 mx-1" />

          {/* Toggle Minimap */}
          <button
            onClick={onToggleMinimap}
            className={`p-1.5 rounded-lg border text-xs transition flex items-center gap-1 px-2.5 ${
              showMinimap
                ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-400'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Minimap"
            aria-label="Toggle minimap"
          >
            <Map className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[10px]">MINIMAP</span>
          </button>

          {/* Toggle Legend */}
          <button
            onClick={onToggleLegend}
            className={`p-1.5 rounded-lg border text-xs transition flex items-center gap-1 px-2.5 ${
              showLegend
                ? 'bg-cyan-950/60 border-cyan-500/60 text-cyan-400'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Legend"
            aria-label="Toggle legend"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[10px]">LEGEND</span>
          </button>

          {/* Toggle Accessible Table View */}
          <button
            onClick={onToggleTableView}
            className={`p-1.5 rounded-lg border text-xs transition flex items-center gap-1 px-2.5 ${
              isTableView
                ? 'bg-amber-950/60 border-amber-500/60 text-amber-400'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Accessible List / Table View"
            aria-label="Toggle accessible table view"
          >
            {isTableView ? <Network className="w-3.5 h-3.5" /> : <Table className="w-3.5 h-3.5" />}
            <span className="hidden md:inline text-[10px]">
              {isTableView ? 'TOPOLOGY GRAPH' : 'ACCESSIBLE TABLE'}
            </span>
          </button>

          {/* Fog-of-War / Instructor Mode Toggle */}
          <button
            onClick={onToggleInstructorMode}
            className={`p-1.5 rounded-lg border text-xs transition flex items-center gap-1 px-2.5 ${
              instructorMode
                ? 'bg-purple-950/60 border-purple-500/60 text-purple-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title={instructorMode ? 'Instructor Mode Active (Fog-of-War Disabled)' : 'Enable Instructor Mode (Reveal Hidden Hosts)'}
            aria-label="Toggle instructor mode"
          >
            {instructorMode ? <Eye className="w-3.5 h-3.5 text-purple-400" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="hidden lg:inline text-[10px]">
              {instructorMode ? 'INSTRUCTOR' : 'FOG-OF-WAR'}
            </span>
          </button>
        </div>
      </div>

      {/* State Filter Pills Row */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px] scrollbar-none">
        <span className="text-slate-500 flex items-center gap-1 mr-1 uppercase">
          <Filter className="w-3 h-3" />
          <span>FILTER:</span>
        </span>
        {filterOptions.map((opt) => {
          const isActive = stateFilter === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onStateFilterChange(opt.id)}
              className={`px-2.5 py-1 rounded-md border font-semibold transition flex items-center gap-1.5 whitespace-nowrap ${
                isActive
                  ? 'bg-emerald-500 text-black border-emerald-400 font-bold shadow-md shadow-emerald-950/60'
                  : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <span>{opt.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[9px] ${
                  isActive ? 'bg-black text-emerald-400' : 'bg-slate-800 text-slate-300'
                }`}
              >
                {opt.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
