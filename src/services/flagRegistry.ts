import { FlagDefinition } from '../types/progression';

export const ALL_FLAGS: FlagDefinition[] = [
  // E-Corp HR
  {
    id: 'flag-ecorp-user',
    flag: 'ROOTRANGE{u53r_l0g4j_f00th0ld_pwn3d}',
    machineId: 'ecorp-hr',
    type: 'user',
    title: 'E-Corp HR Initial Access (User Flag)',
    description: 'Extracted from /home/alex/user.txt after triggering Log4j remote code execution.',
    points: 20,
  },
  {
    id: 'flag-ecorp-root',
    flag: 'ROOTRANGE{r00t_pr1v3sc_m4st3r_c0mpr0m1s3}',
    machineId: 'ecorp-hr',
    type: 'root',
    title: 'E-Corp HR System Rooted (Root Flag)',
    description: 'Extracted from /root/root.txt after exploiting sudo privileges on /usr/bin/find.',
    points: 30,
  },
  {
    id: 'flag-ecorp-jndi',
    flag: 'ROOTRANGE{log4j_jndi_payload_craft}',
    machineId: 'ecorp-hr',
    type: 'challenge',
    title: 'Special Challenge: JNDI Payload Crafter',
    description: 'Discovered by analyzing the Log4j audit logging endpoint vulnerability vector.',
    points: 15,
  },

  // IronBank Vault
  {
    id: 'flag-iron-user',
    flag: 'ROOTRANGE{u53r_jwt_f0rg3ry_b4nk_l00t}',
    machineId: 'iron-vault',
    type: 'user',
    title: 'IronBank Financial Ledger Access (User Flag)',
    description: 'Extracted from confidential banking records after forging an unsigned JWT token.',
    points: 25,
  },
  {
    id: 'flag-iron-root',
    flag: 'ROOTRANGE{r00t_cr0n_ov3rwr1t3_pwn4g3}',
    machineId: 'iron-vault',
    type: 'root',
    title: 'IronBank Server Rooted (Root Flag)',
    description: 'Extracted from /root/root.txt after hijacking the root-owned scheduled backup script.',
    points: 35,
  },
  {
    id: 'flag-iron-sqli',
    flag: 'ROOTRANGE{sqli_bypass_audit_master}',
    machineId: 'iron-vault',
    type: 'challenge',
    title: 'Special Challenge: SQLi Authentication Bypass',
    description: 'Awarded for bypassing backend SQL query verification on the banking login API.',
    points: 15,
  },

  // Corp-DC01
  {
    id: 'flag-dc-user',
    flag: 'ROOTRANGE{u53r_k3rb3r04st_t1ck3t_h4sh}',
    machineId: 'corp-dc01',
    type: 'user',
    title: 'OmniCorp Domain User (User Flag)',
    description: 'Recovered after Kerberoasting the MSSQL service account and cracking the TGS hash.',
    points: 30,
  },
  {
    id: 'flag-dc-root',
    flag: 'ROOTRANGE{r00t_d0m41n_4dm1n_g0d_m0d3}',
    machineId: 'corp-dc01',
    type: 'root',
    title: 'OmniCorp Domain Admin (Administrator Flag)',
    description: 'Captured via DCSync hash extraction and Pass-the-Hash SYSTEM execution.',
    points: 40,
  },
  {
    id: 'flag-dc-smb',
    flag: 'ROOTRANGE{eternalblue_ms17_010_smb_vuln}',
    machineId: 'corp-dc01',
    type: 'challenge',
    title: 'Special Challenge: MS17-010 EternalBlue Investigator',
    description: 'Discovered during SMB protocol banner audit and dialect negotiation probe.',
    points: 15,
  },

  // Final Range Flag
  {
    id: 'flag-range-final',
    flag: 'ROOTRANGE{range_master_omni_god_certified}',
    type: 'final',
    title: 'Range Master Final CTF Trophy',
    description: 'Awarded for achieving complete compromise across all machines in the ROOTRANGE cyber range.',
    points: 50,
  },
];

export class FlagRegistry {
  private static flags: Map<string, FlagDefinition> = new Map(
    ALL_FLAGS.map((f) => [f.flag.trim(), f])
  );

  public static getAllFlags(): FlagDefinition[] {
    return ALL_FLAGS;
  }

  public static getFlagByValue(flag: string): FlagDefinition | undefined {
    return this.flags.get(flag.trim());
  }

  public static getFlagsForMachine(machineId: string): FlagDefinition[] {
    return ALL_FLAGS.filter((f) => f.machineId === machineId);
  }

  public static verifyFlag(
    rawFlag: string,
    expectedMachineId?: string
  ): {
    valid: boolean;
    flagDef?: FlagDefinition;
    message: string;
  } {
    const trimmed = rawFlag.trim();
    const flagDef = this.flags.get(trimmed);

    if (!flagDef) {
      return {
        valid: false,
        message: 'Invalid flag format or unrecognized token. Flag tokens follow ROOTRANGE{...}.',
      };
    }

    if (expectedMachineId && flagDef.machineId && flagDef.machineId !== expectedMachineId) {
      return {
        valid: false,
        flagDef,
        message: `This flag belongs to a different machine (${flagDef.machineId}), not ${expectedMachineId}.`,
      };
    }

    return {
      valid: true,
      flagDef,
      message: `Verified: ${flagDef.title} (+${flagDef.points} PTS)`,
    };
  }
}
