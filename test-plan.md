# Garong iOS Story Game — Test Plan

**Version:** 1.0  
**Date:** 21 August 2026  
**Status:** Draft for TestFlight  
**Platforms:** iPhone and iPad, landscape gameplay  
**Content:** 2 stories, 6 chapters, 3,335 explicit outcomes

## 1. Purpose

This plan defines what the team must test before sharing the app through TestFlight. The goal is to confirm that each story loads correctly, drag-and-drop choices produce the expected scenes, placement limits and stars are calculated correctly, unfinished chapters resume safely, and the experience remains understandable for players in English and Indonesian.

## 2. Test Objectives

- Confirm all six bundled story JSON files load without errors.
- Confirm every valid action combination resolves to the intended outcome.
- Confirm single-slot and dual-character drop behavior.
- Confirm placement counting, colored face states, loss behavior, and stars.
- Confirm unfinished progress, completed results, and replay behavior persist correctly.
- Confirm chapter text, speech bubbles, actions, images, backgrounds, audio, and localization.
- Confirm the app remains responsive with the 3,125-outcome final chapter.
- Find usability problems that make the parenting lesson unclear or reveal the ideal answer too early.

## 3. Scope

### In Scope

- Main menu and chapter selection.
- Six playable chapters.
- Story JSON loading and validation.
- Drag, drop, replacement, removal, and progressive grid reveal.
- Single-slot and targeted dual-slot grids.
- Story reactions, expressions, speech bubbles, and result grids.
- Placement counter and green, yellow, orange, and red feedback states.
- Chapter completion, stars, completion summary, and completion tip.
- Local progress and best-result persistence.
- English and Indonesian story content.
- Landscape layout, common iPhone/iPad sizes, audio, haptics, and accessibility basics.

### Out of Scope

- Remote backend, account login, cloud synchronization, multiplayer, analytics, and purchases.
- Chapters or assets not included in the current six-chapter build.
- Testing every iOS device model; use the representative device matrix below.

## 4. Test Environment

Test at minimum on:

| Environment | Purpose |
| --- | --- |
| Small iPhone simulator or device | Check compact landscape layout and touch targets. |
| Large iPhone simulator or device | Check normal target experience. |
| iPad simulator or device | Check scaling and unused space. |
| Physical iPhone | Check real drag behavior, sound, haptics, performance, and relaunch persistence. |
| TestFlight build | Confirm release packaging and bundled JSON/assets. |

Recommended conditions:

- Test once with a clean install.
- Test once after upgrading over the previous build.
- Test once after force-quitting during an unfinished chapter.
- Test with the device offline; stories are bundled and must remain playable.
- Test with English and Indonesian app language settings.
- Test with sound on, silent mode, and headphones.

## 5. Story Test Data

| Chapter | Characters | Choice Slots | Actions | Outcomes | Max Placements | Green / 3★ | Yellow / 2★ | Orange / 1★ | Red / Loss |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Story 1 Chapter 1 — Let’s Draw! | Rhodey | 2 | 3 | 9 | 8 | 0–3 | 4–5 | 6–8 on success | 8 without success |
| Story 1 Chapter 2 — Too Loud to Draw | Jojo, Rhodey | 3 | 4 | 64 | 15 | 0–5 | 6–9 | 10–15 on success | 15 without success |
| Story 1 Chapter 3 — My Drawing Tore | Rhodey | 3 | 4 | 64 | 15 | 0–5 | 6–9 | 10–15 on success | 15 without success |
| Story 2 Chapter 1 — That Hurt My Feelings | Jojo, Rhodey | 2 | 3 | 9 | 8 | 0–3 | 4–5 | 6–8 on success | 8 without success |
| Story 2 Chapter 2 — The Slide Is Mine | Jojo, Rhodey | 3 | 4 | 64 | 15 | 0–5 | 6–9 | 10–15 on success | 15 without success |
| Story 2 Chapter 3 — Jojo Pushed Me! | Jojo, Rhodey | 5 | 5 | 3,125 | 30 | 0–8 | 9–18 | 19–30 on success | 30 without success |

## 6. Priority and Result Definitions

| Priority | Meaning |
| --- | --- |
| P0 | Release blocker: crash, lost progress, impossible completion, wrong star/loss result, or missing chapter. |
| P1 | Major: incorrect reaction, localization failure, broken drag slot, or major layout problem. |
| P2 | Minor: visual polish, small spacing issue, or non-blocking copy issue. |

Use these execution results:

- **Pass:** Actual behavior matches the expected result.
- **Fail:** Actual behavior differs from the expected result.
- **Blocked:** The test cannot run because another defect prevents it.
- **Not Run:** The test has not been executed yet.

## 7. Entry Criteria

- The build installs and launches.
- All six JSON files and required assets are bundled.
- The team knows the build number and test device/OS.
- Previous P0 defects are fixed or explicitly accepted.
- Testers can reach all six chapters.

## 8. Functional Test Cases

### A. Launch and Navigation

| ID | Priority | Steps | Expected Result |
| --- | --- | --- | --- |
| NAV-01 | P0 | Install and launch the app. | App opens without a crash and shows the main entry screen. |
| NAV-02 | P0 | Open chapter selection. | Two stories and six chapters are visible with correct short titles. |
| NAV-03 | P0 | Open each chapter one by one. | Correct chapter title, grids, actions, characters, and background appear. |
| NAV-04 | P1 | Enter a chapter, then return to chapter selection. | Navigation is responsive and does not duplicate or corrupt the chapter. |
| NAV-05 | P1 | Complete a chapter, return, and open it again. | Best stars appear on the chapter card and the replay starts empty. |
| NAV-06 | P1 | Use Back while dragging or immediately after a drop. | App returns safely and keeps any accepted unfinished progress. |

### B. Story JSON and Content Integrity

| ID | Priority | Steps | Expected Result |
| --- | --- | --- | --- |
| DATA-01 | P0 | Load all six chapters from a clean install. | Every JSON decodes and validates; no chapter silently falls back to empty content. |
| DATA-02 | P0 | Compare each chapter with the Story Test Data table. | Grid count, choice slots, action count, limits, and thresholds match. |
| DATA-03 | P0 | Run the content validator. | Exactly 6 chapters, 8 documentation pages, and 3,335 unique outcomes pass validation. |
| DATA-04 | P0 | Check every interactive grid and final grid. | Interactive grids have valid drop slots; final grid has no drop slots. |
| DATA-05 | P1 | Inspect outcome references. | Every grid, slot, action, character, expression, pose, and background ID exists. |
| DATA-06 | P1 | Inspect localized fields. | Titles, descriptions, hints, action names, bubbles, completion text, and break messages contain both `en` and `id`. |
| DATA-07 | P1 | Launch with the device offline. | All stories, images, and actions still load. |

### C. Drag-and-Drop Basics

| ID | Priority | Steps | Expected Result |
| --- | --- | --- | --- |
| DD-01 | P0 | Drag a valid action into an empty unlocked slot. | Action attaches to the slot, placement count increases by one, reaction updates, and progress saves. |
| DD-02 | P0 | Drop a different action into an occupied slot. | Previous action is replaced, placement count increases by one, and downstream story states recalculate. |
| DD-03 | P0 | Drop the same action into the same occupied slot. | Nothing changes and placement count does not increase. |
| DD-04 | P1 | Drop outside all valid slots. | Drop is rejected and placement count does not increase. |
| DD-05 | P1 | Remove an attached action. | Slot becomes empty and progress saves, but placement count does not increase. |
| DD-06 | P0 | Try to drop into a grid that has not been revealed. | Drop is rejected. |
| DD-07 | P0 | Try to drop into the final result grid. | Drop is rejected because the final grid has no choice slot. |
| DD-08 | P0 | Fill every required slot on the current grid. | Next grid appears only after the grid is complete. |
| DD-09 | P0 | Replace an action on an earlier completed grid. | Earlier grid remains editable and every later visible state recalculates consistently. |
| DD-10 | P1 | Rapidly drag and replace actions several times. | No duplicate objects, frozen drag state, crash, or incorrect count occurs. |

### D. Dual-Character Slots — Story 2 Chapter 3

| ID | Priority | Steps | Expected Result |
| --- | --- | --- | --- |
| DUAL-01 | P0 | Place an action only for Jojo on Grid 1. | Grid 2 stays hidden; partial choice is saved. |
| DUAL-02 | P0 | Place an action only for Rhodey on Grid 1. | Grid 2 stays hidden; partial choice is saved. |
| DUAL-03 | P0 | Fill both Jojo and Rhodey slots on Grid 1. | Grid 2 appears after the second slot is filled. |
| DUAL-04 | P0 | Select Jojo first, then Rhodey. Restart and select Rhodey first, then Jojo using the same slot assignments. | Both drag orders resolve to the same outcome. |
| DUAL-05 | P0 | Fill both character slots on Grid 2. | Grid 3 appears only after both slots are filled. |
| DUAL-06 | P0 | Put the same action in both targeted slots. | Both placements are accepted and resolved by target slot, not drag order. |
| DUAL-07 | P0 | Replace only Jojo’s action after both slots are filled. | Rhodey’s placement remains unchanged and downstream states recalculate. |
| DUAL-08 | P0 | Force-quit after filling only one targeted slot, then reopen. | The same partial slot and placement count are restored. |

### E. Outcome and Story Reaction Logic

| ID | Priority | Steps | Expected Result |
| --- | --- | --- | --- |
| OUT-01 | P0 | Play each ideal path in Section 9. | Final category is `success`, `isIdeal` is true, and expected result art/text appears. |
| OUT-02 | P0 | Play a documented safe alternative with `category: success`. | Chapter completes even when `isIdeal` is false. |
| OUT-03 | P0 | Complete all slots with a `progress` outcome. | Player can keep exploring; chapter does not award stars. |
| OUT-04 | P0 | Complete all slots with a `retry` outcome. | Reaction communicates the consequence; player can replace earlier actions. |
| OUT-05 | P1 | Use an action too early, such as Apologize before understanding the conflict. | Children show a questioning or context-appropriate reusable expression. |
| OUT-06 | P1 | Change an early action after later grids are filled. | Current outcome, expressions, bubbles, and final state all match the new full sequence. |
| OUT-07 | P1 | Compare individual and combined poses. | Handshake renders as one Jojo-and-Rhodey placeholder; individual expressions use separate placeholders. |

### F. Placement Counter, Face States, Stars, and Loss

| ID | Priority | Steps | Expected Result |
| --- | --- | --- | --- |
| CHL-01 | P0 | Start any new chapter. | Face starts green and no completion stars are shown during gameplay. |
| CHL-02 | P0 | Reach exactly the chapter’s `threeStars` threshold. | Face remains green; success awards 3 stars. |
| CHL-03 | P0 | Make one more valid placement than `threeStars`. | Face changes to yellow; success awards 2 stars. |
| CHL-04 | P0 | Reach exactly the `twoStars` threshold. | Face remains yellow; success awards 2 stars. |
| CHL-05 | P0 | Make one more valid placement than `twoStars`. | Face changes to orange; success awards 1 star. |
| CHL-06 | P0 | Reach `maximumPlacements` with a successful final drop. | Success is checked first: chapter completes, face/result remains in the 1-star outcome, and 1 star is awarded. |
| CHL-07 | P0 | Reach `maximumPlacements` without a success outcome. | Face becomes red, phase becomes `needsBreak`, no stars are awarded, and further drops are blocked. |
| CHL-08 | P0 | Trigger red in a Rhodey-only chapter. | Message says “Rhodey is tired. You took too long.” or its Indonesian equivalent; it never displays generic “Game Over.” |
| CHL-09 | P0 | Trigger red in a Jojo-and-Rhodey chapter. | Message names both Jojo and Rhodey or shows its Indonesian equivalent. |
| CHL-10 | P0 | Tap Try Again from the red state. | Current active run and count reset; previously earned best stars remain. |
| CHL-11 | P1 | Observe each state in light and dark system appearance. | Green, yellow, orange, and red remain distinguishable by both face expression and color. |
| CHL-12 | P1 | Use VoiceOver on the face indicator. | Accessibility label announces the color and star range or loss state. |

### G. Save, Resume, Completion, and Replay

| ID | Priority | Steps | Expected Result |
| --- | --- | --- | --- |
| SAVE-01 | P0 | Make one or more placements, leave before success, and reopen. | Exact slot assignments and placement count resume. |
| SAVE-02 | P0 | Force-quit after a valid placement and relaunch. | Latest accepted state resumes without losing or duplicating a placement. |
| SAVE-03 | P0 | Complete a chapter. | Active run is cleared; best stars and best placement count are saved. |
| SAVE-04 | P0 | Reopen a completed chapter with no active replay. | Chapter starts empty for replay while the card retains best stars. |
| SAVE-05 | P0 | Start a replay, make placements, leave, and reopen. | Replay resumes while the previous best completion remains visible/saved. |
| SAVE-06 | P0 | Finish a replay with fewer stars than the best result. | Worse result does not overwrite best stars or best placement count. |
| SAVE-07 | P0 | Finish a replay with more stars. | Better stars replace the previous best result. |
| SAVE-08 | P1 | Finish twice with equal stars but fewer placements on the second run. | Best placement count updates to the lower value. |
| SAVE-09 | P0 | Reach red, close the app, and reopen the chapter. | The same `needsBreak` screen is restored. |
| SAVE-10 | P1 | Update the app over a build with legacy saved steps. | Legacy unfinished steps migrate or restore without a crash. |
| SAVE-11 | P1 | Delete the app and reinstall. | Local progress and best results are cleared. |

### H. Localization

| ID | Priority | Steps | Expected Result |
| --- | --- | --- | --- |
| LOC-01 | P0 | Run all chapters in English. | Titles, action names, bubbles, completion text, and break messages are English. |
| LOC-02 | P0 | Run all chapters in Indonesian. | All player-facing story text uses Indonesian; no empty text appears. |
| LOC-03 | P1 | Check long Indonesian strings on a small iPhone. | Text wraps without clipping important buttons, characters, or choices. |
| LOC-04 | P1 | Switch language between sessions. | Static story text follows the current language; saved action IDs and progress remain valid. |
| LOC-05 | P1 | Inspect missing-language fallback using a development fixture. | App uses English fallback or rejects malformed content; it never shows a raw localization object. |

### I. Visuals, Audio, Haptics, and Accessibility

| ID | Priority | Steps | Expected Result |
| --- | --- | --- | --- |
| UI-01 | P0 | View every chapter’s initial and ideal states. | Correct classroom/playground background and character assets appear. |
| UI-02 | P1 | Check every action card. | Image and label match the action; no unintended fallback globe appears. |
| UI-03 | P1 | Check speech bubbles with one and two characters. | Bubble does not cover the speaker, action slot, or essential expression. |
| UI-04 | P1 | Check 3-grid and 4-grid chapters on all test devices. | Grids remain readable in landscape and do not overlap the tray or device safe areas. |
| UI-05 | P1 | Pick up, drop, remove, fail, and complete actions with sound enabled. | Correct sound plays once for each event; no stacked or delayed duplicate sound occurs. |
| UI-06 | P1 | Repeat interactions in silent mode. | App remains fully usable without sound. |
| UI-07 | P1 | Test physical-device haptics. | Haptics support the action without excessive repeated vibration. |
| UI-08 | P0 | Open completion overlay. | Earned stars, placement count, completion summary, tip, replay, and back controls are correct. |
| UI-09 | P0 | Open red overlay. | Red face, character-specific break text, Try Again, and Back controls are visible and usable. |
| UI-10 | P1 | Enable VoiceOver and navigate gameplay controls. | Back, actions, drop targets, face state, result stars, Try Again, and Back to Chapters have meaningful labels. |
| UI-11 | P1 | Enable larger text where supported. | Essential text remains readable and controls remain reachable. |
| UI-12 | P1 | Check color accessibility. | State is understandable from face expression and accessibility text, not color alone. |

### J. Performance and Reliability

| ID | Priority | Steps | Expected Result |
| --- | --- | --- | --- |
| PERF-01 | P0 | Open Story 2 Chapter 3 on a physical device. | The 3,125-outcome JSON loads without a visible freeze, crash, or memory warning. |
| PERF-02 | P0 | Replace actions repeatedly in Story 2 Chapter 3. | Outcome lookup and scene redraw remain responsive. |
| PERF-03 | P1 | Move between all six chapters repeatedly. | Memory use remains stable and old chapter state does not leak into the next chapter. |
| PERF-04 | P1 | Background and foreground the app during gameplay. | Active chapter remains consistent and drag UI does not freeze. |
| PERF-05 | P0 | Force-quit during a partial dual-slot run, red state, and completed state. | Relaunch restores the correct persisted state in every case. |
| PERF-06 | P1 | Play for at least 20 minutes with many replacements. | No crash, input slowdown, audio buildup, or corrupted progress appears. |

## 9. Canonical Chapter Acceptance Paths

Each path below must end with `category: success` and `isIdeal: true`.

| Chapter | Ideal Placements | Expected Final Result |
| --- | --- | --- |
| Story 1 Chapter 1 — Let’s Draw! | Approach → Crayon | Rhodey is drawing. |
| Story 1 Chapter 2 — Too Loud to Draw | Attention Reset → Ask to Be Quiet → Crayon | Jojo and Rhodey can draw calmly. |
| Story 1 Chapter 3 — My Drawing Tore | Approach → Ask → Paper | Rhodey is ready to try again with new paper. |
| Story 2 Chapter 1 — That Hurt My Feelings | Approach → Ask | Jojo feels safe and heard. |
| Story 2 Chapter 2 — The Slide Is Mine | Ask → Approach → Apologize | Jojo and Rhodey reconcile with the combined handshake pose. |
| Story 2 Chapter 3 — Jojo Pushed Me! | Grid 1: Ask Jojo + Approach Rhodey; Grid 2: Approach Jojo + Ask Rhodey; Grid 3: Give Bandage | The accident is understood and Rhodey is recovered with a bandage. |

## 10. Exploratory Testing Charters

Run at least one 15-minute exploratory session for each charter:

1. **Play like a curious child:** repeat actions, change earlier answers, drag quickly, and intentionally choose silly combinations.
2. **Play without reading instructions:** observe whether art and feedback alone explain what changed.
3. **Look for accidental answer hints:** determine whether hints, colors, expressions, or button states reveal the ideal path too early.
4. **Stress the final chapter:** test partial dual slots, reverse drag order, repeated actions, removals, relaunches, and near-limit success.
5. **Parenting-message review:** confirm unsuccessful reactions teach consequences without blaming or shaming the child/player.
6. **Localization review:** ask a fluent Indonesian speaker to identify unnatural, unclear, or overly formal wording.

## 11. Test Execution Order

### Cycle 1 — Developer Smoke Test

- Run automated story validation.
- Run Swift progress and engine checks.
- Build for iOS Simulator.
- Execute all P0 launch, ideal-path, placement, star, red-state, and save tests.

### Cycle 2 — Team Functional Test

- Execute every P0 and P1 test on at least one iPhone.
- Execute chapter-specific ideal and non-ideal paths.
- Execute the full Story 2 Chapter 3 dual-slot suite.
- Record defects with build, device, reproduction steps, and evidence.

### Cycle 3 — TestFlight Usability Test

- Give testers only the chapter context and subtle hint, not the ideal answer.
- Observe whether they understand drag targets and colored face states.
- Ask what they believed each child needed.
- Record completion rate, stars, confusing actions, confusing expressions, and where testers stopped.

### Cycle 4 — Release Regression

- Re-run every failed P0/P1 case after fixes.
- Re-run the P0 smoke suite across all six chapters.
- Verify clean install and upgrade behavior.
- Confirm no placeholder or debug content appears in the TestFlight build.

## 12. TestFlight Questions for Testers

After play, ask:

- Was it clear where each action should be dropped?
- Did you understand why the child’s expression changed?
- What did green, yellow, orange, and red mean to you?
- Did the colored face make you feel rushed, guided, or punished?
- Did you understand why your successful sequence worked?
- Was any action name or illustration confusing?
- Did any speech bubble or expression reveal the answer too directly?
- Did the chapter resume where you left it?
- Were stars understandable after completion?
- Did you notice any lag, accidental drop, missing image, wrong sound, or clipped text?
- Which chapter felt too easy, too difficult, or unfair?

## 13. Defect Report Template

```text
Title:
Build number:
Device and iOS version:
App language:
Story and chapter:
Starting save state: clean / unfinished / completed replay / red
Actions and target slots used:
Placement count and face color:
Steps to reproduce:
Expected result:
Actual result:
Frequency: always / sometimes / once
Priority: P0 / P1 / P2
Screenshot or screen recording:
Additional notes:
```

## 14. Exit Criteria

The build is ready for wider TestFlight testing when:

- All P0 tests pass.
- No open crash, data-loss, impossible-completion, incorrect-star, or incorrect-red-state defect remains.
- All six ideal paths pass on a physical iPhone.
- Story 2 Chapter 3 dual-slot, performance, and relaunch tests pass.
- English and Indonesian critical content is present and readable.
- Save, resume, replay, best-star, Try Again, and app-update behavior pass.
- Remaining P1/P2 defects are documented and accepted by the team.

The build is ready for release consideration when the final regression passes and TestFlight feedback reveals no repeated blocker or major misunderstanding.

## 15. Execution Record

| Build | Tester | Device / iOS | Date | Tests Run | Passed | Failed | Blocked | Decision |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | --- |
|  |  |  |  |  |  |  |  |  |

