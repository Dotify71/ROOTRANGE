export interface FsNode {
  name: string;
  type: 'file' | 'dir';
  permissions: string;
  owner: string;
  group: string;
  size: number;
  content?: string;
  children?: Record<string, FsNode>;
}

export class VirtualFileSystem {
  private root: FsNode;

  constructor() {
    this.root = this.createDefaultFilesystem();
  }

  private createDefaultFilesystem(): FsNode {
    return {
      name: '/',
      type: 'dir',
      permissions: 'drwxr-xr-x',
      owner: 'root',
      group: 'root',
      size: 4096,
      children: {
        bin: {
          name: 'bin',
          type: 'dir',
          permissions: 'drwxr-xr-x',
          owner: 'root',
          group: 'root',
          size: 4096,
          children: {
            bash: { name: 'bash', type: 'file', permissions: '-rwxr-xr-x', owner: 'root', group: 'root', size: 1234376 },
            sh: { name: 'sh', type: 'file', permissions: '-rwxr-xr-x', owner: 'root', group: 'root', size: 1234376 },
            nmap: { name: 'nmap', type: 'file', permissions: '-rwxr-xr-x', owner: 'root', group: 'root', size: 2841000 },
            gobuster: { name: 'gobuster', type: 'file', permissions: '-rwxr-xr-x', owner: 'root', group: 'root', size: 8492000 },
            hydra: { name: 'hydra', type: 'file', permissions: '-rwxr-xr-x', owner: 'root', group: 'root', size: 542000 },
            nc: { name: 'nc', type: 'file', permissions: '-rwxr-xr-x', owner: 'root', group: 'root', size: 38400 },
            curl: { name: 'curl', type: 'file', permissions: '-rwxr-xr-x', owner: 'root', group: 'root', size: 242000 },
            sqlmap: { name: 'sqlmap', type: 'file', permissions: '-rwxr-xr-x', owner: 'root', group: 'root', size: 124000 },
          },
        },
        etc: {
          name: 'etc',
          type: 'dir',
          permissions: 'drwxr-xr-x',
          owner: 'root',
          group: 'root',
          size: 4096,
          children: {
            passwd: {
              name: 'passwd',
              type: 'file',
              permissions: '-rw-r--r--',
              owner: 'root',
              group: 'root',
              size: 1420,
              content: 'root:x:0:0:root:/root:/bin/bash\nkali:x:1000:1000:kali,,,:/home/kali:/bin/bash\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin',
            },
            hosts: {
              name: 'hosts',
              type: 'file',
              permissions: '-rw-r--r--',
              owner: 'root',
              group: 'root',
              size: 240,
              content: '127.0.0.1\tlocalhost\n127.0.1.1\tkali-pwnbox\n10.10.11.45\tecorp-hr.htb\n10.10.11.82\tironbank.htb\n10.10.11.99\tomnicorp.local',
            },
          },
        },
        home: {
          name: 'home',
          type: 'dir',
          permissions: 'drwxr-xr-x',
          owner: 'root',
          group: 'root',
          size: 4096,
          children: {
            kali: {
              name: 'kali',
              type: 'dir',
              permissions: 'drwxr-xr-x',
              owner: 'kali',
              group: 'kali',
              size: 4096,
              children: {
                'notes.txt': {
                  name: 'notes.txt',
                  type: 'file',
                  permissions: '-rw-r--r--',
                  owner: 'kali',
                  group: 'kali',
                  size: 215,
                  content: 'TARGET RECON NOTES:\n- Subnet: 10.10.11.0/24\n- E-Corp HR Target: 10.10.11.45\n- Remember to run nmap with -sV and -sC\n- Check web application HTTP headers for JNDI / Log4j vulnerabilities',
                },
                wordlists: {
                  name: 'wordlists',
                  type: 'dir',
                  permissions: 'drwxr-xr-x',
                  owner: 'kali',
                  group: 'kali',
                  size: 4096,
                  children: {
                    'common.txt': {
                      name: 'common.txt',
                      type: 'file',
                      permissions: '-rw-r--r--',
                      owner: 'kali',
                      group: 'kali',
                      size: 140,
                      content: 'admin\napi\nbackup\nlogin\nportal\nuploads\nsecret',
                    },
                    'rockyou.txt': {
                      name: 'rockyou.txt',
                      type: 'file',
                      permissions: '-rw-r--r--',
                      owner: 'kali',
                      group: 'kali',
                      size: 94,
                      content: '123456\npassword\nadmin\nwelcome\nshadow\niloveyou\nqwerty\nroot',
                    },
                  },
                },
              },
            },
          },
        },
        root: {
          name: 'root',
          type: 'dir',
          permissions: 'drwx------',
          owner: 'root',
          group: 'root',
          size: 4096,
          children: {},
        },
        tmp: {
          name: 'tmp',
          type: 'dir',
          permissions: 'drwxrwxrwt',
          owner: 'root',
          group: 'root',
          size: 4096,
          children: {},
        },
      },
    };
  }

  // Resolve path segments relative to current directory
  public resolvePath(cwd: string, targetPath: string): string[] {
    let raw = targetPath.startsWith('/') ? targetPath : `${cwd}/${targetPath}`;
    const parts = raw.split('/').filter(Boolean);
    const resolved: string[] = [];

    for (const p of parts) {
      if (p === '.') continue;
      if (p === '..') {
        resolved.pop();
      } else {
        resolved.push(p);
      }
    }

    return resolved;
  }

  // Locate node by absolute path segments
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

  public listDirectory(cwd: string, targetPath: string = ''): { success: boolean; entries?: FsNode[]; error?: string } {
    const segments = this.resolvePath(cwd, targetPath);
    const node = this.getNode(segments);

    if (!node) {
      return { success: false, error: `ls: cannot access '${targetPath}': No such file or directory` };
    }
    if (node.type !== 'dir' || !node.children) {
      return { success: true, entries: [node] };
    }

    return { success: true, entries: Object.values(node.children) };
  }

  public readFile(cwd: string, targetPath: string): { success: boolean; content?: string; error?: string } {
    const segments = this.resolvePath(cwd, targetPath);
    const node = this.getNode(segments);

    if (!node) {
      return { success: false, error: `cat: ${targetPath}: No such file or directory` };
    }
    if (node.type === 'dir') {
      return { success: false, error: `cat: ${targetPath}: Is a directory` };
    }

    return { success: true, content: node.content || '' };
  }

  public writeFile(cwd: string, targetPath: string, content: string): { success: boolean; error?: string } {
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

    parentNode.children[fileName] = {
      name: fileName,
      type: 'file',
      permissions: '-rw-r--r--',
      owner: 'kali',
      group: 'kali',
      size: content.length,
      content,
    };

    return { success: true };
  }
}
