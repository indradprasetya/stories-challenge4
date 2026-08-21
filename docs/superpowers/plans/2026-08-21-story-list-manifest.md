# Story List Manifest Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add one bilingual `story-list.json` contract to GitHub Pages and the iOS app, then make chapter selection load only the selected story's chapter JSON files.

**Architecture:** GitHub Pages owns the canonical JSON contract and validates it against the six chapter documents. The app bundles an identical copy, decodes lightweight story/chapter references through `StoryListLoader`, and asks `StoryCatalog` to decode chapter definitions only when a story is displayed or gameplay advances.

**Tech Stack:** JSON, Node.js assertions, shell/curl/jq, Swift 5, SwiftUI, Foundation `Codable`, existing `StoryLoader` and `StoryProgressStore`.

**Spec:** `docs/superpowers/specs/2026-08-21-story-list-manifest-design.md`

## Global Constraints

- `schemaVersion` must be exactly `1`.
- Story IDs are `school` and `playground`; story numbers are `1` and `2`.
- Story names require nonempty English and Indonesian values.
- Each story has exactly three ordered chapter references; chapter titles remain in chapter JSON `shortTitle`.
- `story-list.json` must be byte-identical in `/Users/dyan/Projects/stories-challenge4` and `/Users/dyan/Projects/garong/garong/Resources`.
- Do not add runtime network loading, hardcoded fallback stories, dependencies, gameplay changes, progress-format changes, or unlock-rule changes.

---

### Task 1: Publish and validate the Pages story manifest

**Files:**
- Create: `story-list.json`
- Modify: `validate-stories.mjs`
- Modify: `test-site.sh`
- Modify: `tech.md`

**Interfaces:**
- Consumes: the six chapter JSON files referenced by chapter pages in `chapters.json`.
- Produces: the versioned `{ schemaVersion: 1, stories: [...] }` runtime contract later copied into the app.

- [ ] **Step 1: Add failing validator assertions before the file exists**

Add this immediately after `chapterPages`, `assetPages`, and `techPages` are derived:

```javascript
const storyList = JSON.parse(await readFile("story-list.json", "utf8"));
assert.equal(storyList.schemaVersion, 1, "story list must use schema version 1");
assert.equal(storyList.stories.length, 2, "story list must contain two stories");

const expectedStories = [
  { id: "school", number: 1, en: "School", idName: "Sekolah" },
  { id: "playground", number: 2, en: "Playground", idName: "Taman Bermain" }
];
const documentedChapterIDs = new Set();
for (const page of chapterPages) {
  documentedChapterIDs.add(JSON.parse(await readFile(page.json, "utf8")).id);
}
const manifestChapterIDs = new Set();
const manifestResources = new Set();
for (const [index, story] of storyList.stories.entries()) {
  const expected = expectedStories[index];
  assert.deepEqual(
    { id: story.id, number: story.number, en: story.name.en, idName: story.name.id },
    expected,
    `story ${index + 1} metadata mismatch`
  );
  assert.equal(story.chapters.length, 3, `${story.id} must contain three chapters`);
  assert.deepEqual(story.chapters.map(chapter => chapter.number), [1, 2, 3], `${story.id} chapter order mismatch`);
  for (const chapter of story.chapters) {
    assert.ok(!manifestChapterIDs.has(chapter.id), `duplicate story-list chapter ID ${chapter.id}`);
    assert.ok(!manifestResources.has(chapter.resource), `duplicate story-list resource ${chapter.resource}`);
    manifestChapterIDs.add(chapter.id);
    manifestResources.add(chapter.resource);
  }
}
assert.deepEqual(manifestChapterIDs, documentedChapterIDs, "story list must reference all documented chapter IDs");
```

- [ ] **Step 2: Run the validator and confirm the missing contract fails**

Run: `node validate-stories.mjs`

Expected: FAIL with `ENOENT: no such file or directory, open 'story-list.json'`.

- [ ] **Step 3: Add the exact manifest**

Create `story-list.json` with School chapters `rhodey_wants_to_draw`, `jojo_settles_down_to_draw`, and `rhodey_torn_paper`, then Playground chapters `validate_jojo_feelings`, `share_the_slide`, and `listen_before_helping_rhodey`. Map them in order to `story1_chapter1` through `story2_chapter3`, using the contract shown in the spec.

- [ ] **Step 4: Document ownership and add the Pages smoke check**

Add a `Story List Manifest` section to `tech.md` explaining that story names and ordered resource references come from `story-list.json`, while chapter display names still come from each chapter's `shortTitle`. Add this request to `test-site.sh` after its `chapters.json` check:

```sh
curl -fsS "$base_url/story-list.json" |
  jq -e '
    .schemaVersion == 1 and
    (.stories | map(.id) == ["school", "playground"]) and
    (.stories | all(.chapters | length == 3))
  ' >/dev/null
```

- [ ] **Step 5: Run Pages checks**

Run: `node validate-stories.mjs && sh ./test-site.sh`

Expected: both exit `0`; output includes `story contract validation passed` and `site smoke check passed`.

- [ ] **Step 6: Commit the Pages contract**

```bash
git add story-list.json validate-stories.mjs test-site.sh tech.md
git commit -m "feat: publish story list manifest"
```

### Task 2: Decode and validate the bundled app manifest

**Files:**
- Create: `/Users/dyan/Projects/garong/garong/Resources/story-list.json`
- Create: `/Users/dyan/Projects/garong/garong/Data/StoryList.swift`
- Create: `/Users/dyan/Projects/garong/Tests/StoryListTests.swift`

**Interfaces:**
- Consumes: `LocalizedStoryText` and the byte-identical Pages manifest.
- Produces: `StoryList`, `StoryListStory`, `StoryChapterReference`, `StoryListLoader.decode(_:resourceExists:)`, and `StoryListLoader.load(bundle:)`.

- [ ] **Step 1: Copy the manifest and write the failing decoder test**

Copy `story-list.json` byte-for-byte to the app resources folder. Create `Tests/StoryListTests.swift` with an executable `@main` test that loads the resource path passed as argument, calls:

```swift
let stories = try StoryListLoader.decode(data) { resources.contains($0) }
precondition(stories.map(\.id) == ["school", "playground"])
precondition(stories.map { $0.name.localized(language: "id") } == ["Sekolah", "Taman Bermain"])
precondition(stories[0].chapters.map(\.resource) == ["story1_chapter1", "story1_chapter2", "story1_chapter3"])
precondition(stories[1].chapters.map(\.id) == ["validate_jojo_feelings", "share_the_slide", "listen_before_helping_rhodey"])
```

Also decode mutated fixtures and assert they throw for schema version `2`, duplicate story IDs, duplicate chapter IDs, duplicate order numbers, empty localized names, and a resource for which `resourceExists` returns `false`.

- [ ] **Step 2: Run the test and confirm missing types fail compilation**

Run:

```bash
xcrun swiftc Tests/StoryListTests.swift garong/Models/StoryDefinition.swift -o /tmp/garong-story-list-tests
```

Expected: FAIL because `StoryListLoader` is not defined.

- [ ] **Step 3: Implement the smallest validated Codable loader**

Add these types to `garong/Data/StoryList.swift`:

```swift
struct StoryList: Decodable {
    let schemaVersion: Int
    let stories: [StoryListStory]
}

struct StoryListStory: Decodable, Identifiable {
    let id: String
    let number: Int
    let name: LocalizedStoryText
    let chapters: [StoryChapterReference]
}

struct StoryChapterReference: Decodable, Identifiable {
    let id: String
    let number: Int
    let resource: String
}

enum StoryListLoader {
    static func decode(_ data: Data, resourceExists: (String) -> Bool) throws -> [StoryListStory]
    static func load(bundle: Bundle = .main) throws -> [StoryListStory]
}
```

`decode` must use `JSONDecoder`, require schema `1`, reject every invalid fixture from Step 1, and return stories and chapters sorted by `number`. `load(bundle:)` must read `story-list.json` and validate resources with `bundle.url(forResource:withExtension:)`; it must not decode chapter files.

- [ ] **Step 4: Run the decoder test**

Run:

```bash
xcrun swiftc Tests/StoryListTests.swift garong/Data/StoryList.swift garong/Models/StoryDefinition.swift -o /tmp/garong-story-list-tests && /tmp/garong-story-list-tests garong/Resources/story-list.json
```

Expected: PASS and `story list tests passed`.

### Task 3: Load chapters only for the selected story

**Files:**
- Modify: `/Users/dyan/Projects/garong/garong/Data/StoryCatalog.swift`
- Modify: `/Users/dyan/Projects/garong/garong/Views/ChapterSelectionView.swift`
- Modify: `/Users/dyan/Projects/garong/garong/Views/MainMenuView.swift`
- Modify: `/Users/dyan/Projects/garong/garong/Resources/localization.json`
- Test: `/Users/dyan/Projects/garong/Tests/StoryListTests.swift`

**Interfaces:**
- Consumes: `StoryListLoader.load(bundle:) -> [StoryListStory]` and existing `StoryLoader.load(named:)`.
- Produces: `StoryCatalog.stories`, `StoryCatalog.chapters(for:language:)`, and `StoryCatalog.chapter(for:storyNumber:language:)`.

- [ ] **Step 1: Extend the test with selected-story loading expectations**

Add a pure reference check that selecting `stories[0]` yields exactly the three `story1_` resources and selecting `stories[1]` yields exactly the three `story2_` resources. This protects the boundary that chapter selection passes only the selected story's references to `StoryCatalog`.

- [ ] **Step 2: Replace the hardcoded eager catalog**

Keep `StoryChapterItem` because `Chapter.init(storyItem:)` and existing engine tests use it. Delete hardcoded `StoryGroup` construction and implement:

```swift
static var stories: [StoryListStory]
static func chapters(for story: StoryListStory, language: String = AppLocalization.shared.languageCode) -> [Chapter]
static func chapter(for reference: StoryChapterReference, storyNumber: Int, language: String) -> Chapter?
```

`stories` catches loader errors, calls `debugPrint`, and returns `[]`. `chapters(for:)` maps only `story.chapters` through `chapter(for:)`. `chapter(for:)` decodes one referenced resource with `StoryLoader`, verifies the decoded root ID equals `reference.id`, creates a `StoryChapterItem`, and returns `Chapter(storyItem:language:)`.

- [ ] **Step 3: Make Chapter Selection cache selected-story chapters**

Change its input from `[GameStory]` to `[StoryListStory]`. Add:

```swift
@State private var chaptersByStoryID: [String: [Chapter]] = [:]
private var currentStory: StoryListStory? { stories.indices.contains(selectedStoryIndex) ? stories[selectedStoryIndex] : nil }
private var chapters: [Chapter] { currentStory.flatMap { chaptersByStoryID[$0.id] } ?? [] }
```

Guard the artwork/button section with `if let currentStory`. On appearance and after an arrow changes `selectedStoryIndex`, call `loadCurrentStory()`; that method populates the cache only when the current story ID is absent. Resolve previous-story completion and `loadProgress()` from manifest chapter IDs instead of decoded `Chapter.storyDefinition` values. This keeps Story 2 visible but locked until the three School IDs have saved completions.

- [ ] **Step 4: Use manifest metadata from Main Menu and remove duplicated story copy**

Pass `StoryCatalog.stories` to `ChapterSelectionView` from `MainMenuView`. Remove `story.oneTitle`, `story.oneDescription`, `story.twoTitle`, and `story.twoDescription` from `localization.json`; keep general UI keys such as `story.subtitle` and `story.progress` unchanged.

- [ ] **Step 5: Run focused tests and build**

Run the Story List test from Task 2, then:

```bash
DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer xcodebuild -project garong.xcodeproj -scheme garong -sdk iphonesimulator -configuration Debug -derivedDataPath /tmp/garong-story-list-derived CODE_SIGNING_ALLOWED=NO clean build
```

Expected: tests pass and build ends with `** BUILD SUCCEEDED **`.

### Task 4: Advance gameplay through manifest references and verify both repositories

**Files:**
- Modify: `/Users/dyan/Projects/garong/garong/ViewModels/DragDropGameViewModel.swift`
- Modify: `/Users/dyan/Projects/garong/Tests/StoryProgressEngineTests.swift`
- Verify: both `story-list.json` copies

**Interfaces:**
- Consumes: `StoryCatalog.stories` metadata and `StoryCatalog.chapter(for:storyNumber:language:)` from Task 3.
- Produces: next-chapter navigation that decodes only the selected next resource.

- [ ] **Step 1: Add a failing next-reference assertion**

Extend `StoryProgressEngineTests.swift` to construct a current chapter whose definition ID matches the first School manifest reference, initialize `DragDropGameViewModel`, and verify `hasNextChapter` is true and `loadNextChapter()` changes the chapter definition ID to `jojo_settles_down_to_draw`.

- [ ] **Step 2: Replace eager chapter items in the view model**

Replace `storyChapters: [StoryChapterItem]` with `storyChapters: [StoryChapterReference]` and store `storyNumber`. During initialization, locate the manifest story whose chapter reference ID equals `chapter.storyDefinition?.id`. `loadNextChapter()` must call `StoryCatalog.chapter(for:storyNumber:language:)`; update engine state only when that call succeeds. Keep meter character behavior based on `storyNumber == 2`.

- [ ] **Step 3: Run all existing lightweight checks**

Run Story List, App Localization, progress store, asset fallback, and Story Progress Engine executables using their existing `xcrun swiftc` source lists. Expected: every executable exits `0`.

- [ ] **Step 4: Run final builds and cross-repository checks**

Run:

```bash
cmp /Users/dyan/Projects/stories-challenge4/story-list.json /Users/dyan/Projects/garong/garong/Resources/story-list.json
node /Users/dyan/Projects/stories-challenge4/validate-stories.mjs
sh /Users/dyan/Projects/stories-challenge4/test-site.sh
DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer xcodebuild -project /Users/dyan/Projects/garong/garong.xcodeproj -scheme garong -sdk iphonesimulator -configuration Debug -derivedDataPath /tmp/garong-story-list-final CODE_SIGNING_ALLOWED=NO clean build
```

Expected: `cmp` is silent, both Pages checks pass, and Xcode ends with `** BUILD SUCCEEDED **`.

- [ ] **Step 5: Commit the app implementation without absorbing unrelated changes**

Review `git diff` first, stage only the story-list implementation plus already-approved overlapping lines, and commit with the user's configured identity:

```bash
git add garong/Resources/story-list.json garong/Data/StoryList.swift garong/Data/StoryCatalog.swift garong/Views/ChapterSelectionView.swift garong/Views/MainMenuView.swift garong/ViewModels/DragDropGameViewModel.swift garong/Resources/localization.json Tests/StoryListTests.swift Tests/StoryProgressEngineTests.swift
git commit -m "feat: load chapters from story manifest"
```
