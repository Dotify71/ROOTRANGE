import { TargetMachine } from '../types';
import { AchievementDefinition } from '../types/progression';
import { SimulationEngine } from '../simulation/simulationEngine';
import { SimulationEvent } from '../simulation/types';

export interface AchievementEvaluationContext {
  score: number;
  claimedFlags: string[];
  machines: TargetMachine[];
  events: SimulationEvent[];
  engine: SimulationEngine;
}

export const BASE_ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'first-blood',
    title: 'First Blood',
    description: 'Captured your first User flag on any simulated target container.',
    points: 20,
    category: 'EXPLOIT',
    iconName: 'Flame',
    unlocked: false,
  },
  {
    id: 'recon-specialist',
    title: 'Recon Specialist',
    description: 'Completed port enumeration across the range, discovering at least 8 services.',
    points: 15,
    category: 'RECON',
    iconName: 'Radar',
    unlocked: false,
  },
  {
    id: 'web-hunter',
    title: 'Web Hunter',
    description: 'Discovered 5 or more web routes using directory fuzzing or the HTTP Repeater.',
    points: 20,
    category: 'EXPLOIT',
    iconName: 'Globe',
    unlocked: false,
  },
  {
    id: 'privilege-escalation',
    title: 'Privilege Escalation',
    description: 'Escalated privileges to root or system administrator on any target.',
    points: 30,
    category: 'PRIVESC',
    iconName: 'TrendingUp',
    unlocked: false,
  },
  {
    id: 'domain-explorer',
    title: 'Domain Explorer',
    description: 'Audited Active Directory Kerberos and SMB infrastructure on Corp-DC01.',
    points: 25,
    category: 'DOMAIN',
    iconName: 'Network',
    unlocked: false,
  },
  {
    id: 'ghost-in-the-shell',
    title: 'Ghost in the Shell',
    description: 'Successfully triggered Log4Shell JNDI injection or SQL injection auth bypass.',
    points: 25,
    category: 'EXPLOIT',
    iconName: 'Terminal',
    unlocked: false,
  },
  {
    id: 'full-compromise',
    title: 'Full Compromise',
    description: 'Completely rooted at least two target machines with both user and root flags.',
    points: 40,
    category: 'MASTERY',
    iconName: 'ShieldAlert',
    unlocked: false,
  },
  {
    id: 'range-master',
    title: 'Range Master',
    description: 'Achieved 100% total cyber range victory by conquering all 3 target machines.',
    points: 50,
    category: 'MASTERY',
    iconName: 'Trophy',
    unlocked: false,
  },
];

export class AchievementRegistry {
  /**
   * Evaluates all achievements against explicit state and event rules.
   * Returns newly unlocked achievements that were not previously unlocked.
   */
  public static evaluateAll(
    ctx: AchievementEvaluationContext,
    unlockedIds: Set<string>
  ): {
    updatedAchievements: AchievementDefinition[];
    newlyUnlocked: AchievementDefinition[];
  } {
    const newlyUnlocked: AchievementDefinition[] = [];

    // Derive metrics for evaluations
    const userFlagsClaimed = ctx.machines.filter((m) => m.userClaimed).length;
    const rootFlagsClaimed = ctx.machines.filter((m) => m.rootClaimed).length;
    const bothClaimedCount = ctx.machines.filter((m) => m.userClaimed && m.rootClaimed).length;

    // Discovered ports across simulation engine
    const allDiscoveredPorts = new Set<string>();
    const allDiscoveredRoutes = new Set<string>();

    for (const machine of ctx.engine.getMachines()) {
      const discoveredPorts = ctx.engine.getDiscoveredPorts(machine.id);
      for (const portNum of discoveredPorts) {
        allDiscoveredPorts.add(`${machine.id}:${portNum}`);
      }
      const discoveredRoutes = ctx.engine.getDiscoveredRoutes(machine.id);
      for (const routePath of discoveredRoutes) {
        allDiscoveredRoutes.add(`${machine.id}:${routePath}`);
      }
    }

    // Also check event occurrences
    const hasVulnEvent = ctx.events.some(
      (e) =>
        e.type === 'VULNERABILITY_IDENTIFIED' ||
        (e.type === 'INITIAL_ACCESS_GRANTED' &&
          (e.machineId === 'ecorp-hr' || e.machineId === 'iron-vault'))
    );

    const hasDcDiscovery =
      allDiscoveredPorts.has('corp-dc01:88') ||
      allDiscoveredPorts.has('corp-dc01:445') ||
      ctx.events.some(
        (e) =>
          e.machineId === 'corp-dc01' &&
          (e.type === 'SERVICE_DISCOVERED' ||
            e.type === 'FLAG_CAPTURED' ||
            e.type === 'INITIAL_ACCESS_GRANTED')
      );

    const updatedAchievements = BASE_ACHIEVEMENTS.map((def) => {
      let isUnlocked = unlockedIds.has(def.id);

      if (!isUnlocked) {
        switch (def.id) {
          case 'first-blood':
            isUnlocked = userFlagsClaimed > 0 || ctx.claimedFlags.length > 0;
            break;

          case 'recon-specialist':
            isUnlocked = allDiscoveredPorts.size >= 8;
            break;

          case 'web-hunter':
            isUnlocked = allDiscoveredRoutes.size >= 5;
            break;

          case 'privilege-escalation':
            isUnlocked =
              rootFlagsClaimed > 0 ||
              ctx.machines.some((m) => m.compromiseLevel === 'ROOT') ||
              ctx.events.some((e) => e.type === 'PRIVILEGE_ESCALATED');
            break;

          case 'domain-explorer':
            isUnlocked = hasDcDiscovery;
            break;

          case 'ghost-in-the-shell':
            isUnlocked = hasVulnEvent;
            break;

          case 'full-compromise':
            isUnlocked = bothClaimedCount >= 2;
            break;

          case 'range-master':
            isUnlocked =
              ctx.machines.length >= 3 &&
              ctx.machines.every((m) => m.userClaimed && m.rootClaimed);
            break;

          default:
            break;
        }

        if (isUnlocked && !unlockedIds.has(def.id)) {
          newlyUnlocked.push({
            ...def,
            unlocked: true,
            unlockedAt: Date.now(),
          });
        }
      }

      return {
        ...def,
        unlocked: isUnlocked,
        unlockedAt: isUnlocked ? def.unlockedAt || Date.now() : undefined,
      };
    });

    return {
      updatedAchievements,
      newlyUnlocked,
    };
  }
}
