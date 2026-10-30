# ROOTRANGE Troubleshooting Guide

This guide covers common issues, debugging steps, and solutions when running or developing ROOTRANGE.

---

## 1. Browser & Audio Issues

### Issue: "No sound is playing when typing or capturing flags"
- **Cause**: Modern web browsers block procedural audio from autoplaying before explicit user interaction (click or keypress).
- **Solution**: Click anywhere inside the ROOTRANGE workstation or press a key in the terminal. Check the **Audio** toggle in the top status bar or `/settings` to ensure sound is not muted and volume is above 0%.

### Issue: "Audio warning in browser console: The AudioContext was not allowed to start"
- **Cause**: Browser autoplay policy prevented the Web Audio API context from starting automatically.
- **Solution**: Normal browser behavior. `soundManager.ts` automatically calls `resume()` as soon as the user executes their first command or clicks a UI button.

---

## 2. Terminal & Command Issues

### Issue: "Command not found: <tool>"
- **Cause**: An unsupported or mistyped command was entered.
- **Solution**: Type `help` in the terminal to view all registered system utilities and offensive security tools. Available offensive tools include: `nmap`, `gobuster`, `curl`, `nc`, `ssh`, `sudo`, `linpeas.sh`, `GetUserSPNs.py`, `secretsdump.py`, `psexec.py`, `smbclient`, `john`, `sqlmap`, `hydra`.

### Issue: "Permission denied when reading /root/root.txt"
- **Cause**: In Linux, the root flag is restricted to UID 0 (mode `0600 root:root`).
- **Solution**: You must first escalate privileges to `root` (e.g. via `sudo -l` and `/usr/bin/find` GTFOBins bypass on E-Corp HR).

---

## 3. Network & Pivoting Issues

### Issue: "Nmap reports 'Destination host unreachable: No route to host' for 10.10.11.82"
- **Cause**: `10.10.11.82` (IronBank Vault) is located on an isolated internal subnet.
- **Solution**: You must first compromise `ecorp-hr` (`10.10.11.45`) to at least `USER` or `ROOT` privilege. Once breached, the virtual router automatically unlocks the pivot route into the internal subnet.

### Issue: "HTTP Repeater returns '403 Security Boundary Violation'"
- **Cause**: The request was addressed to `localhost`, `127.0.0.1`, cloud metadata (`169.254.169.254`), or an external internet domain.
- **Solution**: In default simulated mode, ROOTRANGE strictly targets virtual range machines (`10.10.11.45`, `10.10.11.82`, `10.10.11.99`, or hostnames `ecorp-hr`, `iron-vault`, `corp-dc01`).

---

## 4. State & Persistence Issues

### Issue: "Flags or progress were lost after closing the browser"
- **Cause**: Browser private browsing (Incognito mode) purges IndexedDB and localStorage upon window closure.
- **Solution**: Use a standard browser profile, or download a portable JSON backup archive from `/settings` (**Export Save Archive**) and restore it anytime (**Restore From Backup**).

### Issue: "Importing save file fails with schema validation error"
- **Cause**: The JSON file was corrupted, modified with invalid negative score values, or created with an incompatible schema version.
- **Solution**: Ensure your save file contains `version: 1`, non-negative `score`, and valid array structures for `claimedFlags` and `machines`.
