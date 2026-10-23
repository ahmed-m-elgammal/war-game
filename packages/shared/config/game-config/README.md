# Approved Game Config Documents

This directory holds frozen `GameConfig` documents. Each file is content-addressed
by `config.configVersion`; the SHA-256 hash of the canonical config is pinned to
`worlds.config_hash` when a world is created.

No document exists yet. Seed values are blocked by the 23 open TBDs in
`plan/03-gameplay-rules.md` §20.3 (`P0-E1-T3`). Do not add placeholder numbers:
the gate rejects missing, proposed, and TBD values.

## Document format

Each `*.json` file is a strict three-field envelope:

| Field       | Rule                                                                                                           |
| ----------- | -------------------------------------------------------------------------------------------------------------- |
| `status`    | Must be `approved`. `proposed` and `tbd` fail the gate.                                                        |
| `decisions` | Every decision that authorises the document's values. Each ID must exist in `plan/tasks.json` with `approved`. |
| `config`    | A complete `GameConfig` satisfying `gameConfigSchema`; missing or unknown fields fail.                         |

The envelope is not hashed. Only `config` is canonicalised and hashed.

The exact shape is defined in `packages/shared/src/config/game-config/schema.ts`
and mirrors `packages/shared/src/domain/config.ts`. Every definition field is
required, so a document cannot omit a balance value and still validate.

## Running the gate

```bash
pnpm config:check
```

The gate validates every `*.json` file in this directory, rejects duplicate
versions with conflicting hashes, and prints the pinned hash for each document.
An empty directory passes while `P0-E1-T3` remains open.
