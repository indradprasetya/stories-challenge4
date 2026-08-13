# Story Drag-and-Drop Technical Contract

This document explains how the static story JSON describes drag-and-drop progression. It is intended for Swift developers, UI developers, and AI assistants working on the app.

## Core Model

A grid is both a rendered story state and, unless it is the final grid, the drop target that produces the next state.

1. Render Grid 1 from `outcome.states[0]`.
2. Accept action placements in Grid 1's `dropSlots`.
3. When every required slot is filled, find the matching outcome step and reveal Grid 2.
4. Lock Grid 1 so its completed choice cannot change.
5. Repeat on each newly revealed interactive grid.
6. Render the final grid as a result. It has no drop slots and never accepts an action.

For a four-grid chapter, Grids 1–3 are interactive and Grid 4 is result-only. For a three-grid chapter, Grids 1–2 are interactive and Grid 3 is result-only.

## Grid Definition

Every grid includes an ordered `dropSlots` array.

- A normal interactive grid has one generic `slot_scene` whose `targetCharacterID` is `null`.
- A character-targeted grid has one slot per target character.
- A final grid has an empty `dropSlots` array and `locked: true`.
- Other grids start with `locked: false`. The runtime locks them after their step completes.

The `order` of grids and drop slots is authoritative. Do not infer order from object keys or the order in which the player dragged items.

`choiceCount` is the total number of drop slots across all interactive grids, not the number of interactive grids. A chapter with slot counts `[2, 2, 1, 0]` therefore has `choiceCount: 5`.

## Outcome Steps

Each outcome contains an ordered `steps` array. A step describes the choices made on a source grid:

```json
{
  "sourceGridID": "grid_1",
  "placements": [
    {
      "slotID": "slot_scene",
      "actionID": "action_approach"
    }
  ]
}
```

The action is dropped on `grid_1`; the resulting story state is rendered in `grid_2`. `sourceGridID` never points to the destination grid.

## Single-Slot Completion

A single-slot step completes immediately after one valid action is dropped into `slot_scene`.

```text
Grid 1 receives Approach
→ match grid_1[slot_scene:action_approach]
→ reveal the matching Grid 2 state
→ lock Grid 1
```

The final grid cannot begin another step because its `dropSlots` array is empty.

## Dual-Slot Completion

Story 2 Chapter 3 uses two character-targeted slots on Grid 1 and Grid 2:

```json
{
  "id": "grid_1",
  "dropSlots": [
    {
      "id": "slot_jojo",
      "targetCharacterID": "jojo"
    },
    {
      "id": "slot_rhodey",
      "targetCharacterID": "rhodey"
    }
  ]
}
```

The next grid appears only after both slots contain valid actions. Before the second slot is filled, the player may replace the action in the first slot. After both slots are filled and the transition occurs, the source grid is locked.

The order of dragging does not change the outcome. These two interactions are equivalent:

```text
Ask Jojo, then Ask Rhodey
Ask Rhodey, then Ask Jojo
```

Both normalize to:

```text
grid_1[slot_jojo:action_asking+slot_rhodey:action_asking]
```

Grid 2 follows the same rule. Its ideal placement is:

```text
grid_2[slot_jojo:action_approach+slot_rhodey:action_approach]
```

## Normalized Outcome Lookup

Build the lookup signature with these rules:

1. Sort steps by the source grid's numeric `order`.
2. Within each step, sort placements by the source grid's `dropSlots` order.
3. Include the source grid ID, slot ID, and action ID.
4. Do not include drag timestamps or the player's drag order.
5. Do not run lookup until all required slots for the current source grid are filled.

An implementation may pre-index every story outcome by its complete normalized signature when the chapter loads. Incremental play can then filter candidates by completed step signatures until only the matching path remains.

## Rendering Character States

Every entry in `outcome.states` corresponds to the grid at the same order and contains `visualSlots`.

- Render visuals by numeric `slot` order.
- `characterIDs` contains one character for a normal expression or individual pose.
- `characterIDs` may contain two characters when one combined pose occupies a single placeholder.
- Resolve the drawing through `assetID` and use `assetType` to distinguish `expression` from `pose`.
- Resolve the background through the matching grid's `backgroundID`.
- Render `textBubble` only when it is not `null`.
- Use the localized string matching the app language, with English as the fallback.

Do not create an empty character placeholder. The number of rendered positions comes from `visualSlots` in the selected state.

### General Expressions

Jojo and Rhodey each have the same ten reusable expression categories: neutral, happy, sad, crying, angry, frustrated, questioning, defensive, calm, and relieved. Story context comes from the expression combined with the selected action, text bubble, and other character.

Do not create a new expression for every outcome. Use a general expression unless the scene needs a physical pose or included object that cannot be shown by changing the face alone.

When an action is premature or unclear, prefer the general `questioning` expression. For example, asking both children to apologize before hearing them renders `jojo_questioning` and `rhodey_questioning`.

### Unique Poses and Combined Placeholders

Unique poses are reserved for physical staging that cannot be represented by a general expression:

- `jojo_drawing`
- `rhodey_drawing`
- `rhodey_crying_torn_paper`
- `rhodey_holding_new_paper`
- `rhodey_injured_sitting`
- `rhodey_bandaged`
- `jojo_rhodey_handshake`

Crayons, paper, scrapes, and bandages are included directly in these complete images. The UI only loads the visual slot's `assetID` and places the resulting image with aspect-fit behavior. It does not position props, calculate anchors, or render overlays.

The handshake uses one visual slot:

```json
{
  "slot": 1,
  "characterIDs": ["jojo", "rhodey"],
  "assetID": "jojo_rhodey_handshake",
  "assetType": "pose"
}
```

The UI must render one combined image in one placeholder and must not add separate Jojo or Rhodey placeholders for that state.

## Asset Resolution

Action IDs, expression IDs, pose IDs, and background IDs are canonical asset identifiers. The same ID intentionally reuses the same drawing across chapters.

- `artist assets.json` is the machine-readable asset catalog.
- `artist assets.md` is the artist-facing catalog.
- Story JSON action names and text bubbles contain English and Indonesian localization.
- Visual directions in the asset catalog are written in English.

## Invalid Input Handling

Reject a story or placement when any of these conditions occur:

- Unknown grid, slot, action, character, expression, or background ID.
- A placement targets a slot that does not belong to its source grid.
- Two placements use the same slot in one step.
- A completed step omits a required slot.
- A step is submitted for a grid other than the current interactive grid.
- A drop is attempted on a completed or final grid.
- No outcome matches the normalized completed steps.

An incomplete dual-slot step is valid pending input, but it must not reveal the next grid. Keep it as temporary UI state until the remaining slot is filled or the existing selection is replaced.

## Result Metadata

Every complete outcome exposes:

- `finalState`: semantic final state identifier.
- `category`: `success`, `progress`, or `retry`.
- `isIdeal`: `true` only for the canonical learning path.

A safe alternative may have `category: "success"` while keeping `isIdeal: false`.
