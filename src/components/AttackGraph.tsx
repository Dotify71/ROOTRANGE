import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactFlow, {
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  ReactFlowInstance,
  NodeMouseHandler,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useGameStore } from '../store/gameStore';
import { SimulationEngine } from '../simulation/simulationEngine';
import { buildAttackGraphTopology } from '../simulation/attackGraphTopology';
import { AttackGraphNodeComponent } from './attack-graph/AttackGraphNodeComponent';
import { AttackGraphControls } from './attack-graph/AttackGraphControls';
import { AttackGraphLegend } from './attack-graph/AttackGraphLegend';
import { AttackGraphDetailsDrawer } from './attack-graph/AttackGraphDetailsDrawer';
import { AttackGraphAccessibleTable } from './attack-graph/AttackGraphAccessibleTable';
import { AttackGraphNodeData } from '../types/attackGraph';
import { soundManager } from '../audio/soundManager';

const nodeTypes = {
  attackNode: AttackGraphNodeComponent,
};

export const AttackGraphInner: React.FC = () => {
  const { activeMachineId, setActiveMachine, events, evidence, machines } = useGameStore();
  const engine = SimulationEngine.getInstance();

  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string>(activeMachineId || 'ecorp-hr');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [stateFilter, setStateFilter] = useState<string>('ALL');
  const [showMinimap, setShowMinimap] = useState<boolean>(true);
  const [showLegend, setShowLegend] = useState<boolean>(false);
  const [isTableView, setIsTableView] = useState<boolean>(false);
  const [instructorMode, setInstructorMode] = useState<boolean>(false);

  // Derive initial topology
  const topology = useMemo(() => {
    return buildAttackGraphTopology(engine, {
      searchQuery,
      stateFilter,
      instructorMode,
    });
  }, [engine, events, machines, activeMachineId, searchQuery, stateFilter, instructorMode]);

  const [nodes, setNodes, onNodesChange] = useNodesState<AttackGraphNodeData>(topology.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(topology.edges);

  // Sync state whenever topology updates from simulation events
  useEffect(() => {
    setNodes(topology.nodes);
    setEdges(topology.edges);
  }, [topology, setNodes, setEdges]);

  // Selected node data
  const selectedNode = useMemo(() => {
    const found = nodes.find((n) => n.id === selectedNodeId);
    return found ? found.data : nodes[1]?.data || nodes[0]?.data || null;
  }, [nodes, selectedNodeId]);

  // Handlers
  const handleNodeClick: NodeMouseHandler = useCallback((_, node) => {
    soundManager.playKey();
    setSelectedNodeId(node.id);
  }, []);

  const handleTargetMachine = useCallback((machineId: string) => {
    soundManager.playConnect();
    setActiveMachine(machineId);
  }, [setActiveMachine]);

  const navigate = useNavigate();

  const handleNavigateToMachine = useCallback((machineId: string) => {
    soundManager.playKey();
    navigate(`/machines/${machineId}`);
  }, [navigate]);

  const handleZoomIn = useCallback(() => {
    if (rfInstance) {
      rfInstance.zoomIn({ duration: 300 });
    }
  }, [rfInstance]);

  const handleZoomOut = useCallback(() => {
    if (rfInstance) {
      rfInstance.zoomOut({ duration: 300 });
    }
  }, [rfInstance]);

  const handleFitView = useCallback(() => {
    if (rfInstance) {
      rfInstance.fitView({ padding: 0.2, duration: 400 });
    }
  }, [rfInstance]);

  const handleResetLayout = useCallback(() => {
    soundManager.playKey();
    const freshTopology = buildAttackGraphTopology(engine, {
      searchQuery: '',
      stateFilter: 'ALL',
      instructorMode,
    });
    setNodes(freshTopology.nodes);
    setEdges(freshTopology.edges);
    setSearchQuery('');
    setStateFilter('ALL');
    if (rfInstance) {
      setTimeout(() => {
        rfInstance.fitView({ padding: 0.2, duration: 400 });
      }, 50);
    }
  }, [engine, instructorMode, rfInstance, setNodes, setEdges]);

  return (
    <div
      role="region"
      aria-label="Enterprise Network Attack Graph"
      className="flex flex-col h-full w-full bg-[#070a0f] text-slate-200 overflow-hidden font-mono"
    >
      {/* Interactive Controls Bar */}
      <AttackGraphControls
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        stateFilter={stateFilter}
        onStateFilterChange={setStateFilter}
        stats={topology.stats}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitView={handleFitView}
        onResetLayout={handleResetLayout}
        showMinimap={showMinimap}
        onToggleMinimap={() => setShowMinimap((prev) => !prev)}
        showLegend={showLegend}
        onToggleLegend={() => setShowLegend((prev) => !prev)}
        isTableView={isTableView}
        onToggleTableView={() => setIsTableView((prev) => !prev)}
        instructorMode={instructorMode}
        onToggleInstructorMode={() => setInstructorMode((prev) => !prev)}
      />

      {/* Main Content Area */}
      <div className="flex-1 relative flex overflow-hidden">
        {isTableView ? (
          <AttackGraphAccessibleTable
            nodes={nodes}
            selectedNodeId={selectedNodeId}
            activeMachineId={activeMachineId}
            onSelectNode={setSelectedNodeId}
            onTargetMachine={handleTargetMachine}
            onNavigateToMachine={handleNavigateToMachine}
          />
        ) : (
          <div className="flex-1 h-full w-full relative">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={handleNodeClick}
              nodeTypes={nodeTypes}
              onInit={setRfInstance}
              fitView
              fitViewOptions={{ padding: 0.25 }}
              minZoom={0.2}
              maxZoom={2.0}
              attributionPosition="bottom-left"
              aria-label="Interactive React Flow Network Diagram"
              className="bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.03)_0%,rgba(7,10,15,1)_100%)]"
            >
              <Background
                variant={BackgroundVariant.Dots}
                gap={24}
                size={1.5}
                color="#1e293b"
              />

              {showMinimap && (
                <MiniMap
                  className="!bg-[#090d16] !border !border-slate-800 !rounded-lg overflow-hidden shadow-2xl !bottom-4 !left-4"
                  nodeColor={(n) => {
                    const d = n.data as AttackGraphNodeData;
                    if (d?.state === 'completed') return '#10b981';
                    if (d?.state === 'compromised') return '#ef4444';
                    if (d?.state === 'privileged') return '#a855f7';
                    if (d?.state === 'initial-access') return '#eab308';
                    if (d?.state === 'vulnerable') return '#f59e0b';
                    if (d?.state === 'reachable') return '#06b6d4';
                    if (d?.state === 'discovered') return '#64748b';
                    return '#1e293b';
                  }}
                  maskColor="rgba(7, 10, 15, 0.75)"
                />
              )}
            </ReactFlow>

            {/* Collapsible Legend Drawer */}
            {showLegend && (
              <AttackGraphLegend onClose={() => setShowLegend(false)} />
            )}
          </div>
        )}

        {/* Selected-Node Forensics Details Drawer */}
        <AttackGraphDetailsDrawer
          nodeData={selectedNode}
          evidence={evidence}
          activeMachineId={activeMachineId}
          onTargetMachine={handleTargetMachine}
          onNavigateToMachine={handleNavigateToMachine}
          onClose={() => setSelectedNodeId('')}
        />
      </div>
    </div>
  );
};

export const AttackGraph: React.FC = () => {
  return (
    <ReactFlowProvider>
      <AttackGraphInner />
    </ReactFlowProvider>
  );
};
