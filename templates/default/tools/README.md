# `tools/` — template-specific validators (optional)

The **generic engine** `specs.mjs` (`feature | change | index | check | archive`) is provided by the toolkit core and
**baked in** at generation — it lives here in the generated repo but you do not copy it per template.

This folder is for **extra, template-specific** tooling only — e.g. a validator that enforces a naming convention
particular to this kind of app. The `default` template ships none.

If you add one, wire it into your CI alongside `node tools/specs.mjs check`. Keep it dependency-free (Node built-ins)
so the generated repo stays zero-install, like the core engine.
