# Story Drag-and-Drop Technical Contract

This document explains how the static story JSON describes drag-and-drop progression. It is intended for Swift developers, UI developers, and AI assistants working on the app.

## Story Metadata

Every chapter JSON contains localized metadata in English and Indonesian. Both `en` and `id` are required.

```json
{
  "shortTitle": {
    "en": "Let's Draw!",
    "id": "Ayo Menggambar!"
  },
  "completionSummary": {
    "en": "Rhodey needed to feel noticed before he could join in.",
    "id": "Rhodey perlu merasa diperhatikan sebelum ia bisa ikut beraktivitas."
  },
  "completionTip": {
    "en": "Before asking a hesitant child to join an activity, sit with them first.",
    "id": "Sebelum mengajak anak yang masih ragu untuk mengikuti aktivitas, duduklah bersamanya terlebih dahulu."
  }
}
```

- `shortTitle` is the compact player-facing chapter name used in chapter lists, cards, and navigation. The longer `title` remains the descriptive objective.
- `completionSummary` explains what the child needed and why the successful approach worked.
- `completionTip` turns that lesson into practical guidance for the player.

Show `completionSummary` and `completionTip` only after the chapter result is revealed. These fields are static story content, not player progress, and must remain in bundled JSON rather than `UserDefaults`.

## App UI Localization

The app intentionally uses its own JSON localization catalog instead of Apple's String Catalog (`.xcstrings`). This keeps the in-app language button independent from the device language and matches the bilingual story data.

There are two localization sources with different responsibilities:

- Chapter titles, descriptions, hints, action names, speech bubbles, completion copy, and placement-limit messages remain in their chapter JSON as `{ "en": ..., "id": ... }` values.
- Reusable interface text such as Settings labels, alerts, Hint, Result, Try Again, chapter accessibility labels, and Guidebook copy belongs in the app's bundled `garong/Resources/localization.json` file.

Every UI entry uses a namespaced key and requires both languages:

```json
{
  "result.tryAgain": {
    "en": "Try Again",
    "id": "Coba Lagi"
  }
}
```

Views observe the shared `AppLocalization` store so a language change refreshes visible text immediately:

```swift
@ObservedObject private var localization = AppLocalization.shared

Text(localization.text("result.tryAgain"))
```

The Settings language button switches between `en` and `id`. The selected code is saved in `UserDefaults` under `appLanguage`, so it remains active after the app relaunches.

Follow these rules whenever adding or changing copy:

1. New player-facing UI text must not be hardcoded in `Text`, `Button`, alerts, or accessibility labels. Add a key to `localization.json` first, with nonempty `en` and `id` values, then resolve it through `AppLocalization`.
2. Do not copy story dialogue or chapter-specific content into `localization.json`; keep it in the corresponding chapter JSON.
3. Use namespaced keys such as `settings.resetProgress`, `gameplay.hint`, or `result.next` so ownership stays clear.
4. Keep image and audio asset names unchanged. Asset lookups such as `paper_background` and `story1_img` do not belong in the localization catalog.
5. A missing UI key resolves to the key itself. Treat a visible raw key as a localization defect and add the missing translation rather than adding a hardcoded fallback in the view.

## Story List Manifest

`story-list.json` is the app's lightweight story catalog. It owns each story's stable ID, display order, localized English and Indonesian name, and each chapter's localized `shortTitle` plus resource reference. The app bundles an identical copy and reads it before opening Chapter Selection.

Chapter Selection renders its buttons entirely from the manifest. Gameplay data stays in each chapter file and is decoded only after the player selects that chapter; browsing stories does not load chapter JSON. Progress gating uses the chapter IDs in the manifest without decoding chapter resources.

Chapter Selection uses one shared `paper_background` frame. The artwork for each story follows the `story{number}_img` asset convention, where `number` comes from the manifest. The localized story `name` is rendered separately in uppercase Virels, while chapter buttons use their localized `shortTitle`. Navigation derives its first, middle, and last arrow states from the manifest's story count, so adding a story requires only a new manifest entry and its matching numbered artwork asset.

`chapters.json` remains the GitHub Pages navigation manifest for chapter Markdown, artist assets, and this Technical Guide. Do not replace it with `story-list.json` or add documentation-only fields to the runtime contract.

## Core Model

A grid is both a rendered story state and, unless it is the final grid, the drop target that produces the next state.

1. Render Grid 1 from `outcome.states[0]`.
2. Accept action placements in Grid 1's `dropSlots`.
3. When every required slot is filled, find the matching outcome step and reveal Grid 2.
4. Keep Grid 1 editable so the player can explore another action; recalculate all later states after a replacement.
5. Repeat on each newly revealed interactive grid.
6. Render the final grid as a result. It has no drop slots and never accepts an action.

For a four-grid chapter, Grids 1–3 are interactive and Grid 4 is result-only. For a three-grid chapter, Grids 1–2 are interactive and Grid 3 is result-only.

## Grid Definition

Every grid includes an ordered `dropSlots` array.

- A normal interactive grid has one generic `slot_scene` whose `targetCharacterID` is `null`.
- A character-targeted grid has one slot per target character.
- A final grid has an empty `dropSlots` array and `locked: true`.
- Other grids start with `locked: false`. They remain editable after the next grid appears.

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
→ keep Grid 1 editable for exploration
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

The next grid appears only after both slots contain valid actions. The player may replace either action before or after the next grid appears; every replacement recalculates downstream states.

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
- A step is submitted for a grid that has not been revealed yet.
- A drop is attempted on the final grid.
- No outcome matches the normalized completed steps.

An incomplete dual-slot step is valid pending input, but it must not reveal the next grid. Keep it as temporary UI state until the remaining slot is filled or the existing selection is replaced.

## Result Metadata

Every complete outcome exposes:

- `finalState`: semantic final state identifier.
- `category`: `success`, `progress`, or `retry`.
- `isIdeal`: `true` only for the canonical learning path.

A safe alternative may have `category: "success"` while keeping `isIdeal: false`.

## Placement Challenge and Stars

Every story defines its challenge without storing mutable player state:

- `maximumPlacements` is the accepted placement/replacement limit.
- `starThresholds` contains the green/3-star and yellow/2-star boundaries.
- `placementLimitMessage` is the localized character-specific break message.

```json
{
  "maximumPlacements": 15,
  "starThresholds": {
    "threeStars": 5,
    "twoStars": 9
  },
  "placementLimitMessage": {
    "en": "Jojo and Rhodey are tired. You took too long.",
    "id": "Jojo dan Rhodey kelelahan. Kamu terlalu lama."
  }
}
```

- Count one placement when an empty slot accepts an action or an occupied slot accepts a different action.
- Do not count an invalid drop, the same action dropped into the same slot, removal, restoration, or automatic state recalculation.
- Check success before checking the limit. A successful outcome on the final allowed placement still completes the chapter.
- If the limit is reached without a `success` outcome, enter `needsBreak`; never label it “Game Over.” Use the localized `placementLimitMessage`, which names every character in that chapter.
- Derive the visible face color directly from `starThresholds` and `maximumPlacements`; do not maintain a second set of UI thresholds.

The placement feedback has exactly four states:

- **Green**: `placementCount <= threeStars`; a success earns 3 stars.
- **Yellow**: above `threeStars` through `twoStars`; a success earns 2 stars.
- **Orange**: above `twoStars`; a success earns 1 star, including success on the final allowed placement.
- **Red**: `maximumPlacements` reached without success; the chapter enters `needsBreak` and awards no stars.

Stars are calculated only after success. The current chapters use these settings:

| Choice Slots | Maximum Placements | Green / 3 Stars | Yellow / 2 Stars | Orange / 1 Star | Red / Loss |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 2 | 8 | 0–3 | 4–5 | 6–8 on success | 8 without success |
| 3 | 15 | 0–5 | 6–9 | 10–15 on success | 15 without success |
| 5 | 30 | 0–8 | 9–18 | 19–30 on success | 30 without success |

## Persistent Player Progress

Bundled story JSON is static content and must not contain mutable player progress. The app stores progress separately in local `UserDefaults`, keyed by the story JSON's root `id`.

Store an optional active run separately from the best completed result. Do not copy the story, states, or outcomes into save data.

```json
{
  "listen_before_helping_rhodey": {
    "activeRun": {
      "steps": [{
        "sourceGridID": "grid_1",
        "placements": [
        {
          "slotID": "slot_jojo",
          "actionID": "action_asking"
        },
        {
          "slotID": "slot_rhodey",
          "actionID": "action_approach"
        }
        ]
      }],
      "placementCount": 7,
      "status": "playing"
    },
    "completion": {
      "bestStars": 2,
      "bestPlacementCount": 12
    }
  }
}
```

The Swift backend exposes:

- `StoryProgressStore.state(for:)` to restore the active run and best completion.
- `StoryProgressStore.saveActiveRun(_:for:)` after an accepted placement, replacement, or removal.
- `StoryProgressStore.complete(storyID:stars:placementCount:)` to keep the better completed result and clear the active run.
- `StoryProgressStore.clearActiveRun(storyID:)` for Try Again while preserving completed stars.
- `StoryProgressStore.resetAll()` to erase all game progress.

Save after every accepted placement or replacement, including an incomplete dual-slot step. Save removals too, without increasing `placementCount`. This lets the app restore both completed grids and the current partial grid after relaunch. Completed step order follows grid order; placement order follows `dropSlots` order.

When the player leaves an unfinished chapter, keep `activeRun`; opening that chapter resumes it. On success, save only the best stars and lowest placement count, then clear `activeRun`. Opening a completed chapter with no active run starts a blank replay. If that replay is abandoned, its new `activeRun` coexists with the previous best completion. A worse replay never replaces the best result.

When a run reaches the limit, save `activeRun.status` as `needsBreak`. Reopening the chapter restores the same break screen. Try Again clears only `activeRun`; a full data reset or app deletion clears both active runs and completed results.

Progress survives app termination, device restart, and app updates. It is removed by the in-game reset operation or when the player deletes the app. Offloading the app may preserve its data.
