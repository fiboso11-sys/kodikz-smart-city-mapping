# Troubleshooting — RC1 Plug-and-Play

For every issue: Symptom · Likely cause · Diagnostic · Corrective action · Escalation.

---

### Docker unavailable
- **Symptom:** `docker: command not found` or daemon errors  
- **Cause:** Engine not installed / service down / user not in `docker` group  
- **Diagnostic:** `docker info`; `systemctl status docker`  
- **Action:** Install Docker Engine 24+ and Compose plugin; `usermod -aG docker $USER`; re-login  
- **Escalation:** Dubai OS team (Kodikz does not provision hosts)

### Permission denied
- **Symptom:** scripts fail writing `logs/`, `config/`, `data/`  
- **Cause:** wrong owner or missing execute bit  
- **Diagnostic:** `ls -la scripts config data`; `id`  
- **Action:** `chmod +x scripts/*.sh`; fix ownership of package dir  
- **Escalation:** Dubai OS admin

### Port conflict
- **Symptom:** nginx/app cannot bind 80/443  
- **Cause:** another process listens  
- **Diagnostic:** `ss -ltnp | egrep ':80|:443'`  
- **Action:** free ports or change `HTTP_PORT`/`HTTPS_PORT` in configure  
- **Escalation:** Dubai networking

### Image pull failure
- **Symptom:** `docker pull` fails in registry mode  
- **Cause:** no outbound registry / wrong tag / no credentials  
- **Diagnostic:** `docker pull kodikz-smart-city-app:1.0.0-rc1`  
- **Action:** switch to offline tar (`IMAGE_SOURCE=offline`) or fix firewall/registry  
- **Escalation:** Kodikz for image delivery; Dubai for egress

### Invalid environment value
- **Symptom:** `validate-config.sh` exits non-zero  
- **Cause:** missing/placeholder secrets, bad URL  
- **Diagnostic:** `./scripts/validate-config.sh` (does not print secrets)  
- **Action:** re-run `./scripts/configure.sh`; reject `CHANGE_ME` / short secrets  
- **Escalation:** Kodikz config matrix (`ENVIRONMENT-CONFIGURATION-MATRIX.md`)

### Database not ready
- **Symptom:** migrate/deploy waits then fails  
- **Cause:** postgres unhealthy / volume permission  
- **Diagnostic:** `./scripts/logs.sh postgres`; `docker compose … ps`  
- **Action:** check `data/postgres` permissions; `./scripts/restart.sh postgres`  
- **Escalation:** Kodikz DB runbook

### Migration failure
- **Symptom:** `migrate.sh` non-zero  
- **Cause:** schema conflict / DB URL wrong  
- **Diagnostic:** `./scripts/migration-status.sh`; postgres logs  
- **Action:** restore from pre-migrate backup; do not invent SQL  
- **Escalation:** Kodikz database engineer

### Backend unhealthy
- **Symptom:** `/api/health` or readiness fail  
- **Cause:** env, DB, storage, cold start  
- **Diagnostic:** `./scripts/logs.sh backend`; curl health inside container  
- **Action:** fix env; wait start_period; restart app  
- **Escalation:** Kodikz backend support

### Frontend unavailable
- **Symptom:** public URL fails  
- **Cause:** nginx/TLS/DNS  
- **Diagnostic:** `./scripts/logs.sh nginx`; curl localhost `/health`  
- **Action:** verify certs in `data/certs`; DNS A/AAAA; TLS mode  
- **Escalation:** Dubai DNS/TLS owners

### HTTPS failure
- **Symptom:** browser TLS errors  
- **Cause:** missing/expired certs, wrong paths  
- **Diagnostic:** `ls data/certs`; `openssl x509 -in fullchain.pem -noout -dates`  
- **Action:** install Dubai-managed certs; reload nginx  
- **Escalation:** Dubai PKI

### WebSocket failure
- **Symptom:** live GPS / Socket.IO broken  
- **Cause:** GPS URL, firewall, nginx upgrade headers  
- **Diagnostic:** probe `${GPS_BACKEND_URL}/socket.io/`; nginx `socket.io` location  
- **Action:** confirm outbound to GPS host; Dubai firewall allowlist  
- **Escalation:** GPS backend owner + Kodikz integration doc

### GPS connection failure
- **Symptom:** vehicles not updating  
- **Cause:** wrong `NEXT_PUBLIC_*` URLs / network  
- **Diagnostic:** `./scripts/validate.sh` GPS checks; browser network tab  
- **Action:** correct GPS URL in configure; verify from server  
- **Escalation:** Joint (Dubai network + Kodikz)

### Disk full
- **Symptom:** writes fail; containers unhealthy  
- **Cause:** logs/backups/images filled disk  
- **Diagnostic:** `df -h`; `du -sh data logs images`  
- **Action:** prune old backups per retention; expand disk  
- **Escalation:** Dubai storage

### Restore failure
- **Symptom:** `restore.sh` errors  
- **Cause:** corrupt dump / version mismatch  
- **Diagnostic:** `sha256sum -c` in backup dir; `MANIFEST.txt`  
- **Action:** use different backup; contact Kodikz before forced schema edits  
- **Escalation:** Kodikz + Dubai jointly

### Support bundle failure
- **Symptom:** `support.sh` exits non-zero or bundle missing  
- **Cause:** disk full, tar failure, permissions  
- **Diagnostic:** `df -h`; `ls -la support-bundles`  
- **Action:** free disk; re-run; ensure `chmod +x scripts/*.sh`  
- **Escalation:** Kodikz with partial files if any

### Cannot identify release version
- **Symptom:** unclear what is deployed  
- **Cause:** missing About page / VERSION  
- **Diagnostic:** Settings → About; `./scripts/status.sh`; `cat VERSION`  
- **Action:** confirm `v1.0.0-rc1` / commit SHA  
- **Escalation:** Kodikz release manager

---

**Escalation contacts:** use `PILOT-SUPPORT-PLAN.md` / `OPERATOR-SUPPORT-GUIDE.md`.  
Never paste secrets into tickets.
