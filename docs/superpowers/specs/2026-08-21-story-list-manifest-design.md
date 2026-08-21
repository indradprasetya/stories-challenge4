# Story List Manifest Design

Date: 2026-08-21

## Goal

Replace the app's hardcoded story grouping with a bundled `story-list.json` manifest. The manifest defines the localized story names and the ordered chapter references for School and Playground. The app loads chapter JSON only for the story currently being viewed instead of loading every chapter from every story up front.

The same manifest is stored in both repositories:

- Documentation: `/Users/dyan/Projects/stories-challenge4/story-list.json`
- App bundle: `/Users/dyan/Projects/garong/garong/Resources/story-list.json`

`chapters.json` remains the GitHub Pages navigation manifest because it also describes Markdown pages, artist assets, and the Technical Guide. `story-list.json` is the runtime story contract and is exposed on GitHub Pages as a standalone JSON resource.

## Chosen Approach

Use one lightweight story manifest and load only the selected story's chapter resources.

Alternatives not selected:

1. Keep the Swift story list hardcoded. This leaves story names and ordering duplicated in code.
2. Decode `story-list.json` but eagerly load every referenced chapter. This removes hardcoding but does not satisfy the selected-story loading requirement.
3. Replace the GitHub Pages `chapters.json` manifest. This would mix application data with documentation navigation and unrelated asset pages.

## JSON Contract

```json
{
  "schemaVersion": 1,
  "stories": [
    {
      "id": "school",
      "number": 1,
      "name": {
        "en": "School",
        "id": "Sekolah"
      },
      "chapters": [
        {
          "id": "rhodey_wants_to_draw",
          "number": 1,
          "resource": "story1_chapter1"
        }
      ]
    }
  ]
}
```

Rules:

- `schemaVersion` is `1`.
- Story `id` values are stable semantic identifiers: `school` and `playground`.
- Story `number` determines display order and the existing `story{number}_background` asset.
- Story `name` requires nonempty English (`en`) and Indonesian (`id`) values.
- Each chapter entry includes the chapter JSON root `id`, its order within the story, and its bundle resource name without `.json`.
- Chapters and stories are rendered in numeric `number` order.
- Chapter titles continue to come from each chapter JSON's localized `shortTitle`; the manifest does not duplicate chapter titles.

The complete initial content contains three chapter references under School and three under Playground.

## App Models and Loading

Add Codable manifest models and a loader for the bundled `story-list.json`. `StoryCatalog` becomes the single access point for:

- decoding the story metadata list without decoding chapter files;
- producing localized School or Playground presentation metadata;
- loading the three chapter definitions for one requested story entry.

`ChapterSelectionView` receives story metadata first. On initial display it loads School's chapters. Moving with the arrow loads and displays only the destination story's chapters. It may retain already-loaded chapters in view state so returning with the arrow does not decode the same files again during that screen session.

Progress lookup uses chapter IDs from the manifest, so Story 2 can remain locked until all School chapter IDs have completions without decoding School chapter JSON again. Selecting a chapter passes its decoded `Chapter` into the existing loading and gameplay flow.

`DragDropGameViewModel` finds the current story and its next chapter through manifest references, then loads only that story's referenced chapter when advancing. It does not search a globally decoded list of every chapter.

## Localization

Story names live in `story-list.json` because they are content metadata. They must not be duplicated in the UI `localization.json` catalog. General interface phrases such as the chapter-count subtitle remain in `localization.json`.

The active `AppLocalization.languageCode` selects `name.en` or `name.id`. Chapter `shortTitle`, action names, hints, dialogue, result text, and tips continue using localized fields from their chapter JSON.

Image asset names do not change and are not localized.

## Failure Handling

The manifest loader rejects a missing file, unsupported schema version, duplicate story or chapter IDs, empty localized names, duplicate order numbers, and chapter resources that cannot be decoded.

Chapter Selection must avoid indexing an empty story list. A manifest failure results in an empty catalog and a debug log rather than a crash. No hardcoded story list is retained as a fallback because it would create a second source of truth.

## GitHub Pages and Documentation

Add the same `story-list.json` content to the GitHub Pages repository. Extend `tech.md` with the schema and loading ownership. Keep `chapters.json` unchanged for site navigation.

The Pages validator verifies:

- exactly two stories named School/Sekolah and Playground/Taman Bermain;
- three ordered chapters per story;
- unique story IDs, chapter IDs, and resource names;
- every manifest chapter ID matches one of the six documented chapter JSON files.

## Verification

App checks:

- Decode the bundled manifest and verify its localized names and chapter order.
- Verify loading School returns only its three chapter definitions.
- Verify loading Playground returns only its three chapter definitions.
- Verify chapter progress IDs and next-chapter navigation still match saved progress.
- Run the existing progress, localization, engine, asset, and clean simulator build checks.

Documentation checks:

- Run `node validate-stories.mjs`.
- Run `sh test-site.sh` and confirm `story-list.json` is served successfully.
- Confirm the two manifest copies are byte-for-byte identical before handoff.

## Out of Scope

- Replacing the custom localization system with Apple's String Catalog.
- Localizing image or audio assets.
- Downloading story content from the network at runtime.
- Changing chapter gameplay, outcomes, save-data format, or unlock rules.
