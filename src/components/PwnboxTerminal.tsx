import React, { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, Sparkles, CornerDownLeft, Volume2, VolumeX, ShieldAlert } from 'lucide-react';
import { CommandInterpreter, CommandContext } from '../services/commandInterpreter';
import { CommandRegistry } from '../services/commandRegistry';
import { VirtualFileSystem } from '../services/virtualFs';
import { soundManager } from '../audio/soundManager';
import { useGameStore } from '../store/gameStore';

interface TerminalLine {
  type: 'input' | 'output' | 'system' | 'prompt';
  text: string;
}

function getCommonPrefix(strings: string[]): string {
  if (strings.length === 0) return '';
  let prefix = strings[0];
  for (let i = 1; i < strings.length; i++) {
    while (!strings[i].startsWith(prefix)) {
      prefix = prefix.slice(0, -1);
      if (!prefix) return '';
    }
  }
  return prefix;
}

export const PwnboxTerminal: React.FC = () => {
  const { activeMachineId, machines, updateCompromiseLevel, submitFlag } = useGameStore();
  const activeTarget = machines.find((m) => m.id === activeMachineId) || machines[0];

  const [fs] = useState<VirtualFileSystem>(() => new VirtualFileSystem());
  const [user, setUser] = useState<string>('kali');
  const [hostname, setHostname] = useState<string>('pwnbox');
  const [cwd, setCwd] = useState<string>('/home/kali');
  const [inReverseShell, setInReverseShell] = useState<boolean>(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [input, setInput] = useState<string>('');
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const [lines, setLines] = useState<TerminalLine[]>([
    { type: 'system', text: '╔═════════════════════════════════════════════════════════════════════════╗' },
    { type: 'system', text: '║  ROOTRANGE PWNBOX // KALI OFFENSIVE ENVIRONMENT v2026.1 (x86_64)        ║' },
    { type: 'system', text: '║  Target Active: ' + activeTarget.name + ' (' + activeTarget.ip + ')                ║' },
    { type: 'system', text: '║  Type "help" or click tactical shortcut pills to begin penetration test. ║' },
    { type: 'system', text: '╚═════════════════════════════════════════════════════════════════════════╝' },
  ]);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  const handleCommandSubmit = (commandText: string) => {
    soundManager.playKey();
    const raw = commandText.trim();
    if (!raw) return;

    const promptText = inReverseShell
      ? `${user}@${hostname}:${cwd}${user === 'root' ? '#' : '$'} ${raw}`
      : `┌──(${user}㉿${hostname})-[${cwd}]\n└─${user === 'root' ? '#' : '$'} ${raw}`;

    const ctx: CommandContext = {
      user,
      hostname,
      cwd,
      fs,
      activeTarget,
      history,
      inReverseShell,
      reverseShellUser: user,
      reverseShellHost: hostname,
    };

    const result = CommandInterpreter.execute(raw, ctx);

    if (result.soundTrigger === 'connect') soundManager.playConnect();
    if (result.soundTrigger === 'scan') soundManager.playScanPing();
    if (result.soundTrigger === 'flag') soundManager.playFlagSuccess();

    if (result.targetCompromised) {
      updateCompromiseLevel(activeTarget.id, result.targetCompromised);
    }

    // Auto-capture flag if flag is printed in terminal output
    if (result.output.includes('ROOTRANGE{')) {
      const match = result.output.match(/ROOTRANGE\{[^}]+\}/);
      if (match) {
        submitFlag(match[0]);
      }
    }

    if (result.clear) {
      setLines([]);
    } else {
      const newLines: TerminalLine[] = [
        ...lines,
        { type: 'prompt', text: promptText },
      ];
      if (result.output) {
        newLines.push({ type: 'output', text: result.output });
      }
      setLines(newLines);
    }

    if (result.newCwd) {
      setCwd(result.newCwd);
    }

    if (result.enterShell) {
      setUser(result.enterShell.user);
      setHostname(result.enterShell.host);
      setCwd(result.enterShell.cwd);
      setInReverseShell(true);
    }

    if (result.exitShell) {
      setUser('kali');
      setHostname('pwnbox');
      setCwd('/home/kali');
      setInReverseShell(false);
    }

    setHistory((prev) => [...prev, raw]);
    setHistoryIndex(-1);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      const nextIdx = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIdx);
      setInput(history[nextIdx] || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      const nextIdx = historyIndex + 1;
      if (nextIdx >= history.length) {
        setHistoryIndex(-1);
        setInput('');
      } else {
        setHistoryIndex(nextIdx);
        setInput(history[nextIdx] || '');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      soundManager.playKey();

      const currentVal = input;
      if (!currentVal.trim()) return;

      const parts = currentVal.split(' ');
      if (parts.length === 1) {
        // Autocomplete command name
        const prefix = parts[0].toLowerCase();
        const availableCommands = CommandRegistry.getAllCommands();
        const matches = availableCommands.filter((c) => c.startsWith(prefix));
        if (matches.length === 1) {
          setInput(matches[0] + ' ');
        } else if (matches.length > 1) {
          const common = getCommonPrefix(matches);
          if (common && common.length > prefix.length) {
            setInput(common);
          } else {
            setLines((prev) => [
              ...prev,
              { type: 'prompt', text: `${user}@${hostname}:${cwd}$ ${currentVal}` },
              { type: 'output', text: matches.join('   ') },
            ]);
          }
        }
      } else {
        // Autocomplete filesystem path
        const lastPart = parts[parts.length - 1];
        const matches = fs.getCompletions(cwd, lastPart);
        if (matches.length === 1) {
          parts[parts.length - 1] = matches[0];
          setInput(parts.join(' ') + (matches[0].endsWith('/') ? '' : ' '));
        } else if (matches.length > 1) {
          const common = getCommonPrefix(matches);
          if (common && common.length > lastPart.length) {
            parts[parts.length - 1] = common;
            setInput(parts.join(' '));
          } else {
            setLines((prev) => [
              ...prev,
              { type: 'prompt', text: `${user}@${hostname}:${cwd}$ ${currentVal}` },
              { type: 'output', text: matches.join('   ') },
            ]);
          }
        }
      }
    }
  };

  const executeShortcut = (cmd: string) => {
    setInput(cmd);
    handleCommandSubmit(cmd);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full bg-[#070a0f] border border-slate-800 rounded-lg overflow-hidden font-mono shadow-2xl">
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#0e141f] border-b border-slate-800 text-xs">
        <div className="flex items-center space-x-2">
          <TerminalIcon className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-slate-200">
            {inReverseShell ? (
              <span className="text-red-400 font-extrabold flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                SHELL: {user}@{hostname} (REVERSE TCP ATTACHED)
              </span>
            ) : (
              <span>kali@pwnbox (10.10.14.22)</span>
            )}
          </span>
        </div>

        {/* Audio Toggle & Target Info */}
        <div className="flex items-center space-x-3 text-[11px]">
          <span className="text-slate-400">
            TARGET: <strong className="text-emerald-400">{activeTarget.ip}</strong>
          </span>
          <button
            onClick={() => {
              const muted = soundManager.toggleMute();
              setIsMuted(muted);
            }}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Quick Exploitation Shortcuts Pills */}
      <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#090d14] border-b border-slate-800/60 overflow-x-auto text-[10px]">
        <span className="text-slate-500 font-bold flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-cyan-400" /> SHORTCUTS:
        </span>
        <button
          onClick={() => executeShortcut(`nmap -sV -sC ${activeTarget.ip}`)}
          className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 hover:border-cyan-500/60 text-slate-300 hover:text-cyan-300 whitespace-nowrap"
        >
          1. Nmap Scan
        </button>
        <button
          onClick={() => executeShortcut(`gobuster dir -u http://${activeTarget.ip} -w common.txt`)}
          className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 hover:border-cyan-500/60 text-slate-300 hover:text-cyan-300 whitespace-nowrap"
        >
          2. Gobuster Dir
        </button>
        <button
          onClick={() => executeShortcut('nc -lvnp 4444')}
          className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 hover:border-emerald-500/60 text-slate-300 hover:text-emerald-300 whitespace-nowrap"
        >
          3. Catch Reverse Shell
        </button>
        {inReverseShell && user !== 'root' && (
          <button
            onClick={() => executeShortcut('cat /home/alex/user.txt')}
            className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800 hover:border-amber-400 text-amber-300 whitespace-nowrap"
          >
            4. Cat User Flag
          </button>
        )}
        {inReverseShell && user !== 'root' && (
          <button
            onClick={() => executeShortcut('sudo -l')}
            className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 hover:border-purple-500/60 text-slate-300 hover:text-purple-300 whitespace-nowrap"
          >
            5. Check Sudo Privs
          </button>
        )}
        {inReverseShell && user !== 'root' && (
          <button
            onClick={() => executeShortcut('sudo /usr/bin/find . -exec /bin/sh \\; -quit')}
            className="px-2 py-0.5 rounded bg-red-950/60 border border-red-800 hover:border-red-500 text-red-300 font-bold whitespace-nowrap"
          >
            6. Exploit Sudo Find (Root Privesc)
          </button>
        )}
        {inReverseShell && user === 'root' && (
          <button
            onClick={() => executeShortcut('cat /root/root.txt')}
            className="px-2 py-0.5 rounded bg-red-950/80 border border-red-500 text-red-200 font-bold whitespace-nowrap animate-pulse"
          >
            7. Cat Root Flag!
          </button>
        )}
      </div>

      {/* Terminal Output Buffer */}
      <div
        className="flex-1 p-3 overflow-y-auto space-y-1 text-xs select-text"
        onClick={() => inputRef.current?.focus()}
      >
        {lines.map((line, idx) => (
          <div
            key={idx}
            className={`whitespace-pre-wrap leading-relaxed ${
              line.type === 'system'
                ? 'text-cyan-400 font-bold'
                : line.type === 'prompt'
                ? 'text-emerald-400 font-bold mt-1.5'
                : 'text-slate-300'
            }`}
          >
            {line.text}
          </div>
        ))}
        <div ref={terminalEndRef} />
      </div>

      {/* Interactive Command Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleCommandSubmit(input);
        }}
        className="flex items-center px-3 py-2 bg-[#0a0f17] border-t border-slate-800/80"
      >
        <span className="text-emerald-400 font-bold select-none mr-2 whitespace-nowrap">
          {inReverseShell
            ? `${user}@${hostname}:${cwd}${user === 'root' ? '#' : '$'} `
            : `┌──(${user}㉿${hostname})-[${cwd}]$ `}
        </span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => {
            soundManager.playKey();
            setInput(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Enter offensive command (e.g. nmap, gobuster, help)..."
          className="flex-1 bg-transparent border-none outline-none text-slate-100 font-mono text-xs focus:ring-0 placeholder-slate-600"
          autoFocus
          spellCheck={false}
          autoComplete="off"
        />
        <button type="submit" className="text-slate-500 hover:text-emerald-400">
          <CornerDownLeft className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
