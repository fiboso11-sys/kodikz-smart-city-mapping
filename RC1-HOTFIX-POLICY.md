# RC1 Hotfix Policy

## Allowed after freeze

- Security vulnerability with material impact
- Data integrity defect
- Authentication / authorization defect
- Application startup failure
- Deployment blocker
- Critical pilot workflow failure
- Verified severe performance regression

## Not allowed after freeze

- New features · UI enhancements · Architecture redesign · Drive-by refactors  
- New reports · Convenience changes · Unapproved workflow changes

## Process

1. Classify P0–P1 via support workflow  
2. Kodikz prepares minimal patch on a hotfix branch  
3. Dubai validates with `validate.sh`  
4. Document change; **do not move** tag `v1.0.0-rc1` without explicit release approval  

Larger work → future release after RC1.
