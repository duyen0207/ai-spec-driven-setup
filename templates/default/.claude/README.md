# `.claude/` — your repo-specific customisations

This folder is **baked into the generated `<app>-specs/` repo** and is **yours to extend**. The toolkit's skills live
elsewhere (they are provided by `ai-spec-driven-setup`); this is where **this app's team** adds its own:

```
.claude/
  commands/   # repo-specific slash commands (Claude)
  skills/     # repo-specific skills — e.g. a house-style variant of new-spec
```

Guidance:
- To change **how specs are written**, prefer editing `../rules/*.md` (the authoring standards this template owns) —
  every skill reads them, so one edit changes all flows.
- To **replace a whole skill** with your own, drop it here. The only contract it must honour is: its output
  (features / changes) must **pass `node tools/specs.mjs check`**. Nothing else couples to it.
- To change **vocabulary** (domains, statuses, roles, repos, language), edit `../spec.config.json` — one place.

See the toolkit's `docs/customizing.md` and `docs/skill-contract.md`.
