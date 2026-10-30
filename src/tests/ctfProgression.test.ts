import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore, INITIAL_MACHINES } from '../store/gameStore';

describe('CTF Progression & Scoreboard Engine', () => {
  beforeEach(() => {
    useGameStore.setState({
      score: 0,
      rank: 'Script Kiddie',
      activeMachineId: 'ecorp-hr',
      machines: JSON.parse(JSON.stringify(INITIAL_MACHINES)),
      claimedFlags: [],
    });
  });

  it('calculates full box compromise with user and root flags', () => {
    const ecorp = INITIAL_MACHINES[0];

    // 1. Submit User Flag
    const userRes = useGameStore.getState().submitFlag(ecorp.userFlag);
    expect(userRes.success).toBe(true);
    expect(userRes.pointsAwarded).toBe(20);
    expect(useGameStore.getState().score).toBe(20);
    expect(useGameStore.getState().rank).toBe('Hacker');

    // 2. Submit Root Flag
    const rootRes = useGameStore.getState().submitFlag(ecorp.rootFlag);
    expect(rootRes.success).toBe(true);
    expect(rootRes.pointsAwarded).toBe(30);
    expect(useGameStore.getState().score).toBe(50);

    const machine = useGameStore.getState().machines.find((m) => m.id === 'ecorp-hr');
    expect(machine?.userClaimed).toBe(true);
    expect(machine?.rootClaimed).toBe(true);
    expect(machine?.compromiseLevel).toBe('ROOT');
  });

  it('promotes user across multiple ranks as score accumulates', () => {
    // E-Corp HR (20 + 30 = 50 pts)
    useGameStore.getState().submitFlag(INITIAL_MACHINES[0].userFlag);
    useGameStore.getState().submitFlag(INITIAL_MACHINES[0].rootFlag);

    // IronBank (25 + 35 = 60 pts) -> Total = 110 pts
    useGameStore.getState().submitFlag(INITIAL_MACHINES[1].userFlag);
    useGameStore.getState().submitFlag(INITIAL_MACHINES[1].rootFlag);

    expect(useGameStore.getState().score).toBe(110);
    expect(useGameStore.getState().rank).toBe('Elite');
  });
});
