import { describe, it, expect } from 'vitest';
import { useGameStore, INITIAL_NETWORK_NODES } from '../store/gameStore';

describe('Attack Graph & Topology State', () => {
  it('loads initial network nodes with gateway and target machines', () => {
    const nodes = useGameStore.getState().networkNodes;
    expect(nodes.length).toBe(INITIAL_NETWORK_NODES.length);
    expect(nodes[0].type).toBe('gateway');
    expect(nodes[1].id).toBe('ecorp-hr');
  });

  it('updates node state to USER when user flag is captured', () => {
    useGameStore.getState().updateCompromiseLevel('ecorp-hr', 'USER');
    const node = useGameStore.getState().networkNodes.find((n) => n.id === 'ecorp-hr');
    expect(node?.status).toBe('user');
  });

  it('updates node state to ROOT when root flag is captured', () => {
    useGameStore.getState().updateCompromiseLevel('ecorp-hr', 'ROOT');
    const node = useGameStore.getState().networkNodes.find((n) => n.id === 'ecorp-hr');
    expect(node?.status).toBe('root');
  });
});
