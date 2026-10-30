# ROOTRANGE Installation Guide

This guide provides step-by-step instructions for deploying and running ROOTRANGE in local development and production hosting environments.

---

## 1. System Requirements

ROOTRANGE is designed as an ultra-lightweight, 100% client-side web application. No specialized host hardware, GPUs, or kernel virtualization modules (e.g. KVM) are required.

### Minimum Requirements:
- **Operating System**: macOS 12+, Linux (Ubuntu 20.04+, Debian 11+, Arch), or Windows 10/11 (WSL2 or PowerShell).
- **Node.js**: v18.0.0 or higher (v20.x LTS recommended).
- **Package Manager**: `npm` v9+ (or `pnpm` / `yarn`).
- **RAM**: 2 GB available RAM.
- **Disk Space**: 500 MB free storage for source files and dependencies.
- **Web Browser**: Modern Evergreen browser supporting Web Audio API, IndexedDB, and Web Workers (Google Chrome 100+, Mozilla Firefox 100+, Apple Safari 16+, Microsoft Edge 100+).

---

## 2. Quickstart Installation

Clone the repository and install dependencies using the committed lockfile:

```bash
# Clone the repository
git clone https://github.com/Dotify71/ROOTRANGE.git
cd ROOTRANGE

# Install exact locked dependencies
npm ci
```

---

## 3. Environment Configuration

Create a local environment configuration file from the template:

```bash
cp .env.example .env
```

Review and adjust variables in `.env` as needed:

```bash
# Application Metadata
VITE_APP_NAME=ROOTRANGE
VITE_APP_VERSION=1.0.0
VITE_ENABLE_AUDIO=true
VITE_OFFLINE_MODE=true

# Optional: External AI Provider (e.g. Local Ollama)
# VITE_AI_PROVIDER_URL=http://localhost:11434
# VITE_AI_PROVIDER_MODEL=llama3
```

By default, `VITE_OFFLINE_MODE=true` is enabled. All simulation heuristics, Socratic mentoring, and offensive feedback function with zero network access and no paid API keys.

---

## 4. Launching the Development Server

Start the Vite development server with Hot Module Replacement (HMR):

```bash
npm run dev
```

The application will be available at:
```
http://localhost:5173
```

---

## 5. Building for Production

To create an optimized, minified production build with automatic vendor chunk splitting:

```bash
# Type check and build
npm run build
```

Build outputs are generated in the `dist/` directory:
- `dist/index.html` (Application entrypoint)
- `dist/assets/vendor-react-*.js` (React & React Router vendor bundle)
- `dist/assets/vendor-graph-*.js` (React Flow topology engine bundle)
- `dist/assets/vendor-icons-*.js` (Lucide iconography bundle)
- `dist/assets/index-*.js` (Optimized application business logic bundle)
- `dist/assets/index-*.css` (Tailwind styles)

Preview the production build locally:

```bash
npm run preview
```

---

## 6. Static Web Hosting Deployment

Because ROOTRANGE runs 100% in the user's browser, the `dist/` folder can be served from any static web host, CDN, or object storage bucket:

- **GitHub Pages**: Deploy the `dist` directory via GitHub Actions.
- **Cloudflare Pages / Vercel / Netlify**: Connect the repository, set build command `npm run build`, and publish directory `dist`.
- **Docker / Nginx**: Copy `dist/` into `/usr/share/nginx/html` with standard fallback routing (`try_files $uri $uri/ /index.html;`).
