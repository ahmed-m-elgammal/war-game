# @wargame/map-data

Static Vardania map content and validation. **Production map content is not included while `D-MAP` is open.** This package currently provides the machinery needed to validate and pin the map once that decision is approved.

## Contracts

- `VardaniaMap` extends the shared `MapDefinition` with a row-major mask and static art anchors.
- `ProvinceMask.pixels` stores one byte per pixel: `0` is water, `1-254` is a province ID. The `#000000` mask colour is reserved for water and rejected for provinces.
- Every province has `iconAnchor`, `labelAnchor`, and `capitalAnchor` values in mask space.
- Vardania has land provinces only in v1; water is represented exclusively by mask pixel `0`, so there is no naval province model.

## Validation

- `validateMap(map, rules?)` checks map dimensions, province count/identity, mask coverage, one contiguous landmass, edge-only water, adjacency symmetry/connectivity, refugee candidate count, and art anchors.
- `validateSpawnPlacement(map, assignment, options?)` checks that every player capital is known and non-refugee, has food and water within two land hops, has an adjacent weak neutral target, and is not adjacent to another player capital. An approved `minimumCapitalSpacingHops` can be supplied; no spacing value is hardcoded here. The separate resource-mix and neutral/AI buffer guarantees depend on approved per-world generation rules and are not yet enforced.
- `hitTestMask(mask, x, y)` resolves mask coordinates to a province ID or `null`.
- `computeMapHash(map)` produces a deterministic SHA-256 hash from canonicalized map content for world pinning.

## Test fixture

`src/testing/fixtures.ts` is deliberately synthetic and test-only. It is not exported from the package root and must never be presented as Vardania data. It exists to exercise the machinery before `D-MAP` supplies the real province names, geometry, colours, terrain, adjacency, and spawn layout.
