import { describe, it, expect, beforeEach } from 'vitest';
import { SimulationEngine } from '../simulation/simulationEngine';
import { useGameStore } from '../store/gameStore';
import { buildAttackGraphTopology } from '../simulation/attackGraphTopology';

describe('ROOTRANGE Phase 6: Interactive Network Attack Graph', () => {
  let engine: SimulationEngine;

  beforeEach(() => {
    engine = SimulationEngine.getInstance();
    useGameStore.getState().resetGame();
  });

  describe('1. Enterprise Topology & Machine Data Derivation', () => {
    it('generates the full enterprise topology with gateway, DMZ server, pivot router, internal vault, and domain controller', () => {
      const { nodes, edges, stats } = buildAttackGraphTopology(engine);

      expect(nodes.length).toBe(5);
      expect(edges.length).toBe(4);
      expect(stats.total).toBe(5);

      const nodeIds = nodes.map((n) => n.id);
      expect(nodeIds).toContain('gw');
      expect(nodeIds).toContain('ecorp-hr');
      expect(nodeIds).toContain('pivot-router');
      expect(nodeIds).toContain('iron-vault');
      expect(nodeIds).toContain('corp-dc01');
    });

    it('positions nodes in a clear logical directed attack progression', () => {
      const { nodes } = buildAttackGraphTopology(engine);

      const gw = nodes.find((n) => n.id === 'gw')!;
      const ecorp = nodes.find((n) => n.id === 'ecorp-hr')!;
      const pivot = nodes.find((n) => n.id === 'pivot-router')!;
      const iron = nodes.find((n) => n.id === 'iron-vault')!;
      const dc01 = nodes.find((n) => n.id === 'corp-dc01')!;

      // Verify left-to-right progression
      expect(gw.position.x).toBeLessThan(ecorp.position.x);
      expect(ecorp.position.x).toBeLessThan(pivot.position.x);
      expect(pivot.position.x).toBeLessThan(iron.position.x);
      expect(iron.position.x).toBeLessThan(dc01.position.x);
    });

    it('verifies gateway is always reachable and perimeter ingress is active', () => {
      const { nodes } = buildAttackGraphTopology(engine);
      const gw = nodes.find((n) => n.id === 'gw')!;

      expect(gw.data.state).toBe('reachable');
      expect(gw.data.displayIp).toBe('10.10.10.1');
      expect(gw.data.type).toBe('gateway');
      expect(gw.data.isFogOfWar).toBe(false);
    });
  });

  describe('2. Fog-of-War & Information Security Isolation', () => {
    it('enforces strict fog-of-war on downstream machines before pivot breach', () => {
      const { nodes } = buildAttackGraphTopology(engine);

      const iron = nodes.find((n) => n.id === 'iron-vault')!;
      const dc = nodes.find((n) => n.id === 'corp-dc01')!;
      const pivot = nodes.find((n) => n.id === 'pivot-router')!;

      // Must be in UNKNOWN state
      expect(iron.data.state).toBe('unknown');
      expect(dc.data.state).toBe('unknown');
      expect(pivot.data.state).toBe('unknown');

      // Fog-of-War flags
      expect(iron.data.isFogOfWar).toBe(true);
      expect(dc.data.isFogOfWar).toBe(true);
      expect(pivot.data.isFogOfWar).toBe(true);

      // Must NOT expose hidden IP addresses prematurely
      expect(iron.data.displayIp).toContain('CLASSIFIED');
      expect(dc.data.displayIp).toContain('CLASSIFIED');
      expect(pivot.data.displayIp).toContain('MASKED');

      // Must NOT expose hidden open ports prematurely
      expect(iron.data.discoveredPorts.length).toBe(0);
      expect(dc.data.discoveredPorts.length).toBe(0);

      // Must NOT expose known CVEs prematurely
      expect(iron.data.knownCves.length).toBe(0);
      expect(dc.data.knownCves.length).toBe(0);
    });

    it('marks pivot edges as locked/dashed prior to foothold acquisition', () => {
      const { edges } = buildAttackGraphTopology(engine);

      const ecorpPivotEdge = edges.find((e) => e.id === 'edge-ecorp-pivot')!;
      const pivotIronEdge = edges.find((e) => e.id === 'edge-pivot-iron')!;
      const ironDcEdge = edges.find((e) => e.id === 'edge-iron-dc01')!;

      expect(ecorpPivotEdge.animated).toBe(false);
      expect(ecorpPivotEdge.style?.strokeDasharray).toBe('5,5');
      expect(ecorpPivotEdge.label).toContain('LOCKED');

      expect(pivotIronEdge.animated).toBe(false);
      expect(pivotIronEdge.style?.strokeDasharray).toBe('5,5');

      expect(ironDcEdge.animated).toBe(false);
      expect(ironDcEdge.style?.strokeDasharray).toBe('5,5');
    });

    it('allows instructor mode to safely preview hidden hosts for educational demonstration', () => {
      const { nodes } = buildAttackGraphTopology(engine, { instructorMode: true });

      const iron = nodes.find((n) => n.id === 'iron-vault')!;
      expect(iron.data.isFogOfWar).toBe(false);
      expect(iron.data.displayIp).toBe('10.10.11.82');
      expect(iron.data.displayName).toBe('IronBank Vault');
    });
  });

  describe('3. Simulation Event State Transitions', () => {
    it('SERVICE_DISCOVERED event moves machine from reachable to discovered', () => {
      let { nodes } = buildAttackGraphTopology(engine);
      expect(nodes.find((n) => n.id === 'ecorp-hr')!.data.state).toBe('reachable');

      // Port scan reveals port 22
      engine.discoverPort('ecorp-hr', 22);

      nodes = buildAttackGraphTopology(engine).nodes;
      const ecorpNode = nodes.find((n) => n.id === 'ecorp-hr')!;
      expect(ecorpNode.data.discoveredPorts.length).toBe(1);
      expect(ecorpNode.data.discoveredPorts[0].port).toBe(22);
      expect(ecorpNode.data.state).toBe('discovered');
    });

    it('Vulnerability investigation / web directory enumeration transitions machine to vulnerable', () => {
      engine.discoverPort('ecorp-hr', 8080);
      engine.completeObjective('ecorp-hr', 'ecorp-obj-1'); // Recon objective

      const { nodes } = buildAttackGraphTopology(engine);
      const ecorpNode = nodes.find((n) => n.id === 'ecorp-hr')!;
      expect(ecorpNode.data.state).toBe('vulnerable');
      expect(ecorpNode.data.knownCves.length).toBeGreaterThan(0);
    });

    it('INITIAL_ACCESS_GRANTED transitions machine to initial-access and unlocks downstream pivot router and internal vault', () => {
      // Simulate foothold on E-Corp HR
      engine.emitEvent(
        'INITIAL_ACCESS_GRANTED',
        'ecorp-hr',
        { user: 'alex' },
        'Foothold gained via Log4j reverse shell',
        25
      );

      const { nodes, edges } = buildAttackGraphTopology(engine);

      const ecorp = nodes.find((n) => n.id === 'ecorp-hr')!;
      expect(ecorp.data.state).toBe('initial-access');

      // Pivot router is now unlocked and reachable!
      const pivot = nodes.find((n) => n.id === 'pivot-router')!;
      expect(pivot.data.isFogOfWar).toBe(false);
      expect(pivot.data.state).toBe('reachable');
      expect(pivot.data.displayIp).toBe('10.10.12.1');

      // IronBank Vault is now revealed from fog-of-war!
      const iron = nodes.find((n) => n.id === 'iron-vault')!;
      expect(iron.data.isFogOfWar).toBe(false);
      expect(iron.data.state).toBe('reachable');
      expect(iron.data.displayIp).toBe('10.10.11.82');

      // Pivot edge lights up as active
      const pivotEdge = edges.find((e) => e.id === 'edge-ecorp-pivot')!;
      expect(pivotEdge.animated).toBe(true);
      expect(pivotEdge.label).toContain('Active');
    });

    it('PRIVILEGE_ESCALATED transitions machine to privileged status', () => {
      engine.setMachineCompromiseLevel('ecorp-hr', 'USER');
      engine.completeObjective('ecorp-hr', 'ecorp-obj-1');
      engine.completeObjective('ecorp-hr', 'ecorp-obj-2');
      engine.completeObjective('ecorp-hr', 'ecorp-obj-3');
      engine.completeObjective('ecorp-hr', 'ecorp-obj-4');
      engine.completeObjective('ecorp-hr', 'ecorp-obj-5');
      engine.completeObjective('ecorp-hr', 'ecorp-obj-6'); // Privesc find objective

      const { nodes } = buildAttackGraphTopology(engine);
      const ecorp = nodes.find((n) => n.id === 'ecorp-hr')!;
      expect(ecorp.data.state).toBe('privileged');
    });

    it('MACHINE_COMPROMISED or root flag submission transitions machine to compromised', () => {
      useGameStore.getState().submitFlag('ROOTRANGE{r00t_pr1v3sc_m4st3r_c0mpr0m1s3}');

      const { nodes } = buildAttackGraphTopology(engine);
      const ecorp = nodes.find((n) => n.id === 'ecorp-hr')!;
      expect(ecorp.data.state).toBe('compromised');
      expect(ecorp.data.rootFlagClaimed).toBe(true);
    });

    it('CHALLENGE_COMPLETED transitions node to completed when all objectives and flags are captured', () => {
      // Complete all objectives on ecorp-hr
      const ecorp = engine.getMachine('ecorp-hr')!;
      for (const obj of ecorp.objectives) {
        engine.completeObjective('ecorp-hr', obj.id);
      }

      // Claim both flags
      useGameStore.getState().submitFlag(ecorp.userFlag);
      useGameStore.getState().submitFlag(ecorp.rootFlag);

      const { nodes, stats } = buildAttackGraphTopology(engine);
      const ecorpNode = nodes.find((n) => n.id === 'ecorp-hr')!;
      expect(ecorpNode.data.state).toBe('completed');
      expect(stats.completed).toBe(1);
    });

    it('ensures graph never claims a machine is compromised unless engine verifies it', () => {
      // Only user flag claimed
      const ecorp = engine.getMachine('ecorp-hr')!;
      useGameStore.getState().submitFlag(ecorp.userFlag);

      const { nodes } = buildAttackGraphTopology(engine);
      const ecorpNode = nodes.find((n) => n.id === 'ecorp-hr')!;

      // Should be initial-access, NOT compromised
      expect(ecorpNode.data.state).toBe('initial-access');
      expect(ecorpNode.data.state).not.toBe('compromised');
    });
  });

  describe('4. Search, Filter & Layout Controls', () => {
    it('filters nodes based on state filter', () => {
      // Initially: gw and ecorp-hr reachable; pivot, iron, dc unknown
      const { nodes } = buildAttackGraphTopology(engine, { stateFilter: 'REACHABLE' });

      const reachableNodes = nodes.filter((n) => n.className === 'opacity-100');
      const dimmedNodes = nodes.filter((n) => n.className?.includes('opacity-25'));

      expect(reachableNodes.length).toBe(2); // gw, ecorp-hr
      expect(dimmedNodes.length).toBe(3); // pivot, iron, dc
    });

    it('searches nodes by IP address accurately', () => {
      const { nodes } = buildAttackGraphTopology(engine, { searchQuery: '10.10.11.45' });

      const matching = nodes.filter((n) => n.className === 'opacity-100');
      expect(matching.length).toBe(1);
      expect(matching[0].id).toBe('ecorp-hr');
    });

    it('searches nodes by OS accurately', () => {
      const { nodes: edgeOsNodes } = buildAttackGraphTopology(engine, { searchQuery: 'EdgeOS' });
      const edgeMatching = edgeOsNodes.filter((n) => n.className === 'opacity-100');
      expect(edgeMatching.length).toBe(1);
      expect(edgeMatching[0].id).toBe('gw');

      const { nodes: routerNodes } = buildAttackGraphTopology(engine, { searchQuery: 'RouterOS' });
      const routerMatching = routerNodes.filter((n) => n.className === 'opacity-100');
      expect(routerMatching.length).toBe(2);
    });
  });

  describe('5. Reset & Synchronization Integrity', () => {
    it('restores initial graph state after challenge reset', () => {
      // Escalate machine
      useGameStore.getState().submitFlag('ROOTRANGE{r00t_pr1v3sc_m4st3r_c0mpr0m1s3}');
      expect(buildAttackGraphTopology(engine).nodes.find((n) => n.id === 'ecorp-hr')!.data.state).toBe('compromised');

      // Reset
      useGameStore.getState().resetGame();

      const { nodes } = buildAttackGraphTopology(engine);
      const ecorp = nodes.find((n) => n.id === 'ecorp-hr')!;
      expect(ecorp.data.state).toBe('reachable');
      expect(ecorp.data.rootFlagClaimed).toBe(false);

      const iron = nodes.find((n) => n.id === 'iron-vault')!;
      expect(iron.data.state).toBe('unknown');
    });
  });
});
