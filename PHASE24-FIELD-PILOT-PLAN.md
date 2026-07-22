# Field Pilot Plan

1. Provision Ubuntu VPS + DNS + TLS
2. Configure `.env.pilot` and start docker-compose.pilot.yml
3. Run PostgreSQL migrations and rotate seeded passwords
4. Create MinIO/S3 bucket
5. Keep GPS backend URL pointed at existing service
6. Execute one-vehicle Teltonika field run
7. Perform backup + restore drill
8. Run 100-vehicle stress on pilot hardware
9. Sign PHASE24-DEPLOYMENT-GO-NO-GO.md
