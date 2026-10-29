import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore, INITIAL_MACHINES } from '../store/gameStore';

describe('ROOTRANGE Foundation & Game State Store', () => {
  beforeEach(() => {
    // Reset store state
    useGameStore.setState({
      score: 0,
      rank: 'Script Kiddie',
      activeMachineId: 'ecorp-hr',
      machines: JSON.parse(JSON.stringify(INITIAL_MACHINES)),
      claimedFlags: [],
    });
  });

  it('initializes with default score, rank, and active machine', () => {
    const state = useGameStore.getState();
    expect(state.score).toBe(0);
    expect(state.rank).toBe('Script Kiddie');
    expect(state.activeMachineId).toBe('ecorp-hr');
    expect(state.machines.length).toBe(3);
  });

  it('switches active machine correctly', () => {
    useGameStore.getState().setActiveMachine('iron-vault');
    expect(useGameStore.getState().activeMachineId).toBe('iron-vault');
  });

  it('rejects an invalid flag', () => {
    const res = useGameStore.getState().submitFlag('ROOTRANGE{invalid_fake_flag}');
    expect(res.success).toBe(false);
    expect(res.pointsAwarded).toBe(0);
    expect(useGameStore.getState().score).toBe(0);
  });

  it('accepts valid user flag and awards points & upgrades rank', () => {
    const userFlag = INITIAL_MACHINES[0].userFlag;
    const res = useGameStore.getState().submitFlag(userFlag);

    expect(res.success).toBe(true);
    expect(res.pointsAwarded).toBe(20);
    expect(res.flagType).toBe('user');
    expect(useGameStore.getState().score).toBe(20);
    expect(useGameStore.getState().rank).toBe('Hacker');
  });

  it('prevents duplicate flag submission', () => {
    const userFlag = INITIAL_MACHINES[0].userFlag;
    useGameStore.getState().submitFlag(userFlag);

    const dupRes = useGameStore.getState().submitFlag(userFlag);
    expect(dupRes.success).toBe(false);
    expect(dupRes.message).toContain('already been submitted');
    expect(useGameStore.getState().score).toBe(20);
  });

  it('captures root flag and sets compromise level to ROOT', () => {
    const rootFlag = INITIAL_MACHINES[0].rootFlag;
    const res = useGameStore.getState().submitFlag(rootFlag);

    expect(res.success).toBe(true);
    expect(res.pointsAwarded).toBe(30);
    expect(res.flagType).toBe('root');

    const machine = useGameStore.getState().machines.find((m) => m.id === 'ecorp-hr');
    expect(machine?.rootClaimed).toBe(true);
    expect(machine?.compromiseLevel).toBe('ROOT');
  });
});
