import { VirtualFileSystem } from './virtualFs';
import { TargetMachine } from '../types';
import { ShellParser } from './shellParser';
import { CommandRegistry, ExecutionContext } from './commandRegistry';

export interface CommandContext {
  user: string;
  hostname: string;
  cwd: string;
  fs: VirtualFileSystem;
  activeTarget: TargetMachine | null;
  history: string[];
  inReverseShell: boolean;
  reverseShellUser?: string;
  reverseShellHost?: string;
  uid?: number;
  gid?: number;
  group?: string;
  groups?: string[];
  env?: Record<string, string>;
}

export interface CommandResult {
  output: string;
  newCwd?: string;
  clear?: boolean;
  enterShell?: { user: string; host: string; cwd: string };
  exitShell?: boolean;
  soundTrigger?: 'connect' | 'scan' | 'flag';
  targetCompromised?: 'RECON' | 'USER' | 'ROOT';
  exitCode?: number;
}

export class CommandInterpreter {
  /**
   * Resolve POSIX identity (uid, gid, group, groups) based on username
   */
  public static resolveUserIdentity(user: string): {
    uid: number;
    gid: number;
    group: string;
    groups: string[];
  } {
    switch (user) {
      case 'root':
        return { uid: 0, gid: 0, group: 'root', groups: ['root'] };
      case 'www-data':
        return { uid: 33, gid: 33, group: 'www-data', groups: ['www-data'] };
      case 'alex':
        return { uid: 1001, gid: 1001, group: 'alex', groups: ['alex'] };
      case 'kali':
      default:
        return { uid: 1000, gid: 1000, group: user, groups: [user, 'sudo', 'users'] };
    }
  }

  /**
   * Execute command string supporting arguments, quotes, pipelines, and redirection
   */
  public static execute(rawCommand: string, ctx: CommandContext): CommandResult {
    const trimmed = rawCommand.trim();
    if (!trimmed) return { output: '', exitCode: 0 };

    ctx.history.push(trimmed);

    const effectiveUser = (ctx.inReverseShell && ctx.reverseShellUser) ? ctx.reverseShellUser : ctx.user;
    const identity = this.resolveUserIdentity(effectiveUser);
    const uid = ctx.uid !== undefined ? ctx.uid : identity.uid;
    const gid = ctx.gid !== undefined ? ctx.gid : identity.gid;
    const group = ctx.group || identity.group;
    const groups = ctx.groups || identity.groups;

    const defaultEnv: Record<string, string> = {
      USER: effectiveUser,
      HOME: effectiveUser === 'root' ? '/root' : `/home/${effectiveUser}`,
      SHELL: '/bin/bash',
      TERM: 'xterm-256color',
      PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
      PWD: ctx.cwd,
      LANG: 'en_US.UTF-8',
    };

    const parsedPipeline = ShellParser.parse(trimmed);
    if (parsedPipeline.commands.length === 0) {
      return { output: '', exitCode: 0 };
    }

    let currentStdin = '';
    let lastStdout = '';
    let lastStderr = '';
    let lastExitCode = 0;
    let currentCwd = ctx.cwd;
    let shouldClear = false;
    let enterShell: CommandResult['enterShell'] = undefined;
    let exitShell = false;
    let soundTrigger: CommandResult['soundTrigger'] = undefined;
    let targetCompromised: CommandResult['targetCompromised'] = undefined;

    // Execute pipeline sequentially
    for (let i = 0; i < parsedPipeline.commands.length; i++) {
      const parsedCmd = parsedPipeline.commands[i];
      const handler = CommandRegistry.get(parsedCmd.command);

      const execCtx: ExecutionContext = {
        user: effectiveUser,
        uid,
        group,
        gid,
        groups,
        hostname: ctx.hostname,
        cwd: currentCwd,
        env: { ...defaultEnv, ...ctx.env, PWD: currentCwd },
        fs: ctx.fs,
        stdin: currentStdin,
        history: ctx.history,
        activeTarget: ctx.activeTarget,
        inReverseShell: ctx.inReverseShell,
      };

      if (!handler) {
        lastStderr = `${parsedCmd.command}: command not found`;
        lastExitCode = 127;
        currentStdin = '';
        lastStdout = '';
        break;
      }

      const out = handler(parsedCmd.args, execCtx);
      currentStdin = out.stdout;
      lastStdout = out.stdout;
      if (out.stderr) {
        lastStderr = out.stderr;
      }
      lastExitCode = out.exitCode;

      if (out.newCwd) currentCwd = out.newCwd;
      if (out.clear) shouldClear = true;
      if (out.enterShell) {
        enterShell = {
          user: out.enterShell.user,
          host: out.enterShell.host,
          cwd: out.enterShell.cwd,
        };
      }
      if (out.exitShell) exitShell = true;
      if (out.soundTrigger) soundTrigger = out.soundTrigger;
      if (out.targetCompromised) targetCompromised = out.targetCompromised;

      // In a pipeline, if early stage fails with error and no stdout, pipe terminates
      if (out.exitCode !== 0 && !out.stdout && i < parsedPipeline.commands.length - 1) {
        break;
      }
    }

    // Handle redirection (e.g. > file or >> file)
    if (parsedPipeline.redirectOutputFile) {
      const writeRes = ctx.fs.writeFile(
        currentCwd,
        parsedPipeline.redirectOutputFile,
        lastStdout + (lastStdout.endsWith('\n') ? '' : '\n'),
        uid,
        gid,
        parsedPipeline.appendOutput || false
      );

      if (!writeRes.success) {
        lastStderr = writeRes.error || `bash: ${parsedPipeline.redirectOutputFile}: cannot redirect output`;
        lastExitCode = 1;
      } else {
        lastStdout = ''; // bash redirects suppress stdout from terminal
      }
    }

    let finalOutput = '';
    if (lastStderr && lastStdout) {
      finalOutput = `${lastStderr}\n${lastStdout}`;
    } else if (lastStderr) {
      finalOutput = lastStderr;
    } else {
      finalOutput = lastStdout;
    }

    return {
      output: finalOutput,
      newCwd: currentCwd !== ctx.cwd ? currentCwd : undefined,
      clear: shouldClear,
      enterShell,
      exitShell,
      soundTrigger,
      targetCompromised,
      exitCode: lastExitCode,
    };
  }
}
