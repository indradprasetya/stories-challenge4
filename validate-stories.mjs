import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const expectedCounts = new Map([
  ["story-1-chapter-1", 9],
  ["story-1-chapter-2", 64],
  ["story-1-chapter-3", 64],
  ["story-2-chapter-1", 9],
  ["story-2-chapter-2", 64],
  ["story-2-chapter-3", 625]
]);

const idealActions = new Map([
  ["story-1-chapter-1", [["action_approach"], ["action_crayon"]]],
  ["story-1-chapter-2", [["action_attention_reset"], ["action_ask_quiet"], ["action_crayon"]]],
  ["story-1-chapter-3", [["action_approach"], ["action_asking"], ["action_paper"]]],
  ["story-2-chapter-1", [["action_approach"], ["action_asking"]]],
  ["story-2-chapter-2", [["action_asking"], ["action_approach"], ["action_apologize"]]],
  ["story-2-chapter-3", [["action_asking", "action_asking"], ["action_approach"], ["action_give_bandage"]]]
]);

const expectedExpressionIDs = new Set([
  "jojo_neutral", "jojo_happy", "jojo_sad", "jojo_angry",
  "jojo_frustrated", "jojo_questioning", "jojo_defensive", "jojo_calm", "jojo_relieved",
  "rhodey_neutral", "rhodey_happy", "rhodey_sad", "rhodey_crying", "rhodey_angry",
  "rhodey_frustrated", "rhodey_questioning", "rhodey_defensive", "rhodey_calm", "rhodey_relieved"
]);
const expectedPoseIDs = new Set([
  "jojo_drawing",
  "rhodey_drawing",
  "rhodey_crying_torn_paper",
  "rhodey_holding_new_paper",
  "rhodey_injured_sitting",
  "rhodey_bandaged",
  "jojo_rhodey_handshake"
]);

function localized(value, label) {
  assert.equal(typeof value?.en, "string", `${label} requires English text`);
  assert.equal(typeof value?.id, "string", `${label} requires Indonesian text`);
  assert.ok(value.en.length > 0 && value.id.length > 0, `${label} cannot be empty`);
}

function outcomeKey(outcome) {
  return outcome.steps.map(step => {
    const placements = [...step.placements]
      .sort((left, right) => left.slotID.localeCompare(right.slotID))
      .map(placement => `${placement.slotID}:${placement.actionID}`)
      .join("+");
    return `${step.sourceGridID}[${placements}]`;
  }).join("|");
}

function actionShape(outcome) {
  return outcome.steps.map(step => [...step.placements]
    .sort((left, right) => left.slotID.localeCompare(right.slotID))
    .map(placement => placement.actionID));
}

function findOutcome(story, steps) {
  const key = outcomeKey({ steps });
  return story.outcomes.find(outcome => outcomeKey(outcome) === key);
}

const manifest = JSON.parse(await readFile("chapters.json", "utf8"));
const chapterPages = manifest.filter(page => page.type === "chapter");
const assetPages = manifest.filter(page => page.type === "assets");
const techPages = manifest.filter(page => page.type === "tech");

assert.equal(manifest.length, 8, "manifest must contain six chapters, one asset page, and one tech page");
assert.equal(chapterPages.length, 6, "manifest must contain six chapter pages");
assert.equal(assetPages.length, 1, "manifest must contain one Artist Assets page");
assert.equal(techPages.length, 1, "manifest must contain one Technical Guide page");
assert.equal(techPages[0].markdown, "tech.md", "Technical Guide must render tech.md");
assert.equal("json" in techPages[0], false, "Technical Guide must not expose a JSON file");

const assetPage = assetPages[0];
const assetCatalog = JSON.parse(await readFile(assetPage.json, "utf8"));
const assetIDs = new Set(assetCatalog.assets.map(asset => asset.id));
assert.equal(assetIDs.size, assetCatalog.assets.length, "asset IDs must be unique");
assert.deepEqual(new Set(assetCatalog.assets.filter(asset => asset.type === "expression").map(asset => asset.id)), expectedExpressionIDs, "catalog must contain exactly 19 used general expressions");
assert.deepEqual(new Set(assetCatalog.assets.filter(asset => asset.type === "pose").map(asset => asset.id)), expectedPoseIDs, "catalog must contain exactly seven unique poses");
assert.equal(assetCatalog.assets.filter(asset => asset.type === "prop").length, 0, "two-week scope must not use separate prop assets");

let totalOutcomes = 0;
const actualUsage = new Map();

for (const page of chapterPages) {
  const story = JSON.parse(await readFile(page.json, "utf8"));
  const markdown = await readFile(page.markdown, "utf8");
  const expectedCount = expectedCounts.get(page.slug);

  assert.equal(story.schemaVersion, 4, `${page.slug} must use schema version 4`);
  assert.equal(story.gridCount, story.grids.length, `${page.slug} gridCount mismatch`);
  assert.equal(story.choiceCount, story.grids.reduce((sum, grid) => sum + grid.dropSlots.length, 0), `${page.slug} choiceCount must equal total drop slots`);
  assert.equal(story.outcomes.length, expectedCount, `${page.slug} outcome count mismatch`);
  assert.match(markdown, new RegExp(`Possibilities:\\s*${expectedCount}`), `${page.slug} must document its possibility count`);
  assert.match(markdown, new RegExp(`Choice Slots:\\s*${story.choiceCount}`), `${page.slug} must document its choice slot count`);
  assert.doesNotMatch(markdown, /^> Story:/m, `${page.slug} overview must not repeat its story number`);
  assert.match(markdown, /### Grid & Choice Slot Breakdown/, `${page.slug} must explain its grid and choice slots`);
  const possibilityFactors = Array(story.choiceCount).fill(story.actions.length).join(" × ");
  assert.match(markdown, new RegExp(`\\*\\*Possibility formula:\\*\\* ${possibilityFactors} = ${expectedCount} outcomes \\(${story.actions.length} actions across ${story.choiceCount} slots\\)`), `${page.slug} must explain its possibility formula`);
  localized(story.title, `${page.slug} title`);
  localized(story.description, `${page.slug} description`);

  const actionIDs = new Set();
  for (const action of story.actions) {
    assert.ok(!actionIDs.has(action.id), `${page.slug} has duplicate action ${action.id}`);
    actionIDs.add(action.id);
    localized(action.name, `${page.slug} action ${action.id}`);
    assert.ok(assetIDs.has(action.id), `${page.slug} references uncatalogued action ${action.id}`);
    actualUsage.set(action.id, (actualUsage.get(action.id) ?? new Set()).add(page.slug));
  }

  const characters = new Map(story.characters.map(character => [character.id, character]));
  assert.equal(characters.size, story.characters.length, `${page.slug} character IDs must be unique`);
  for (const character of story.characters) {
    for (const expressionID of character.expressionIDs) {
      assert.ok(expectedExpressionIDs.has(expressionID), `${page.slug} character uses non-general expression ${expressionID}`);
      assert.ok(assetIDs.has(expressionID), `${page.slug} references uncatalogued expression ${expressionID}`);
      actualUsage.set(expressionID, (actualUsage.get(expressionID) ?? new Set()).add(page.slug));
    }
  }

  const grids = new Map(story.grids.map(grid => [grid.id, grid]));
  assert.equal(grids.size, story.grids.length, `${page.slug} grid IDs must be unique`);
  for (const [index, grid] of story.grids.entries()) {
    assert.equal(grid.order, index + 1, `${page.slug} grid order must be sequential`);
    assert.ok(assetIDs.has(grid.backgroundID), `${page.slug} references uncatalogued background ${grid.backgroundID}`);
    actualUsage.set(grid.backgroundID, (actualUsage.get(grid.backgroundID) ?? new Set()).add(page.slug));
    const slotIDs = new Set(grid.dropSlots.map(slot => slot.id));
    assert.equal(slotIDs.size, grid.dropSlots.length, `${page.slug} ${grid.id} slot IDs must be unique`);
    if (index === story.grids.length - 1) {
      assert.equal(grid.locked, true, `${page.slug} final grid must be locked`);
      assert.equal(grid.dropSlots.length, 0, `${page.slug} final grid must not accept drops`);
    } else {
      assert.equal(grid.locked, false, `${page.slug} interactive grid must start unlocked`);
      assert.ok(grid.dropSlots.length > 0, `${page.slug} interactive grid requires drop slots`);
    }
    for (const slot of grid.dropSlots) {
      if (slot.targetCharacterID !== null) {
        assert.ok(characters.has(slot.targetCharacterID), `${page.slug} ${slot.id} has unknown target character`);
      }
    }
  }

  if (page.slug === "story-2-chapter-3") {
    assert.deepEqual(story.grids.map(grid => grid.dropSlots.length), [2, 1, 1, 0]);
    assert.deepEqual(story.grids[0].dropSlots.map(slot => slot.targetCharacterID), ["jojo", "rhodey"]);
    assert.match(markdown, /Jojo \+ Rhodey \(one targeted slot each\)/, "dual-slot chapter must explain both targeted slots");
    assert.match(markdown, /Both slots must be filled before Grid 2 appears/, "dual-slot chapter must explain its completion rule");

    const ideal = story.outcomes.find(outcome => outcome.isIdeal);
    const reversedFirstStep = {
      ...ideal.steps[0],
      placements: [...ideal.steps[0].placements].reverse()
    };
    assert.equal(findOutcome(story, [reversedFirstStep, ...ideal.steps.slice(1)])?.isIdeal, true, "reversed dual-drop order must resolve to the same outcome");
    assert.equal(findOutcome(story, [{ ...reversedFirstStep, placements: reversedFirstStep.placements.slice(0, 1) }, ...ideal.steps.slice(1)]), undefined, "incomplete dual placement must not resolve an outcome");
  } else {
    assert.deepEqual(story.grids.map(grid => grid.dropSlots.length), [
      ...Array(story.gridCount - 1).fill(1),
      0
    ]);
  }

  const outcomeKeys = new Set();
  for (const outcome of story.outcomes) {
    assert.equal(outcome.steps.length, story.gridCount - 1, `${page.slug} outcome step count mismatch`);
    assert.equal(outcome.states.length, story.gridCount, `${page.slug} outcome state count mismatch`);
    assert.ok(["success", "progress", "retry"].includes(outcome.category), `${page.slug} invalid category`);
    assert.equal(typeof outcome.finalState, "string", `${page.slug} finalState is required`);
    assert.equal(typeof outcome.isIdeal, "boolean", `${page.slug} isIdeal is required`);

    for (const [stepIndex, step] of outcome.steps.entries()) {
      const sourceGrid = story.grids[stepIndex];
      assert.equal(step.sourceGridID, sourceGrid.id, `${page.slug} outcome source grid order mismatch`);
      assert.equal(step.placements.length, sourceGrid.dropSlots.length, `${page.slug} incomplete placements for ${sourceGrid.id}`);
      const expectedSlots = sourceGrid.dropSlots.map(slot => slot.id).sort();
      const actualSlots = step.placements.map(placement => placement.slotID).sort();
      assert.deepEqual(actualSlots, expectedSlots, `${page.slug} placement slots mismatch`);
      for (const placement of step.placements) {
        assert.ok(actionIDs.has(placement.actionID), `${page.slug} placement references unknown action`);
      }
    }

    for (const [stateIndex, state] of outcome.states.entries()) {
      assert.equal(state.gridID, story.grids[stateIndex].id, `${page.slug} state grid order mismatch`);
      assert.ok(state.visualSlots.length >= 1 && state.visualSlots.length <= 2, `${page.slug} state requires one or two visual slots`);
      const occupiedSlots = new Set();
      for (const visualSlot of state.visualSlots) {
        assert.ok(!occupiedSlots.has(visualSlot.slot), `${page.slug} has duplicate visual slot`);
        occupiedSlots.add(visualSlot.slot);
        assert.ok(["expression", "pose"].includes(visualSlot.assetType), `${page.slug} visual slot has invalid asset type`);
        assert.ok(assetIDs.has(visualSlot.assetID), `${page.slug} state references unknown visual asset`);
        assert.ok(visualSlot.characterIDs.length >= 1 && visualSlot.characterIDs.length <= 2, `${page.slug} visual slot requires one or two character IDs`);
        for (const characterID of visualSlot.characterIDs) {
          assert.ok(characters.has(characterID), `${page.slug} state references unknown character`);
        }
        if (visualSlot.assetType === "expression") {
          assert.equal(visualSlot.characterIDs.length, 1, `${page.slug} expression slot must represent one character`);
          assert.ok(characters.get(visualSlot.characterIDs[0]).expressionIDs.includes(visualSlot.assetID), `${page.slug} state references expression outside character definition`);
        }
        actualUsage.set(visualSlot.assetID, (actualUsage.get(visualSlot.assetID) ?? new Set()).add(page.slug));
      }
      assert.equal("propIDs" in state, false, `${page.slug} state must not require prop positioning`);
      if (state.textBubble !== null) {
        assert.ok(characters.has(state.textBubble.speakerID), `${page.slug} text bubble has unknown speaker`);
        localized(state.textBubble.text, `${page.slug} text bubble`);
      }
    }

    const key = outcomeKey(outcome);
    assert.ok(!outcomeKeys.has(key), `${page.slug} has duplicate outcome signature ${key}`);
    outcomeKeys.add(key);
  }

  const ideals = story.outcomes.filter(outcome => outcome.isIdeal);
  assert.equal(ideals.length, 1, `${page.slug} must have exactly one ideal outcome`);
  assert.deepEqual(actionShape(ideals[0]), idealActions.get(page.slug), `${page.slug} ideal path mismatch`);
  assert.equal(ideals[0].category, "success", `${page.slug} ideal outcome must succeed`);

  if (page.slug === "story-2-chapter-2") {
    const prematureApology = story.outcomes.find(outcome => outcome.steps[0].placements[0].actionID === "action_apologize");
    assert.deepEqual(prematureApology.states[1].visualSlots.map(slot => slot.assetID), ["jojo_questioning", "rhodey_questioning"], "premature apology must make both children question the action");
    const finalIdealState = ideals[0].states.at(-1);
    assert.deepEqual(finalIdealState.visualSlots, [{
      slot: 1,
      characterIDs: ["jojo", "rhodey"],
      assetID: "jojo_rhodey_handshake",
      assetType: "pose"
    }], "mutual apology must render one combined handshake placeholder");
  }

  if (page.slug === "story-2-chapter-3") {
    const handshakeStates = story.outcomes.flatMap(outcome => outcome.states).filter(state => state.visualSlots.some(slot => slot.assetID === "jojo_rhodey_handshake"));
    assert.equal(handshakeStates.length, 0, "handshake pose belongs only to the apology chapter");
  }
  totalOutcomes += story.outcomes.length;
}

assert.equal(totalOutcomes, 835, "total outcome count must be 835");

for (const asset of assetCatalog.assets) {
  assert.ok(["action", "expression", "pose", "background"].includes(asset.type), `${asset.id} has invalid asset type`);
  assert.equal(typeof asset.visualDirection, "string", `${asset.id} needs visual direction`);
  assert.ok(asset.visualDirection.length > 0, `${asset.id} visual direction cannot be empty`);
  assert.ok(asset.reuseCount > 0, `${asset.id} must be used by at least one chapter`);
  const expectedUsage = [...(actualUsage.get(asset.id) ?? new Set())].sort();
  assert.deepEqual([...asset.usedIn].sort(), expectedUsage, `${asset.id} usage mismatch`);
  assert.equal(asset.reuseCount, expectedUsage.length, `${asset.id} reuseCount mismatch`);
}

console.log("story contract validation passed: 6 chapters, 8 pages, 835 outcomes");
