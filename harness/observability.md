# Harness observability

Every run should persist: prompt, agent result, diff, validation log, score and metrics. `harness/logs/events.jsonl` is append-only. Do not log secrets or private document contents.

Recommended events: run.start, agent.start, agent.end, validation.end, score.end, repair.start, repair.end, escalation, stage.approved, module.done.
