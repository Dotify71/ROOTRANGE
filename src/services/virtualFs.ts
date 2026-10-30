export interface FsNode {
  name: string;
  type: 'file' | 'dir';
  permissions: string; // e.g. 'drwxr-xr-x' or '-rw-r--r--'
  mode: number;        // octal permissions e.g. 0o755, 0o644, 0o600
  owner: string;
  uid: number;
  group: string;
  gid: number;
  size: number;
  mtime: Date;
  content?: string;
  children?: Record<string, FsNode>;
}

export class VirtualFileSystem {
  private root: FsNode;

  constructor() {
    this.root = this.createDefaultFilesystem();
  }

  private createDefaultFilesystem(): FsNode {
    const now = new Date('2026-10-29T06:00:00Z');

    return {
      name: '/',
      type: 'dir',
      permissions: 'drwxr-xr-x',
      mode: 0o755,
      owner: 'root',
      uid: 0,
      group: 'root',
      gid: 0,
      size: 4096,
      mtime: now,
      children: {
        bin: {
          name: 'bin',
          type: 'dir',
          permissions: 'drwxr-xr-x',
          mode: 0o755,
          owner: 'root',
          uid: 0,
          group: 'root',
          gid: 0,
          size: 4096,
          mtime: now,
          children: {
            bash: { name: 'bash', type: 'file', permissions: '-rwxr-xr-x', mode: 0o755, owner: 'root', uid: 0, group: 'root', gid: 0, size: 1234376, mtime: now },
            sh: { name: 'sh', type: 'file', permissions: '-rwxr-xr-x', mode: 0o755, owner: 'root', uid: 0, group: 'root', gid: 0, size: 1234376, mtime: now },
            cat: { name: 'cat', type: 'file', permissions: '-rwxr-xr-x', mode: 0o755, owner: 'root', uid: 0, group: 'root', gid: 0, size: 43400, mtime: now },
            ls: { name: 'ls', type: 'file', permissions: '-rwxr-xr-x', mode: 0o755, owner: 'root', uid: 0, group: 'root', gid: 0, size: 142000, mtime: now },
            grep: { name: 'grep', type: 'file', permissions: '-rwxr-xr-x', mode: 0o755, owner: 'root', uid: 0, group: 'root', gid: 0, size: 218000, mtime: now },
            find: { name: 'find', type: 'file', permissions: '-rwxr-xr-x', mode: 0o755, owner: 'root', uid: 0, group: 'root', gid: 0, size: 320000, mtime: now },
            head: { name: 'head', type: 'file', permissions: '-rwxr-xr-x', mode: 0o755, owner: 'root', uid: 0, group: 'root', gid: 0, size: 48000, mtime: now },
            tail: { name: 'tail', type: 'file', permissions: '-rwxr-xr-x', mode: 0o755, owner: 'root', uid: 0, group: 'root', gid: 0, size: 54000, mtime: now },
            stat: { name: 'stat', type: 'file', permissions: '-rwxr-xr-x', mode: 0o755, owner: 'root', uid: 0, group: 'root', gid: 0, size: 68000, mtime: now },
            nmap: { name: 'nmap', type: 'file', permissions: '-rwxr-xr-x', mode: 0o755, owner: 'root', uid: 0, group: 'root', gid: 0, size: 2841000, mtime: now },
            gobuster: { name: 'gobuster', type: 'file', permissions: '-rwxr-xr-x', mode: 0o755, owner: 'root', uid: 0, group: 'root', gid: 0, size: 8492000, mtime: now },
            hydra: { name: 'hydra', type: 'file', permissions: '-rwxr-xr-x', mode: 0o755, owner: 'root', uid: 0, group: 'root', gid: 0, size: 542000, mtime: now },
            nc: { name: 'nc', type: 'file', permissions: '-rwxr-xr-x', mode: 0o755, owner: 'root', uid: 0, group: 'root', gid: 0, size: 38400, mtime: now },
            curl: { name: 'curl', type: 'file', permissions: '-rwxr-xr-x', mode: 0o755, owner: 'root', uid: 0, group: 'root', gid: 0, size: 242000, mtime: now },
          },
        },
        etc: {
          name: 'etc',
          type: 'dir',
          permissions: 'drwxr-xr-x',
          mode: 0o755,
          owner: 'root',
          uid: 0,
          group: 'root',
          gid: 0,
          size: 4096,
          mtime: now,
          children: {
            passwd: {
              name: 'passwd',
              type: 'file',
              permissions: '-rw-r--r--',
              mode: 0o644,
              owner: 'root',
              uid: 0,
              group: 'root',
              gid: 0,
              size: 215,
              mtime: now,
              content: 'root:x:0:0:root:/root:/bin/bash\nkali:x:1000:1000:kali,,,:/home/kali:/bin/bash\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin\nfinance_admin:x:1002:1002:Finance Admin,,,:/home/finance_admin:/bin/bash\nnode_app:x:1004:1004:Node App User,,,:/opt/ironbank:/bin/false\nalex:x:1001:1001:Alex Morgan:/home/alex:/bin/bash',
            },
            shadow: {
              name: 'shadow',
              type: 'file',
              permissions: '-rw-r-----',
              mode: 0o640,
              owner: 'root',
              uid: 0,
              group: 'shadow',
              gid: 42,
              size: 340,
              mtime: now,
              content: 'root:$6$X9.zO1Qe$eF98A7m/qE59BfX2kH7u1wT0lU8bY4vQ9sW1aP5mK3rT8:19642:0:99999:7:::\nkali:$6$8zX7K9pQ$qM49B7m/xE59BfX2kH7u1wT0lU8bY4vQ9sW1aP5mK3rT8:19642:0:99999:7:::\nalex:$6$qP42A9vL$zM49B7m/aE59BfX2kH7u1wT0lU8bY4vQ9sW1aP5mK3rT8:19642:0:99999:7:::\nfinance_admin:$6$rK91B2m/xE59BfX2kH7u1wT0lU8bY4vQ9sW1aP5mK3rT8:19642:0:99999:7:::',
            },
            hosts: {
              name: 'hosts',
              type: 'file',
              permissions: '-rw-r--r--',
              mode: 0o644,
              owner: 'root',
              uid: 0,
              group: 'root',
              gid: 0,
              size: 260,
              mtime: now,
              content: '127.0.0.1\tlocalhost\n127.0.1.1\tkali-pwnbox\n10.10.11.45\tecorp-hr.htb\n10.10.11.82\tironbank.htb\n10.10.11.99\tomnicorp.local\tcorp-dc01.omnicorp.local',
            },
            sudoers: {
              name: 'sudoers',
              type: 'file',
              permissions: '-r--r-----',
              mode: 0o440,
              owner: 'root',
              uid: 0,
              group: 'root',
              gid: 0,
              size: 180,
              mtime: now,
              content: '# User privilege specification\nroot\tALL=(ALL:ALL) ALL\n%sudo\tALL=(ALL:ALL) ALL\nwww-data ALL=(ALL:ALL) NOPASSWD: /usr/bin/find',
            },
            'cron.d': {
              name: 'cron.d',
              type: 'dir',
              permissions: 'drwxr-xr-x',
              mode: 0o755,
              owner: 'root',
              uid: 0,
              group: 'root',
              gid: 0,
              size: 4096,
              mtime: now,
              children: {
                'vault-backup': {
                  name: 'vault-backup',
                  type: 'file',
                  permissions: '-rw-r--r--',
                  mode: 0o644,
                  owner: 'root',
                  uid: 0,
                  group: 'root',
                  gid: 0,
                  size: 65,
                  mtime: now,
                  content: '* * * * * root /opt/ironbank/scripts/backup.sh >/dev/null 2>&1\n',
                },
              },
            },
          },
        },
        var: {
          name: 'var',
          type: 'dir',
          permissions: 'drwxr-xr-x',
          mode: 0o755,
          owner: 'root',
          uid: 0,
          group: 'root',
          gid: 0,
          size: 4096,
          mtime: now,
          children: {
            log: {
              name: 'log',
              type: 'dir',
              permissions: 'drwxr-xr-x',
              mode: 0o755,
              owner: 'root',
              uid: 0,
              group: 'root',
              gid: 0,
              size: 4096,
              mtime: now,
              children: {
                'auth.log': {
                  name: 'auth.log',
                  type: 'file',
                  permissions: '-rw-r--r--',
                  mode: 0o644,
                  owner: 'root',
                  uid: 0,
                  group: 'adm',
                  gid: 4,
                  size: 320,
                  mtime: now,
                  content: 'Oct 29 06:12:01 ecorp-hr sshd[1042]: Accepted publickey for alex from 10.10.14.22 port 51220\nOct 29 06:14:22 ecorp-hr sudo: pam_unix(sudo:auth): authentication failure for www-data\nOct 29 06:15:00 ecorp-hr sudo: www-data : TTY=pts/0 ; PWD=/home/alex ; USER=root ; COMMAND=/usr/bin/find',
                },
                'syslog': {
                  name: 'syslog',
                  type: 'file',
                  permissions: '-rw-r--r--',
                  mode: 0o644,
                  owner: 'root',
                  uid: 0,
                  group: 'adm',
                  gid: 4,
                  size: 280,
                  mtime: now,
                  content: 'Oct 29 06:00:15 ecorp-hr systemd[1]: Started Apache HTTP Server.\nOct 29 06:01:00 ecorp-hr spring-boot[820]: Log4j Enterprise Auditing Daemon Initialized.',
                },
              },
            },
            www: {
              name: 'www',
              type: 'dir',
              permissions: 'drwxr-xr-x',
              mode: 0o755,
              owner: 'root',
              uid: 0,
              group: 'root',
              gid: 0,
              size: 4096,
              mtime: now,
              children: {
                html: {
                  name: 'html',
                  type: 'dir',
                  permissions: 'drwxr-xr-x',
                  mode: 0o755,
                  owner: 'www-data',
                  uid: 33,
                  group: 'www-data',
                  gid: 33,
                  size: 4096,
                  mtime: now,
                  children: {
                    'index.html': {
                      name: 'index.html',
                      type: 'file',
                      permissions: '-rw-r--r--',
                      mode: 0o644,
                      owner: 'www-data',
                      uid: 33,
                      group: 'www-data',
                      gid: 33,
                      size: 320,
                      mtime: now,
                      content: '<html><head><title>E-Corp Internal Portal</title></head><body><h1>E-Corp HR</h1><p>Logging powered by Log4j v2.14.1</p></body></html>',
                    },
                    'config.php': {
                      name: 'config.php',
                      type: 'file',
                      permissions: '-rw-r-----',
                      mode: 0o640,
                      owner: 'www-data',
                      uid: 33,
                      group: 'www-data',
                      gid: 33,
                      size: 240,
                      mtime: now,
                      content: '<?php\n$db_host = "10.10.11.82";\n$db_user = "ecorp_admin";\n$db_pass = "S3cur3P@ssw0rd!2026";\n$ldap_endpoint = "ldap://10.10.14.22:1389/Exploit";\n?>',
                    },
                  },
                },
              },
            },
          },
        },
        home: {
          name: 'home',
          type: 'dir',
          permissions: 'drwxr-xr-x',
          mode: 0o755,
          owner: 'root',
          uid: 0,
          group: 'root',
          gid: 0,
          size: 4096,
          mtime: now,
          children: {
            kali: {
              name: 'kali',
              type: 'dir',
              permissions: 'drwxr-xr-x',
              mode: 0o755,
              owner: 'kali',
              uid: 1000,
              group: 'kali',
              gid: 1000,
              size: 4096,
              mtime: now,
              children: {
                'notes.txt': {
                  name: 'notes.txt',
                  type: 'file',
                  permissions: '-rw-r--r--',
                  mode: 0o644,
                  owner: 'kali',
                  uid: 1000,
                  group: 'kali',
                  gid: 1000,
                  size: 240,
                  mtime: now,
                  content: 'TARGET RECON NOTES:\n- Subnet: 10.10.11.0/24\n- E-Corp HR Target: 10.10.11.45\n- Check HTTP headers for JNDI / Log4j vulnerabilities\n- Search GTFOBins for sudo privilege escalation',
                },
                wordlists: {
                  name: 'wordlists',
                  type: 'dir',
                  permissions: 'drwxr-xr-x',
                  mode: 0o755,
                  owner: 'kali',
                  uid: 1000,
                  group: 'kali',
                  gid: 1000,
                  size: 4096,
                  mtime: now,
                  children: {
                    'common.txt': {
                      name: 'common.txt',
                      type: 'file',
                      permissions: '-rw-r--r--',
                      mode: 0o644,
                      owner: 'kali',
                      uid: 1000,
                      group: 'kali',
                      gid: 1000,
                      size: 60,
                      mtime: now,
                      content: 'admin\napi\nbackup\nlogin\nportal\nuploads\nsecret',
                    },
                    'rockyou.txt': {
                      name: 'rockyou.txt',
                      type: 'file',
                      permissions: '-rw-r--r--',
                      mode: 0o644,
                      owner: 'kali',
                      uid: 1000,
                      group: 'kali',
                      gid: 1000,
                      size: 70,
                      mtime: now,
                      content: '123456\npassword\nadmin\nwelcome\nshadow\niloveyou\nqwerty\nroot',
                    },
                  },
                },
              },
            },
            alex: {
              name: 'alex',
              type: 'dir',
              permissions: 'drwxr-xr-x',
              mode: 0o755,
              owner: 'alex',
              uid: 1001,
              group: 'alex',
              gid: 1001,
              size: 4096,
              mtime: now,
              children: {
                'user.txt': {
                  name: 'user.txt',
                  type: 'file',
                  permissions: '-rw-r--r--',
                  mode: 0o644,
                  owner: 'alex',
                  uid: 1001,
                  group: 'alex',
                  gid: 1001,
                  size: 38,
                  mtime: now,
                  content: 'ROOTRANGE{u53r_l0g4j_f00th0ld_pwn3d}\n',
                },
                'notes.txt': {
                  name: 'notes.txt',
                  type: 'file',
                  permissions: '-rw-r--r--',
                  mode: 0o644,
                  owner: 'alex',
                  uid: 1001,
                  group: 'alex',
                  gid: 1001,
                  size: 140,
                  mtime: now,
                  content: 'NOTE TO DEV TEAM:\nApache Log4j enterprise logging is enabled.\nSysadmin added sudo permission for /usr/bin/find without password for cleanup.',
                },
                '.bash_history': {
                  name: '.bash_history',
                  type: 'file',
                  permissions: '-rw-------',
                  mode: 0o600,
                  owner: 'alex',
                  uid: 1001,
                  group: 'alex',
                  gid: 1001,
                  size: 85,
                  mtime: now,
                  content: 'sudo -l\nsudo /usr/bin/find . -exec /bin/sh \\; -quit\nexit',
                },
              },
            },
            finance_admin: {
              name: 'finance_admin',
              type: 'dir',
              permissions: 'drwxr-xr-x',
              mode: 0o755,
              owner: 'finance_admin',
              uid: 1002,
              group: 'finance_admin',
              gid: 1002,
              size: 4096,
              mtime: now,
              children: {
                'user.txt': {
                  name: 'user.txt',
                  type: 'file',
                  permissions: '-rw-r-----',
                  mode: 0o640,
                  owner: 'finance_admin',
                  uid: 1002,
                  group: 'finance_admin',
                  gid: 1002,
                  size: 38,
                  mtime: now,
                  content: 'ROOTRANGE{u53r_jwt_f0rg3ry_b4nk_l00t}\n',
                },
                'ledger_memo.txt': {
                  name: 'ledger_memo.txt',
                  type: 'file',
                  permissions: '-rw-r--r--',
                  mode: 0o644,
                  owner: 'finance_admin',
                  uid: 1002,
                  group: 'finance_admin',
                  gid: 1002,
                  size: 320,
                  mtime: now,
                  content: '[CONFIDENTIAL - FINANCIAL SYSTEMS TEAM]\nIronBank Core Ledger API running on port 8080 (Node.js/Express).\nDatabase: MySQL 8.0 on localhost:3306 (database: ironbank_db, user: ironbank_app).\nNotice: Periodic backup script /opt/ironbank/scripts/backup.sh is scheduled via /etc/cron.d/vault-backup every minute as root.\nDev team: please keep backup script updated.',
                },
                '.bash_history': {
                  name: '.bash_history',
                  type: 'file',
                  permissions: '-rw-------',
                  mode: 0o600,
                  owner: 'finance_admin',
                  uid: 1002,
                  group: 'finance_admin',
                  gid: 1002,
                  size: 95,
                  mtime: now,
                  content: 'ls -la /opt/ironbank\ncat /etc/cron.d/vault-backup\nmysql -u ironbank_app -p ironbank_db\nexit',
                },
              },
            },
          },
        },
        root: {
          name: 'root',
          type: 'dir',
          permissions: 'drwx------',
          mode: 0o700,
          owner: 'root',
          uid: 0,
          group: 'root',
          gid: 0,
          size: 4096,
          mtime: now,
          children: {
            'root.txt': {
              name: 'root.txt',
              type: 'file',
              permissions: '-rw-------',
              mode: 0o600,
              owner: 'root',
              uid: 0,
              group: 'root',
              gid: 0,
              size: 38,
              mtime: now,
              content: 'ROOTRANGE{r00t_pr1v3sc_m4st3r_c0mpr0m1s3}\n',
            },
            scripts: {
              name: 'scripts',
              type: 'dir',
              permissions: 'drwx------',
              mode: 0o700,
              owner: 'root',
              uid: 0,
              group: 'root',
              gid: 0,
              size: 4096,
              mtime: now,
              children: {
                'backup.sh': {
                  name: 'backup.sh',
                  type: 'file',
                  permissions: '-rwx------',
                  mode: 0o700,
                  owner: 'root',
                  uid: 0,
                  group: 'root',
                  gid: 0,
                  size: 120,
                  mtime: now,
                  content: '#!/bin/bash\ntar -czf /tmp/backup.tar.gz /var/www/html\n',
                },
              },
            },
          },
        },
        opt: {
          name: 'opt',
          type: 'dir',
          permissions: 'drwxr-xr-x',
          mode: 0o755,
          owner: 'root',
          uid: 0,
          group: 'root',
          gid: 0,
          size: 4096,
          mtime: now,
          children: {
            ecorp: {
              name: 'ecorp',
              type: 'dir',
              permissions: 'drwxr-xr-x',
              mode: 0o755,
              owner: 'www-data',
              uid: 33,
              group: 'www-data',
              gid: 33,
              size: 4096,
              mtime: now,
              children: {
                'Log4jAuditLogger.java': {
                  name: 'Log4jAuditLogger.java',
                  type: 'file',
                  permissions: '-rw-r--r--',
                  mode: 0o644,
                  owner: 'www-data',
                  uid: 33,
                  group: 'www-data',
                  gid: 33,
                  size: 450,
                  mtime: now,
                  content: `package com.ecorp.hr.audit;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

public class Log4jAuditLogger {
    private static final Logger logger = LogManager.getLogger(Log4jAuditLogger.class);

    public void processAuditPayload(String clientString) {
        // [VULNERABILITY CVE-2021-44228]
        // Untrusted user input logged directly into vulnerable Log4j engine with message lookups enabled
        logger.info("Audit entry received: " + clientString);
    }
}`,
                },
                'pom.xml': {
                  name: 'pom.xml',
                  type: 'file',
                  permissions: '-rw-r--r--',
                  mode: 0o644,
                  owner: 'www-data',
                  uid: 33,
                  group: 'www-data',
                  gid: 33,
                  size: 520,
                  mtime: now,
                  content: `<project xmlns="http://maven.apache.org/POM/4.0.0">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.ecorp</groupId>
  <artifactId>hr-portal</artifactId>
  <version>2.4.1</version>
  <dependencies>
    <dependency>
      <groupId>org.apache.logging.log4j</groupId>
      <artifactId>log4j-core</artifactId>
      <version>2.14.1</version>
    </dependency>
  </dependencies>
</project>`,
                },
                'application.properties': {
                  name: 'application.properties',
                  type: 'file',
                  permissions: '-rw-r-----',
                  mode: 0o640,
                  owner: 'www-data',
                  uid: 33,
                  group: 'www-data',
                  gid: 33,
                  size: 180,
                  mtime: now,
                  content: 'server.port=8080\nspring.application.name=ecorp-hr-portal\nlog4j2.formatMsgNoLookups=false\nmanagement.endpoints.web.exposure.include=*',
                },
              },
            },
            ironbank: {
              name: 'ironbank',
              type: 'dir',
              permissions: 'drwxr-xr-x',
              mode: 0o755,
              owner: 'root',
              uid: 0,
              group: 'root',
              gid: 0,
              size: 4096,
              mtime: now,
              children: {
                'server.js': {
                  name: 'server.js',
                  type: 'file',
                  permissions: '-rw-r--r--',
                  mode: 0o644,
                  owner: 'node_app',
                  uid: 1004,
                  group: 'node_app',
                  gid: 1004,
                  size: 890,
                  mtime: now,
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
                'package.json': {
                  name: 'package.json',
                  type: 'file',
                  permissions: '-rw-r--r--',
                  mode: 0o644,
                  owner: 'node_app',
                  uid: 1004,
                  group: 'node_app',
                  gid: 1004,
                  size: 340,
                  mtime: now,
                  content: '{\n  "name": "ironbank-ledger-api",\n  "version": "1.4.0",\n  "dependencies": {\n    "dotenv": "^16.0.0",\n    "express": "^4.18.2",\n    "jsonwebtoken": "^8.5.1",\n    "mysql2": "^2.3.3"\n  }\n}\n',
                },
                '.env': {
                  name: '.env',
                  type: 'file',
                  permissions: '-rw-r-----',
                  mode: 0o640,
                  owner: 'finance_admin',
                  uid: 1002,
                  group: 'finance_admin',
                  gid: 1002,
                  size: 190,
                  mtime: now,
                  content: 'DB_HOST=127.0.0.1\nDB_PORT=3306\nDB_USER=ironbank_app\nDB_PASS=VaultP@ss2026!\nDB_NAME=ironbank_db\nJWT_SECRET=super_secret_ironbank_key_do_not_share_2026\nPORT=8080\n',
                },
                scripts: {
                  name: 'scripts',
                  type: 'dir',
                  permissions: 'drwxrwxr-x',
                  mode: 0o775,
                  owner: 'root',
                  uid: 0,
                  group: 'finance_admin',
                  gid: 1002,
                  size: 4096,
                  mtime: now,
                  children: {
                    'backup.sh': {
                      name: 'backup.sh',
                      type: 'file',
                      permissions: '-rwxrwxr-x',
                      mode: 0o775,
                      owner: 'root',
                      uid: 0,
                      group: 'finance_admin',
                      gid: 1002,
                      size: 260,
                      mtime: now,
                      content: '#!/bin/bash\n# IronBank Automated Ledger & DB Backup Routine (executed by root cron)\nmysqldump -u ironbank_app -p\'VaultP@ss2026!\' ironbank_db > /tmp/ironbank_backup.sql\ntar -czf /var/backups/ironbank_$(date +%Y%m%d).tar.gz /opt/ironbank\n',
                    },
                  },
                },
              },
            },
          },
        },
        tmp: {
          name: 'tmp',
          type: 'dir',
          permissions: 'drwxrwxrwt',
          mode: 0o1777,
          owner: 'root',
          uid: 0,
          group: 'root',
          gid: 0,
          size: 4096,
          mtime: now,
          children: {},
        },
        usr: {
          name: 'usr',
          type: 'dir',
          permissions: 'drwxr-xr-x',
          mode: 0o755,
          owner: 'root',
          uid: 0,
          group: 'root',
          gid: 0,
          size: 4096,
          mtime: now,
          children: {
            share: {
              name: 'share',
              type: 'dir',
              permissions: 'drwxr-xr-x',
              mode: 0o755,
              owner: 'root',
              uid: 0,
              group: 'root',
              gid: 0,
              size: 4096,
              mtime: now,
              children: {
                wordlists: {
                  name: 'wordlists',
                  type: 'dir',
                  permissions: 'drwxr-xr-x',
                  mode: 0o755,
                  owner: 'root',
                  uid: 0,
                  group: 'root',
                  gid: 0,
                  size: 4096,
                  mtime: now,
                  children: {
                    'rockyou.txt': {
                      name: 'rockyou.txt',
                      type: 'file',
                      permissions: '-rw-r--r--',
                      mode: 0o644,
                      owner: 'root',
                      uid: 0,
                      group: 'root',
                      gid: 0,
                      size: 210,
                      mtime: now,
                      content: '123456\npassword\nadmin\npassword123\nBackupService2026!\nwelcome\nshadow\niloveyou\nqwerty\nroot\nsecret\n',
                    },
                    dirb: {
                      name: 'dirb',
                      type: 'dir',
                      permissions: 'drwxr-xr-x',
                      mode: 0o755,
                      owner: 'root',
                      uid: 0,
                      group: 'root',
                      gid: 0,
                      size: 4096,
                      mtime: now,
                      children: {
                        'common.txt': {
                          name: 'common.txt',
                          type: 'file',
                          permissions: '-rw-r--r--',
                          mode: 0o644,
                          owner: 'root',
                          uid: 0,
                          group: 'root',
                          gid: 0,
                          size: 110,
                          mtime: now,
                          content: 'admin\napi\nbackup\nlogin\nvault\nusers\ntransfer\ndb-status\nportal\nuploads\nsecret\n',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    };
  }

  /**
   * Check POSIX read/write/execute permission for a given user against a filesystem node.
   * Root (UID 0) always has full read/write permission.
   */
  public checkPermission(
    node: FsNode,
    uid: number,
    gid: number,
    access: 'r' | 'w' | 'x'
  ): boolean {
    if (uid === 0) return true; // root has omnipotent access

    const mode = node.mode;
    let bit = 0;

    if (access === 'r') bit = 4;
    else if (access === 'w') bit = 2;
    else if (access === 'x') bit = 1;

    // Check Owner
    if (node.uid === uid) {
      return (mode & (bit << 6)) !== 0;
    }

    // Check Group
    if (node.gid === gid) {
      return (mode & (bit << 3)) !== 0;
    }

    // Check Others
    return (mode & bit) !== 0;
  }

  /**
   * Normalize path without allowing escape beyond root `/`
   */
  public resolvePath(cwd: string, targetPath: string): string[] {
    const raw = targetPath.startsWith('/') ? targetPath : `${cwd}/${targetPath}`;
    const parts = raw.split('/').filter(Boolean);
    const resolved: string[] = [];

    for (const p of parts) {
      if (p === '.') continue;
      if (p === '..') {
        resolved.pop(); // cannot pop beyond root array
      } else {
        resolved.push(p);
      }
    }

    return resolved;
  }

  /**
   * Locate node by path segments
   */
  public getNode(segments: string[]): FsNode | null {
    let curr = this.root;
    for (const seg of segments) {
      if (curr.type !== 'dir' || !curr.children || !curr.children[seg]) {
        return null;
      }
      curr = curr.children[seg];
    }
    return curr;
  }

  /**
   * List directory contents with permission enforcement
   */
  public listDirectory(
    cwd: string,
    targetPath: string = '',
    uid: number = 0,
    gid: number = 0
  ): { success: boolean; entries?: FsNode[]; error?: string } {
    const segments = this.resolvePath(cwd, targetPath);
    const node = this.getNode(segments);

    if (!node) {
      return { success: false, error: `ls: cannot access '${targetPath}': No such file or directory` };
    }

    if (node.type !== 'dir') {
      return { success: true, entries: [node] };
    }

    // Verify read and execute permissions on the directory
    if (!this.checkPermission(node, uid, gid, 'r') || !this.checkPermission(node, uid, gid, 'x')) {
      return { success: false, error: `ls: cannot open directory '${targetPath || '.'}': Permission denied` };
    }

    return { success: true, entries: Object.values(node.children || {}) };
  }

  /**
   * Read file content with permission enforcement
   */
  public readFile(
    cwd: string,
    targetPath: string,
    uid: number = 0,
    gid: number = 0
  ): { success: boolean; content?: string; error?: string } {
    const segments = this.resolvePath(cwd, targetPath);
    const node = this.getNode(segments);

    if (!node) {
      return { success: false, error: `cat: ${targetPath}: No such file or directory` };
    }

    if (node.type === 'dir') {
      return { success: false, error: `cat: ${targetPath}: Is a directory` };
    }

    if (!this.checkPermission(node, uid, gid, 'r')) {
      return { success: false, error: `cat: ${targetPath}: Permission denied` };
    }

    return { success: true, content: node.content || '' };
  }

  /**
   * Write or append file content with permission enforcement
   */
  public writeFile(
    cwd: string,
    targetPath: string,
    content: string,
    uid: number = 0,
    gid: number = 0,
    append: boolean = false
  ): { success: boolean; error?: string } {
    const segments = this.resolvePath(cwd, targetPath);
    if (segments.length === 0) {
      return { success: false, error: 'Cannot write to root' };
    }

    const fileName = segments[segments.length - 1];
    const parentSegments = segments.slice(0, -1);
    const parentNode = this.getNode(parentSegments);

    if (!parentNode || parentNode.type !== 'dir' || !parentNode.children) {
      return { success: false, error: 'Cannot create file: Parent directory does not exist' };
    }

    if (!this.checkPermission(parentNode, uid, gid, 'w')) {
      return { success: false, error: `Cannot write to '${targetPath}': Permission denied` };
    }

    const existing = parentNode.children[fileName];
    if (existing) {
      if (!this.checkPermission(existing, uid, gid, 'w')) {
        return { success: false, error: `Cannot write to '${targetPath}': Permission denied` };
      }
      existing.content = append ? (existing.content || '') + content : content;
      existing.size = existing.content.length;
      existing.mtime = new Date();
    } else {
      const mode = 0o644;
      parentNode.children[fileName] = {
        name: fileName,
        type: 'file',
        permissions: '-rw-r--r--',
        mode,
        owner: uid === 0 ? 'root' : 'kali',
        uid,
        group: gid === 0 ? 'root' : 'kali',
        gid,
        size: content.length,
        mtime: new Date(),
        content,
      };
    }

    return { success: true };
  }

  /**
   * Create directory with permission enforcement
   */
  public createDirectory(
    cwd: string,
    targetPath: string,
    uid: number = 0,
    gid: number = 0,
    mode: number = 0o755
  ): { success: boolean; error?: string } {
    const segments = this.resolvePath(cwd, targetPath);
    if (segments.length === 0) {
      return { success: false, error: 'mkdir: cannot create directory root: File exists' };
    }

    const dirName = segments[segments.length - 1];
    const parentSegments = segments.slice(0, -1);
    const parentNode = this.getNode(parentSegments);

    if (!parentNode || parentNode.type !== 'dir' || !parentNode.children) {
      return { success: false, error: `mkdir: cannot create directory '${targetPath}': No such file or directory` };
    }

    if (!this.checkPermission(parentNode, uid, gid, 'w')) {
      return { success: false, error: `mkdir: cannot create directory '${targetPath}': Permission denied` };
    }

    if (parentNode.children[dirName]) {
      return { success: false, error: `mkdir: cannot create directory '${targetPath}': File exists` };
    }

    parentNode.children[dirName] = {
      name: dirName,
      type: 'dir',
      permissions: 'drwxr-xr-x',
      mode,
      owner: uid === 0 ? 'root' : 'kali',
      uid,
      group: gid === 0 ? 'root' : 'kali',
      gid,
      size: 4096,
      mtime: new Date(),
      children: {},
    };

    return { success: true };
  }

  /**
   * Get completion matches for a partial path
   */
  public getCompletions(cwd: string, partialPath: string): string[] {
    let dirPath = '';
    let prefix = partialPath;

    if (partialPath.includes('/')) {
      const lastSlash = partialPath.lastIndexOf('/');
      dirPath = partialPath.slice(0, lastSlash);
      prefix = partialPath.slice(lastSlash + 1);
      if (!dirPath && partialPath.startsWith('/')) {
        dirPath = '/';
      }
    }

    const segments = this.resolvePath(cwd, dirPath);
    const node = this.getNode(segments);

    if (!node || node.type !== 'dir' || !node.children) {
      return [];
    }

    const matches: string[] = [];
    for (const [name, child] of Object.entries(node.children)) {
      if (name.startsWith(prefix)) {
        const full = dirPath ? (dirPath === '/' ? `/${name}` : `${dirPath}/${name}`) : name;
        matches.push(child.type === 'dir' ? `${full}/` : full);
      }
    }

    return matches;
  }
}
