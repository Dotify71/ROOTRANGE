import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore, INITIAL_MACHINES } from '../store/gameStore';
import { FlagRegistry } from '../services/flagRegistry';
import { ProgressionCalculator } from '../services/progressionCalculator';
import { BASE_ACHIEVEMENTS } from '../services/achievementRegistry';
import { PersistenceService } from '../services/persistenceService';
import { SimulationEngine } from '../simulation/simulationEngine';
import { RootrangeSaveState } from '../types/progression';

describe('ROOTRANGE Phase 8: CTF Progression, XP, Ranks, Flags & Achievements', () => {
  beforeEach(async () => {
    const engine = SimulationEngine.getInstance();
    engine.resetRange();
    await PersistenceService.clearState();

    useGameStore.setState({
      score: 0,
      rank: 'Script Kiddie',
      activeMachineId: 'ecorp-hr',
      machines: JSON.parse(JSON.stringify(INITIAL_MACHINES)),
      claimedFlags: [],
      events: [],
      evidence: [],
      achievements: BASE_ACHIEVEMENTS.map((a) => ({ ...a, unlocked: false })),
      unlockedAchievements: [],
    });
  });

  describe('1. Flag Verification, Points & Duplicate Prevention', () => {
    it('claims a User Flag and awards points exactly once', () => {
      const ecorp = INITIAL_MACHINES[0];
      const res1 = useGameStore.getState().submitFlag(ecorp.userFlag);

      expect(res1.success).toBe(true);
      expect(res1.pointsAwarded).toBe(20);
      expect(res1.flagType).toBe('user');
      expect(useGameStore.getState().score).toBe(20);
      expect(useGameStore.getState().claimedFlags).toContain(ecorp.userFlag);

      // Verify machine userClaimed updated
      const machine = useGameStore.getState().machines.find((m) => m.id === 'ecorp-hr');
      expect(machine?.userClaimed).toBe(true);
      expect(machine?.compromiseLevel).toBe('USER');
    });

    it('claims a Root Flag and marks machine as ROOT compromise level', () => {
      const ecorp = INITIAL_MACHINES[0];
      const res = useGameStore.getState().submitFlag(ecorp.rootFlag);

      expect(res.success).toBe(true);
      expect(res.pointsAwarded).toBe(30);
      expect(res.flagType).toBe('root');
      expect(useGameStore.getState().score).toBe(30);

      const machine = useGameStore.getState().machines.find((m) => m.id === 'ecorp-hr');
      expect(machine?.rootClaimed).toBe(true);
      expect(machine?.compromiseLevel).toBe('ROOT');
    });

    it('strictly prevents duplicate flag submissions and awards 0 duplicate points', () => {
      const ecorp = INITIAL_MACHINES[0];
      useGameStore.getState().submitFlag(ecorp.userFlag);
      const initialScore = useGameStore.getState().score;

      // Duplicate submission
      const res2 = useGameStore.getState().submitFlag(ecorp.userFlag);
      expect(res2.success).toBe(false);
      expect(res2.pointsAwarded).toBe(0);
      expect(res2.message).toContain('already been submitted');
      expect(useGameStore.getState().score).toBe(initialScore);
    });

    it('rejects invalid or hallucinated flag tokens', () => {
      const res = useGameStore.getState().submitFlag('ROOTRANGE{fake_token_12345}');
      expect(res.success).toBe(false);
      expect(res.pointsAwarded).toBe(0);
      expect(res.message).toContain('Invalid flag token');
    });

    it('supports Special Challenge Flags and Final Range Master flag', () => {
      // Special SQLi challenge flag
      const sqliFlag = 'ROOTRANGE{sqli_bypass_audit_master}';
      const resSqli = useGameStore.getState().submitFlag(sqliFlag);
      expect(resSqli.success).toBe(true);
      expect(resSqli.pointsAwarded).toBe(15);
      expect(resSqli.flagType).toBe('challenge');

      // Final Range Master Flag
      const finalFlag = 'ROOTRANGE{range_master_omni_god_certified}';
      const resFinal = useGameStore.getState().submitFlag(finalFlag);
      expect(resFinal.success).toBe(true);
      expect(resFinal.pointsAwarded).toBe(50);
      expect(resFinal.flagType).toBe('final');
    });

    it('warns when submitting a flag with mismatched machine filter', () => {
      const ironFlag = 'ROOTRANGE{u53r_jwt_f0rg3ry_b4nk_l00t}';
      const verifyMismatched = FlagRegistry.verifyFlag(ironFlag, 'ecorp-hr');
      expect(verifyMismatched.valid).toBe(false);
      expect(verifyMismatched.message).toContain('belongs to a different machine (iron-vault)');

      const verifyMatching = FlagRegistry.verifyFlag(ironFlag, 'iron-vault');
      expect(verifyMatching.valid).toBe(true);
    });
  });

  describe('2. XP Progression Formula & Rank Tiers', () => {
    it('implements the 5 canonical hacker ranks across XP thresholds', () => {
      // Tier 1: Script Kiddie (0 - 19)
      expect(ProgressionCalculator.calculateRank(0).title).toBe('Script Kiddie');
      expect(ProgressionCalculator.calculateRank(19).title).toBe('Script Kiddie');

      // Tier 2: Hacker (20 - 54)
      expect(ProgressionCalculator.calculateRank(20).title).toBe('Hacker');
      expect(ProgressionCalculator.calculateRank(54).title).toBe('Hacker');

      // Tier 3: Pro Hacker (55 - 104)
      expect(ProgressionCalculator.calculateRank(55).title).toBe('Pro Hacker');
      expect(ProgressionCalculator.calculateRank(104).title).toBe('Pro Hacker');

      // Tier 4: Elite (105 - 154)
      expect(ProgressionCalculator.calculateRank(105).title).toBe('Elite');
      expect(ProgressionCalculator.calculateRank(154).title).toBe('Elite');

      // Tier 5: Omni God (155+)
      expect(ProgressionCalculator.calculateRank(155).title).toBe('Omni God');
      expect(ProgressionCalculator.calculateRank(999).title).toBe('Omni God');
    });

    it('accurately calculates next rank distance and progress percentage', () => {
      // At 0 XP -> Next is Hacker (20 XP needed), 0%
      const info0 = ProgressionCalculator.getNextRankInfo(0);
      expect(info0.nextRank?.title).toBe('Hacker');
      expect(info0.xpNeeded).toBe(20);
      expect(info0.progressPercent).toBe(0);

      // At 10 XP -> Next is Hacker (10 XP needed), 50%
      const info10 = ProgressionCalculator.getNextRankInfo(10);
      expect(info10.xpNeeded).toBe(10);
      expect(info10.progressPercent).toBe(50);

      // At 155 XP -> Max rank reached
      const infoMax = ProgressionCalculator.getNextRankInfo(155);
      expect(infoMax.nextRank).toBeNull();
      expect(infoMax.xpNeeded).toBe(0);
      expect(infoMax.progressPercent).toBe(100);
    });

    it('derives comprehensive progression metrics via calculateStats', () => {
      useGameStore.getState().submitFlag(INITIAL_MACHINES[0].userFlag); // +20
      useGameStore.getState().submitFlag(INITIAL_MACHINES[0].rootFlag); // +30

      const state = useGameStore.getState();
      const stats = ProgressionCalculator.calculateStats(
        state.score,
        state.claimedFlags,
        state.machines,
        state.achievements
      );

      expect(stats.currentXp).toBe(50);
      expect(stats.currentRank).toBe('Hacker');
      expect(stats.nextRank).toBe('Pro Hacker');
      expect(stats.xpToNextRank).toBe(5); // 55 - 50 = 5
      expect(stats.claimedFlagsCount).toBe(2);
      expect(stats.userFlagsClaimed).toBe(1);
      expect(stats.rootFlagsClaimed).toBe(1);
      expect(stats.rootedMachinesCount).toBe(1);
    });
  });

  describe('3. Event-Driven & State-Based Achievements', () => {
    it('unlocks "First Blood" achievement on initial user flag claim', () => {
      expect(useGameStore.getState().unlockedAchievements).not.toContain('first-blood');

      useGameStore.getState().submitFlag(INITIAL_MACHINES[0].userFlag);

      expect(useGameStore.getState().unlockedAchievements).toContain('first-blood');
      const ach = useGameStore.getState().achievements.find((a) => a.id === 'first-blood');
      expect(ach?.unlocked).toBe(true);
    });

    it('unlocks "Privilege Escalation" achievement on root flag claim', () => {
      useGameStore.getState().submitFlag(INITIAL_MACHINES[0].rootFlag);

      expect(useGameStore.getState().unlockedAchievements).toContain('privilege-escalation');
      const ach = useGameStore.getState().achievements.find((a) => a.id === 'privilege-escalation');
      expect(ach?.unlocked).toBe(true);
    });

    it('unlocks "Full Compromise" achievement when 2 machines are fully rooted', () => {
      // E-Corp HR
      useGameStore.getState().submitFlag(INITIAL_MACHINES[0].userFlag);
      useGameStore.getState().submitFlag(INITIAL_MACHINES[0].rootFlag);

      // IronBank
      useGameStore.getState().submitFlag(INITIAL_MACHINES[1].userFlag);
      useGameStore.getState().submitFlag(INITIAL_MACHINES[1].rootFlag);

      expect(useGameStore.getState().unlockedAchievements).toContain('full-compromise');
    });

    it('unlocks "Range Master" achievement when all 3 machines are fully rooted', () => {
      // 1. E-Corp HR
      useGameStore.getState().submitFlag(INITIAL_MACHINES[0].userFlag);
      useGameStore.getState().submitFlag(INITIAL_MACHINES[0].rootFlag);

      // 2. IronBank
      useGameStore.getState().submitFlag(INITIAL_MACHINES[1].userFlag);
      useGameStore.getState().submitFlag(INITIAL_MACHINES[1].rootFlag);

      // 3. Corp-DC01
      useGameStore.getState().submitFlag(INITIAL_MACHINES[2].userFlag);
      useGameStore.getState().submitFlag(INITIAL_MACHINES[2].rootFlag);

      expect(useGameStore.getState().unlockedAchievements).toContain('range-master');
      expect(useGameStore.getState().rank).toBe('Omni God');
    });
  });

  describe('4. Persistence with IndexedDB and Versioned Schema Validation', () => {
    it('persists game state and successfully hydrates from storage', async () => {
      useGameStore.getState().submitFlag(INITIAL_MACHINES[0].userFlag);
      const stateToSave = useGameStore.getState().exportState();

      await PersistenceService.saveState(stateToSave);

      const loaded = await PersistenceService.loadState();
      expect(loaded).not.toBeNull();
      expect(loaded?.score).toBe(20);
      expect(loaded?.version).toBe(1);
      expect(loaded?.claimedFlags).toContain(INITIAL_MACHINES[0].userFlag);
    });

    it('validates version 1 schema and rejects unsupported versions', () => {
      const validPayload: RootrangeSaveState = {
        version: 1,
        timestamp: Date.now(),
        score: 100,
        rank: 'Pro Hacker',
        claimedFlags: ['ROOTRANGE{test}'],
        unlockedAchievements: ['first-blood'],
        activeMachineId: 'ecorp-hr',
        machines: [{ id: 'ecorp-hr', compromiseLevel: 'USER', userClaimed: true, rootClaimed: false }],
        evidence: [],
        events: [],
      };

      const resValid = PersistenceService.validateSaveState(validPayload);
      expect(resValid.valid).toBe(true);

      const invalidVersion = { ...validPayload, version: 2 };
      const resInvalid = PersistenceService.validateSaveState(invalidVersion);
      expect(resInvalid.valid).toBe(false);
      expect(resInvalid.error).toContain('Unsupported save schema version: 2');
    });

    it('rejects corrupted save data with negative score or non-array flags', () => {
      const corrupted1 = { version: 1, score: -50, claimedFlags: [] };
      expect(PersistenceService.validateSaveState(corrupted1).valid).toBe(false);

      const corrupted2 = { version: 1, score: 50, claimedFlags: 'not-an-array' };
      expect(PersistenceService.validateSaveState(corrupted2).valid).toBe(false);
    });

    it('exports save state to clean JSON string and re-imports accurately', () => {
      useGameStore.getState().submitFlag(INITIAL_MACHINES[0].userFlag);
      const exported = useGameStore.getState().exportState();
      const jsonStr = PersistenceService.exportStateToJson(exported);

      const parseRes = PersistenceService.importStateFromJson(jsonStr);
      expect(parseRes.valid).toBe(true);
      expect(parseRes.validatedState?.score).toBe(20);
    });

    it('gracefully handles malformed JSON string on import', () => {
      const badJson = '{ version: 1, broken_json: ';
      const parseRes = PersistenceService.importStateFromJson(badJson);
      expect(parseRes.valid).toBe(false);
      expect(parseRes.error).toContain('JSON parse failure');
    });
  });

  describe('5. Reset Behavior', () => {
    it('resets machine flags and recalculates score accordingly', () => {
      useGameStore.getState().submitFlag(INITIAL_MACHINES[0].userFlag); // +20
      useGameStore.getState().submitFlag(INITIAL_MACHINES[1].userFlag); // +25
      expect(useGameStore.getState().score).toBe(45);

      // Reset ecorp-hr
      useGameStore.getState().resetMachine('ecorp-hr');

      expect(useGameStore.getState().score).toBe(25);
      expect(useGameStore.getState().claimedFlags).not.toContain(INITIAL_MACHINES[0].userFlag);
      expect(useGameStore.getState().claimedFlags).toContain(INITIAL_MACHINES[1].userFlag);
    });

    it('resets the full cyber range and purges persisted storage', async () => {
      useGameStore.getState().submitFlag(INITIAL_MACHINES[0].userFlag);
      useGameStore.getState().resetGame();

      expect(useGameStore.getState().score).toBe(0);
      expect(useGameStore.getState().rank).toBe('Script Kiddie');
      expect(useGameStore.getState().claimedFlags.length).toBe(0);

      const persisted = await PersistenceService.loadState();
      expect(persisted).toBeNull();
    });
  });
});
