# Municipality Infrastructure Checklist

Provide externally:
- [ ] Reverse proxy / load balancer + TLS
- [ ] PostgreSQL
- [ ] S3-compatible object storage
- [ ] Redis (if horizontally scaled)
- [ ] OIDC/OAuth/SAML IdP
- [ ] Approved GPS MongoDB/Socket.IO integration
- [ ] Monitoring + log sink
- [ ] Backup destination + retention policy
- [ ] Internal DNS + network restrictions
- [ ] Audit retention requirements

Application ships as containers; no Kodikz-controlled cloud required.
