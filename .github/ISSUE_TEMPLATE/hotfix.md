name: Hotfix (RC1)
description: Critical pilot defect requiring RC1 hotfix process
title: "[HOTFIX] "
labels: ["hotfix", "critical", "pilot"]
body:
  - type: markdown
    attributes:
      value: |
        Use only for security, data integrity, authz, startup failure, or blocked pilot workflow.
        See `RC1-HOTFIX-POLICY.md`. Do not use for enhancements.
  - type: dropdown
    id: severity
    attributes:
      label: Severity
      options: [P0, P1]
    validations:
      required: true
  - type: textarea
    id: impact
    attributes:
      label: Pilot impact
      description: What is blocked? Any data integrity risk?
    validations:
      required: true
  - type: input
    id: version
    attributes:
      label: Release
      description: Expected value
      value: "1.0.0 RC1 (v1.0.0-rc1)"
    validations:
      required: true
  - type: textarea
    id: repro
    attributes:
      label: Reproduction steps
    validations:
      required: true
  - type: textarea
    id: diagnostics
    attributes:
      label: Diagnostics
      description: status.sh / support.sh bundle ID only — never paste secrets
  - type: checkboxes
    id: confirm
    attributes:
      label: Confirmation
      options:
        - label: I confirm this is not a feature request
          required: true
        - label: No secrets are included in this issue
          required: true
