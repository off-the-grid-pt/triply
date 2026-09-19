# Autonomous execution policy

## Auto-advance
Allowed for routine stages when: spec approved, dependencies done, scope clean, validation pass, score >=90, no Critical/High finding, no escalation trigger.

## Repair
At most 2 automatic repair attempts for the same stage. Repair scope is limited to failed findings. Then escalate.

## Never automatic
Spec approval/change, architecture-breaking decision, dependency/vendor addition, destructive migration, auth/security/privacy change, remote push/merge, production deploy, deletion of user functionality/data.
