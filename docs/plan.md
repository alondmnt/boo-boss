# boo boss - MVP plan

## context

a father and child brainstormed a haunted house management game. you run a spooky house attraction. visitors walk through your house. you deploy scare characters to rooms to frighten them. visitors have fears and loves - if they love your scare character, they hug it with hearts above their head and it disappears. the goal is to scare as many visitors as possible. when they exit, they're excited and happy about the experience.

this game is technologically similar to car-doctor (vanilla JS, inline SVG, CSS animations, Web Audio, localStorage, no build step) but the gameplay is fundamentally different: real-time strategic (multiple visitors simultaneously) vs car-doctor's sequential repair loop.

the child's key ideas:
- the spooky house concept itself
- a witch can grab your hat (specific action, inspired by a childhood haunted house visit)
- hearts above head when someone loves a character and hugs it

## visual layout - side-view cutaway

the house SVG is drawn at its full eventual size (2 rooms × 3 floors) from the start. locked floors are dark with planks across doorways. no zooming, no scrolling - everything visible at once.

**the train track** snakes through all unlocked rooms like a dark ride / rollercoaster. visitors ride in carts through the house and can disembark at any room. when a new room unlocks, the track extends to include it - rails appear, connecting to the existing route. the track is a visible SVG path (thin rails with crossties) winding through the house.

```
┌─────────────────────────────────────────────────────┐
│ [Score: 1250]              [Wave 3]    [🔊] [↻]    │  top bar
├─────────────────────────────────────────────────────┤
│                                                     │
│           ┌─────────┬─────────┐                     │
│     F3    │ ░░░░░░░ │ ░░░░░░░ │  (locked, no track) │
│           │ ░░░░░░░ │ ░░░░░░░ │                     │
│           ├────╌╌╌──┼─────────┤                     │
│     F2    │ Bedroom ╎ ░Attic░ │  (attic locked)      │
│           │ ══╗  ╔══╎ ░░░░░░░ │                     │
│           ├──║──║───┼─────────┤                     │
│     F1    │Entrance │ Kitchen │                     │
│  🚂══════│══╝  ╚═══│════╗    │                     │
│  in       │         │   ║    │══════🚂 out          │
│           └─────────┴───║────┘                     │
│                         ╚═══                        │
│        ← victorian house cutaway (inline SVG) →     │
│           (track winds through unlocked rooms)      │
│                                                     │
├─────────────────────────────────────────────────────┤
│ [👻][🕷️][💀][🧙]                                   │  scare panel
│  ready  12s  ready  ready                           │  (cooldown timers)
├─────────────────────────────────────────────────────┤
│ 🏰 12/20 coins ████████░░░░                         │  progress bar
└─────────────────────────────────────────────────────┘
```

- **main view**: 2×3 Victorian house cutaway. MVP shows floor 1 (2 rooms) + floor 2 (1 room open, 1 locked). floor 3 fully locked. the full structure is always visible so unlocking feels like opening up the house.
- **the train**: a small dark-ride cart carries visitors along the track through all unlocked rooms. visitors are visible in the cart with their thought bubbles - **this is the player's planning moment** (read fears/loves while they ride through). visitors hop off at different rooms along the route, distributing themselves across the house.
- **exit**: after exploring, visitors walk to the nearest track stop and hop back on a cart to ride out. they look excited, chatting. when all visitors from the wave have exited, the wave ends.
- **track growth**: unlocking a room extends the track. new rail sections appear with a building animation (track lays itself). the cart route gets longer, more drop-off points, visitors spread across more rooms.
- **inside the house**: once off the train, visitors walk freely between adjacent rooms on the same floor, or use the staircase to change floors. they wander, linger, sometimes backtrack.
- **scare panel**: row of character buttons at the bottom. greyed out with radial timer when on cooldown.
- **progress bar**: coins toward next unlock (car-doctor pattern).

## core game loop

### wave-based real-time

1. **train ride**: cart enters from the left carrying N visitors (3 in wave 1, ramping to ~8). it winds through all unlocked rooms along the track. visitors are visible with their thought bubbles - **this is the player's planning moment** (read fears/loves, decide strategy while the cart moves through the house).
2. **visitors disembark**: as the cart passes through each room, some visitors hop off. distribution is random/weighted so they spread across the house. each visitor disembarks at a different room.
3. **visitor movement**: once off the cart, visitors walk freely between adjacent rooms. each visitor picks a random adjacent room to move to, dwells 2-3 seconds, then moves on. they can backtrack and revisit rooms. movement is CSS transitions. after visiting ~4-6 rooms total, they head to the nearest track stop to ride out.
4. **player deploys scare**: tap character in panel -> tap room in house -> character materialises.
5. **scare evaluation** when a visitor enters a room with a deployed character:
   - **feared**: scare succeeds. visitor jumps, arms up, wide eyes. +10 points (with combo multiplier for consecutive scares on same visitor). character plays scare animation.
   - **loved**: visitor runs to character, hugs it, hearts float above head. character disappears (neutralised). 0 points.
   - **neutral**: visitor walks through unimpressed. 0 points.
6. **character lifetime**: stays in room until cooldown expires (~15s) or neutralised by hug. then dematerialises. character slot in panel becomes available again after cooldown.
7. **visitor exits**: after enough room visits, visitor walks to nearest track stop, hops on a cart, rides out. excited chatter animation based on total scare count.
8. **wave ends**: when all visitors have boarded the exit train. train pulls away to the right. score summary, coin award, unlock check.
9. **next wave**: new entry train arrives. after wave 10, show final score.

### scoring

- scare: +10 base, x1.5 for 2nd scare on same visitor, x2 for 3rd+
- wave bonus: +50 if you scared 80%+ of visitors
- no-hug bonus: +30 if you deployed at all and no visitor got hugged
- variety: full cast on an axis awards +20% of wave scare score (and +1 coin). three axes — creatures (gate: roster ≥ 5), monster types (gate: monster lab), actions (gate: director's chair) — so up to +60% at all three. all-or-nothing per axis; partial cast scores nothing. remains subordinate to scares by design (multiplicative on scaring, not additive): a bad-scoring wave can't out-variety its way to a high score.
- coins: 1 coin per wave + 1 for wave bonus + 1 per currently-active variety axis that reaches full cast in the wave (independent across axes)

## MVP entities

### the 4 axes of scare-building

scares are built by combining 4 independent axes. the MVP starts with axis 1 + axis 4 (creature + room), and the other axes unlock progressively.

#### axis 1: creature (the base body)

the physical animal/thing. defines the silhouette and body plan of the SVG. each creature is a detailed, expressive inline SVG - these are the heroes of the game.

**MVP creatures** (4 at start, more unlock):

**spider**
- **body**: round black body with 8 articulated legs (4 per side, bent at joints). cluster of 4-6 shiny eyes. hangs from silk thread. fuzzy hair lines on body edge.
- **idle**: legs twitch. body sways on thread.
- **scare pose**: drops rapidly down thread, legs spread wide, eyes glint.
- **hug pose**: legs curl inward, body goes soft/round. visitor scoops it up.

**gorilla**
- **body**: massive broad shoulders, long arms reaching ground, compact legs. expressive brow ridge, deep-set eyes. dark fur texture (short stroke lines).
- **idle**: knuckle-standing, breathing (chest rises/falls). occasional chest pat.
- **scare pose**: stands upright, arms wide, mouth open roaring. chest pound.
- **hug pose**: sits down, opens arms gently. visitor disappears into bear hug.

**bat**
- **body**: small furry body, large membranous wings (veined), pointed ears, tiny fangs. beady eyes.
- **idle**: wings folded, hanging upside-down from ceiling. ears twitch.
- **scare pose**: wings snap open wide, swoops downward. eyes flash.
- **hug pose**: wraps wings around itself like a blanket. visitor pets it.

**cat**
- **body**: sleek arched body, long tail, pointed ears. green/yellow slit eyes. whiskers.
- **idle**: sitting, tail slowly swishing. eyes tracking.
- **scare pose**: back arches high, fur stands on end (spiky outline), hiss mouth. tail poofs.
- **hug pose**: rolls onto back, purring pose. visitor scratches belly.

**unlockable creatures** (examples for expansions):
- **owl**: round body, huge eyes, feathered tufts, rotating head
- **snake**: long winding body, forked tongue, hood (cobra-style)
- **rat**: pointed snout, long tail, hunched body, twitchy whiskers
- **crow**: angular wings, sharp beak, ruffled feathers

#### axis 2: monster type (the overlay/costume)

visual features layered on top of the creature's base body. changes colour palette, adds costume elements, modifies the face. the SVG factory composites creature body + monster type features.

**MVP monster types** (3 at start, more unlock):

- **zombie**: green-grey skin tint. torn/ragged edges on body. one eye drooping or X-ed out. shambling posture shift. exposed bones/stitches.
- **witch**: pointed hat (scales to creature size). cape/cloak draped over body. green face tint. wart on nose. wild hair tufts under hat.
- **skeleton**: bone-white colour. body rendered as skeletal version of the creature shape. hollow eye sockets with pinpoint pupils. visible ribs/joints.

**unlockable monster types**:
- **vampire**: high collar cape (red lining), slicked hair, fangs, pale skin, red eyes
- **werewolf**: extra fur (shaggier outline), torn clothing scraps, elongated snout, yellow eyes
- **ghost**: translucent (CSS opacity), trailing wisps, blue-white glow, floating posture
- **mummy**: bandage wraps across body, one eye peeking through, trailing loose bandage
- **clown**: red nose, face paint, ruffled collar, oversized shoes (scaled to creature)

so a "zombie spider" has the spider body plan but green-tinted, with torn web, droopy eyes. a "witch gorilla" has the gorilla body but wearing a tiny pointed hat, cape, green face. a "skeleton bat" is a bat rendered as bones with membranous wing outlines.

#### axis 3: action (how they scare)

the scare behaviour performed when a visitor enters the room. each action is a **scripted mini-scene** — a short choreography with setup, pause, and payoff — that REPLACES the default scare flow for that encounter. not a decorative overlay on top of the generic scare pose, but the scare itself. the gag/timing is the mechanic.

**MVP actions** (3 at start, more unlock):

- **jump out**: creature primes itself — slow fade with embarrassed face (eyes pointing up/side) → pause → fast reappearing snap. timing is the gag.
- **grab hat**: creature wields a hook-on-stick that extends toward the visitor, snatches their headwear prop at peak reach, then retracts. the child's signature idea. universal tool — no per-creature limb work — and because every visitor wears something in the `.visitor__hat` group (see visitor section), it always lands regardless of which prop they got.
- **drop from ceiling**: creature descends from above with weight (spider on thread, bat swooping, cat leaping down). lands in front of the visitor.

**unlockable actions** (each also a scripted mini-scene):
- **creep up**: creature sneaks up from behind visitor (slow horizontal slide, growing larger), then tap-on-shoulder.
- **chase**: creature rushes across the room toward visitor (fast horizontal dash).
- **cackle/howl**: creature throws head back, concentric sound-wave arcs radiate outward. sound-focused scare.
- **peek-a-boo**: creature pops in and out of furniture (wardrobe, trunk, cauldron) a few times before the final reveal.
- **swarm**: creature multiplies briefly (3-4 copies appear then merge back).

each action is a per-action choreography function in actions.js orchestrating pose changes, opacity, particles, prop changes, audio. reactions.scared delegates to the action when one is selected.

#### axis 4: room (where to deploy)

(described in rooms section below)

#### how the axes combine

the SVG factory takes `(creature, monsterType, action)` and composites them:
1. **creature** determines the base SVG body paths and proportions
2. **monster type** applies colour transforms, adds costume SVG elements (hat, cape, bandages), modifies facial features
3. **action** determines which `@keyframes` animation plays on scare trigger

visitor fears and loves are keyed to **creature type** (people are scared of spiders, not of "zombie spiders" specifically). monster type and action affect **scare effectiveness** (multipliers) but don't change the fear/love match.

### rooms (3 open at start, 6 total across expansions)

2 rooms × 3 floors Victorian house. the full structure is drawn from the start; locked rooms are dark with boarded doorways. the train track winds through all unlocked rooms - when a room unlocks, new track sections connect it to the route.

**floor 1** (ground) - both open at start:
1. **entrance hall** - grand Victorian foyer, wooden panels, chandelier with cobwebs, tiled floor. track enters from outside here. (warm brown)
2. **kitchen** - cast-iron stove, hanging copper pots, dripping tap, stone floor. track exits to outside here. (grey/metal)

**floor 2** (upper) - bedroom open at start, bathroom locked:
3. **bedroom** - four-poster bed with dusty canopy, wardrobe (slightly ajar), ornate mirror. (purple/dark blue)
4. **bathroom** *(locked, unlocks at 10 coins)* - clawfoot tub, cracked mirror, dripping pipes. (teal/grey)

**floor 3** (top) - fully locked at start:
5. **attic** *(locked, unlocks at 30 coins)* - exposed beams, old trunks, dormer window with moonlight, dust motes. (dark grey/silver)
6. **tower** *(locked, unlocks at 40 coins)* - stone walls, narrow window with lightning flashes, bats. (dark stone grey)

**track route**: the dark ride always runs the full 6-room loop (entrance → kitchen → bedroom → bathroom → attic → tower → back down → exit). locked rooms are still on the track; the train passes through them without stopping until they unlock.

visitors move between adjacent rooms on foot (same floor) or ride the track between floors. 1 deployed character per room at a time (MVP constraint).

### visitors (sketched, minimal)

visitors are intentionally simple - stick-figure-level SVG outlines so the scare characters remain the visual focus.

- simple side-view silhouettes (~40px tall). circle head with a randomly picked hair style and a randomly picked headwear prop (top hat, cap, flower, bow, beanie) drawn inside the `.visitor__hat` group so grabHat always has a target. rectangle body, two line-legs. randomisation across hair, prop shape, prop colour, and skin tone gives crowds visible variety without stealing focus from the scare characters. prop mix is gender-balanced so no cohort skews loudly one way.
- **thought bubbles** are the key visual element: fear icon in a red jagged bubble, love icon in a pink heart bubble. these are what the player reads to make decisions.
- **states** (CSS class swaps, no complex animation):
  - `walking`: legs alternate (basic 2-frame walk cycle)
  - `scared`: jump up, arms raised (single pose, held briefly)
  - `hugging`: lean toward character, hearts float up
  - `exiting`: bouncy walk, small smile line on face
- 1 fear + 1 love drawn from the **creature** pool (spider, gorilla, bat, cat). fears/loves are about the creature, not the monster type - someone afraid of spiders is afraid of all spiders regardless of costume.

## module architecture

maps directly to car-doctor's IIFE module pattern. each file is a `<script>` loaded in order.

| file | module | responsibility | car-doctor equivalent |
|------|--------|---------------|----------------------|
| `config.js` | `CONFIG` + `UNLOCK_TIERS` | frozen game settings, creature/monster/action rosters, room defs, wave progression | `config.js` |
| `game-state.js` | `GameState` | runtime overlay on CONFIG, tracks unlocked creatures/monsters/actions/rooms | `game-state.js` |
| `progress.js` | `Progress` | localStorage persistence, coin tracking, unlock detection, fanfare | `progress.js` |
| `audio.js` | `Audio` | Web Audio synthesis, sound catalogue | `audio.js` |
| `house.js` | `House` | house cutaway SVG generation, room positions, train track path | replaces vehicle SVG modules |
| `train.js` | `Train` | train cart animation along track, visitor loading/unloading | new |
| `visitor.js` | `Visitor` | lightweight visitor sketches, movement, thought bubbles. minimal SVG. | new |
| `creatures.js` | `Creatures` | **hero module** - detailed SVG body factories for each creature (spider, gorilla, bat, cat). base body, idle pose, scare pose, hug pose. | new (largest module) |
| `monster-types.js` | `MonsterTypes` | SVG overlay factories for each monster type (zombie, witch, skeleton). colour transforms, costume elements, face mods. composited onto creature bodies. | new |
| `actions.js` | `Actions` | scare action definitions. `@keyframes` triggers for jump-out, grab-hat, drop-from-ceiling. mapped to creature+monster combos. | new |
| `scare-factory.js` | `ScareFactory` | composites creature + monster type + action into a deployed scare SVG. `ScareFactory.create(creature, monsterType, action, room)`. the assembly module. | replaces `fault-registry.js` |
| `reactions.js` | `Reactions` | visitor + character animation helpers (CSS class toggles) | `reactions.js` |
| `particles.js` | `Particles` | spooky burst, floating hearts, confetti | `sparks.js` |
| `picker.js` | `Picker` | multi-stage pick UI: creature panel -> (monster type panel) -> (action panel) -> room tap. stages unlock progressively. | `picker.js` |
| `wave.js` | `Wave` | wave state machine, visitor spawning via train, wave completion | new |
| `game.js` | `Game` | top-level state machine, generation counter, coordinates all modules | `game.js` |

**script load order**: config -> game-state -> progress -> audio -> house -> train -> visitor -> creatures -> monster-types -> actions -> scare-factory -> reactions -> particles -> picker -> wave -> game

### key reused patterns

- **CONFIG (frozen) + GameState (runtime overlay)**: identical to car-doctor
- **UNLOCK_TIERS array with TIER_ACTIONS**: identical
- **generation counter**: stale callback cancellation on reset
- **Picker 2-stage flow**: select from panel, then interact with main view
- **Reactions via CSS class toggle**: add class -> animation plays -> remove after timeout
- **Progress with localStorage**: `hauntedHouse_progress` key
- **Web Audio synthesis**: oscillators + filtered noise, no audio files
- **Inline SVG generation**: JS factories return SVG group elements

## MVP unlock tiers

| coins | key | what unlocks | axis |
|-------|-----|-------------|------|
| 5 | `dinosaur` | dinosaur creature (T-rex, child request) | creature |
| 10 | `bathroom` | bathroom room opens (floor 2 complete) | room |
| 18 | `owl` | owl creature | creature |
| 25 | `fasterCooldowns` | all cooldowns reduced by 25% | upgrade |
| 30 | `attic` | attic room opens | room |
| 35 | `snake` | snake creature | creature |
| 38 | `rat` | rat creature | creature |
| 40 | `tower` | tower room opens (floor 3) | room |
| 50 | `monsterLab` | monster type selection + effects (3-pick flow) | axis 2 |
| 65 | `vampire` | vampire monster type (50% hug resist + scare) | monster |
| 75 | `astronaut` | astronaut monster type (combo +1) | monster |
| 85 | `ghost` | ghost monster type (80% hug block, pure defense) | monster |

interleaves creatures with rooms and upgrades so each unlock type feels fresh. each tier uses the same fanfare overlay + showcase pattern as car-doctor.

## expansion roadmap (outline)

### expansion 1: "the monster lab" (~coins 55-85) [IMPLEMENTED]
**unlocks axis 2: monster types.** deployment becomes 3-pick: creature -> monster type -> room.
- at 55 coins, monster lab unlocks: picker gains a sub-panel for monster type selection
- zombie, witch, skeleton available from the start (base types)
- vampire (65 coins): high collar cape, fangs, dark tint
- astronaut (75 coins): helmet visor, suit collar, oxygen tube (child request)
- ghost (85 coins): translucent, trailing wisps, floating hover animation
- each monster type modifies the creature SVG with costume elements + CSS filters
- creature+monster combo bonuses: matching pairs (e.g., bat:skeleton, cat:witch) grant 1.25x scare points, shown via floating "COMBO" indicator
- tower room already unlocks at 40 coins (MVP tier)

### expansion 2: "the director's chair" (~coins 95+) [IMPLEMENTED]
**unlocks axis 3: actions.** deployment becomes 4-pick: creature -> monster type -> action -> room.

design intent: actions are **scripted mini-scenes** — each replaces the default scare animation with a distinctive choreography (setup → pause → payoff). the gag/timing is the mechanic; players pick an action for its *style* of scare. a decorative-transform-on-top approach was tried and rejected — it felt invisible against the dominant scare-pose change.

the child's hat-grab works on any creature (spider leg reaches out, gorilla arm, bat wing, etc.).

**on hold — remaining actions (creep, cackle/howl)**: the shipped unlockable actions plus the three rewritten base actions already make the axis feel rich. more can land later if the content ladder needs extending.

triple combos (creature + monster + action) deliberately skipped: variety bonus already rewards diverse play.

### expansion 3: "the rollercoaster" (~coins 140+) [NEXT]

**reframes the game into two halves: design the ride (between waves, builder mode) + operate the ride (during wave, existing scare game).** not a side-game or bonus level — the dark ride is already the front-of-house moment, so putting the player in charge of its shape binds the two halves tighter. you're now the ride designer as well as the scare operator.

#### design principle: visible drama over subtle effects

the first instinct was to make track shapes modify scare effectiveness ("disoriented mid-loop", "exhilarated on drops"). cut. kids don't parse subtle multipliers, and invisible mechanics die in playtesting. pieces are **purely cosmetic in their effect on the scare loop** — loops add dramatic pauses, tunnels plunge the cart into darkness, corkscrews spiral. the spectacle is the point; no hidden math on scare effectiveness. the ongoing pull back into builder mode comes from **piece malfunctions** (see below), not from mechanical piece effects.

#### room skipping — the one real tactical lever

each room has an "on the ride / closed tonight" toggle in the editor. closing a room:
- **skips it on the track** (no disembark there)
- **blocks foot traffic into it** (visibly closed, not passively ignored)
- **is visually distinct from a locked room** — velvet rope or "closed" banner, not boarded planks — so kids don't confuse "can't unlock yet" with "chose to close"

**why kids will feel this**:
- **concentration play**: skip 4 rooms, funnel all visitors through 2. your 2-3 characters hit way more visitors per cooldown; combos (x1.5, x2) stack harder
- **scoring surface cost**: fewer rooms = fewer total scare opportunities. natural counterweight to the combo gain
- **biased-sampling amplifier**: everyone in 2 rooms means one bad pick gets hugged by all. concentration is high-variance — felt immediately
- **beginner aid**: 6 rooms is too many to guard early on. "close some" is a kid-understandable retreat

constraints: **min 2 rooms open** (entry-side + exit-side). engine refuses to start a wave otherwise. locked rooms can't be toggled. skipping is **free** — routing, not buying. closed rooms can host showy pieces (a closed kitchen becomes a corkscrew-only spectacle room) without wasting scare potential.

#### track pieces

each segment between two rooms is a customisable slot, typed by context (horizontal F1, floor-change F1→F2, return-exterior). the editor only offers pieces that fit the slot — **invalid states are impossible by construction**, no runtime auto-bridging needed.

| piece | visible animation | coin cost |
|-------|-------------------|-----------|
| straight | baseline, short ride | 2 |
| hill | slow climb, fast drop with shake | 5 |
| tunnel | cart vanishes into darkness for ~1s | 5 |
| loop | cart pauses upside-down at the top for a beat | 12 |
| corkscrew | cart spirals along the segment | 15 |

each piece is a scripted SVG/CSS mini-choreography — same shape as actions (setup → payoff). **sell-back at 50%** so experimentation isn't punished.

#### train skins — cosmetic only

3-4 cart skins: wooden mine cart, coffin-cart, pumpkin carriage, ghost-train skull engine. purely visual. considered cart capacity as a non-cosmetic lever but dropped — capacity ripples into spawn/biased-sampling/wave-end logic, adds risk without kid-visible payoff. 20 coins per skin.

#### the editor (UX)

**opt-in, not mandatory.** the wave summary page gains a "build" button alongside "next wave" — tap to enter builder mode, or skip straight through if you don't want to fiddle. no tax on players who just want to keep scaring.

builder mode is a full-screen overlay on the house cutaway. track segments and rooms become tap targets. **click-segment → popup** shows pieces that fit the slot with costs → confirm. click-room → closed/open toggle. click-cart → skin picker. exit returns to the summary. modifications are **permanent across waves** (persists in `hauntedHouse_progress`) but **only editable between waves** — same rule as everything else in the game.

#### interaction + visibility (pre-existing fixes surfaced by this expansion)

track pieces will occupy more of the room area (loops and corkscrews especially), so two assumptions that already pinch lightly now have to be fixed properly:

- **click-through on the track**: currently `.train__rail` and `.train__cart` have no `pointer-events: none` (compare `.visitor`, which does) — so rails silently block monster deploys on any cell the track crosses. fix: `pointer-events: none` on the track layer and rails. the cart stays non-interactive during play; in builder mode the skin picker can be reached via a dedicated cart-edit button rather than a direct cart click, keeping the play-mode click budget clean.
- **no obstruction of deploy targets**: track routing must stay clear of the room's central deploy area. piece path generators should bias toward room edges (top or bottom gutter) rather than cutting through centres, and z-order keeps characters/visitors above rails. for pieces that *are* intrinsically central (corkscrew in a spectacle room), the room is already closed — no deploy target to obstruct.

both are cheap: one CSS change plus discipline in the path generators. worth shipping the click-through fix ahead of the editor rollout so current play benefits too.

#### piece malfunctions — the replay hook

pieces are cosmetic, so the editor needs an intrinsic reason to keep revisiting. that's maintenance. installed pieces occasionally break and the kid, running the attraction, wants to fix them.

- **trigger**: each wave, ~20% chance that one installed piece malfunctions. weighted by showiness (corkscrew > loop > tunnel/hill > straight), both for theme (fancier machinery breaks more) and to soften the cost of ambitious builds rather than punishing them
- **visible cue**: broken piece animates sparks/smoke during the ride and shows a small crack overlay on the static track. persists across waves until fixed
- **fix flow**: in builder mode, broken pieces are flagged with a hammer icon. tap → 2-3 coin repair cost → restored. no cascading failures, no timers
- **no neglect penalty**: broken pieces still function. motivation is aesthetic ("my ride looks bad"), not mechanical. keeps the loop positive — kids choose to fix because they want to, not because they're being taxed
- feeds the attraction-manager fantasy without adding picker complexity or real-time input during waves

#### unlock ladder

staged sub-unlocks spread the sub-game across ~60 coins:

| coins | unlock |
|-------|--------|
| 140 | track editor + room skipping + segment reorder + straight pieces |
| 160 | hill, tunnel (floor-transition slots also open up here) |
| 180 | loop, corkscrew |
| 200 | train skins (3-4 cosmetic carts) |

each tier triggers a fanfare + showcase, same pattern as every other unlock. lands right after the last action unlock (chase @ 130), extending the ladder with a new category rather than interleaving.

#### module additions

builds on the data-driven track already in place: `train.js::_computeTrack` reads `GameState.getTrackRoute()` and generates the SVG path procedurally, so new pieces become new path-generator functions keyed by piece type. needed:

- **new**: `track-editor.js` — between-wave editor UI, segment hit-testing, piece/skin/skip popups
- **extend** `config.js`: piece defs (cost, slot compatibility, path generator reference), train skin defs
- **extend** `game-state.js`: per-segment piece *override* (null = keep existing procedural generator; the default track isn't "all straight", it's the current curves with centre-divider floor transitions and corkscrew return — override only kicks in when the player places a piece), per-room skip state, current train skin, per-piece malfunction flags
- **extend** `progress.js`: persist the above in `hauntedHouse_progress`; existing saves load with all fields null/empty (zero migration — default state = current behaviour)
- **extend** `train.js`: switch `_computeTrack` from fixed generator to per-segment dispatch when an override exists, falling back to the current curve logic when it doesn't; swap cart SVG on skin change; honour skip state when computing stops; render malfunction sparks on broken pieces
- **extend** `wave.js`: roll the per-wave malfunction check at wave end, apply to a weighted-random installed piece

### expansion 4: "house upgrades" [ON HOLD]
on hold: the game already has enough layers (creatures + monster types + actions + rooms, plus variety and full-cast coins). revisit only if later versions need new progression hooks.

persistent upgrades, bought with coins, persist between waves.

**room themes** (decorations): theme a room to match a **creature** type. changes the room's visual style and gives a scare bonus (+50% scare points) for the matching creature deployed there. examples:
- spider theme: cobwebs fill corners, egg sacs on ceiling, silk strands across doorway
- gorilla theme: jungle vines, banana peels, claw marks on walls
- bat theme: cave stalactites in corners, guano stains, ultrasound wave patterns on walls
- cat theme: scratched furniture, yarn balls, glowing eyes in dark corners

**room traps**: trap doors, fog machines, strobe lights, creaky floor triggers. independent scare effects that amplify deployed characters.

strategic layer: do you theme rooms to match the creatures you deploy most, or spread themes for flexibility? themes interact with creature/monster/action combos from earlier expansions.

### progressive complexity path

```
MVP (0-50):            [creature] + [room]                                  = 2 picks
expansion 1 (55-85):   [creature] + [monster type] + [room]                = 3 picks [DONE]
expansion 2 (95+):     [creature] + [monster type] + [action] + [room]     = 4 picks [DONE]
expansion 3 (140+):    4 picks + [ride design] (between-wave editor)         [NEXT]
expansion 4:           4 picks + [room themes & traps] (persistent layer)    [ON HOLD]
```

## difficulty scaling [NEXT]

### current state

with all rooms open, higher waves, and the full creature × monster type × action matrix available, the game is already quite hard. the bottleneck isn't scare mechanics — it's **cognitive load and input cost**: reading fears/loves across many visitors spread over 6 rooms, then 4-stage picking (creature → monster → action → room) per deploy. the two halves should be treated separately: **reading** (scan fears/loves across many visitors) is the intended difficulty and we want it to stay; **picking** (stage count per deploy) is input friction and worth trimming. sticky last-used picks (shipped) collapse repeat deploys to creature-tap → room-tap. autopilot pressure is split by axis: biased sampling pushes creature cycling, and the full-cast variety multiplier (shipped) pushes monster/action cycling in the high-score chase. further picking fixes (faster pickers, grouped deploys) remain open if cognitive load still dominates.

**considered and deferred — room-match highlight**: once a creature is picked, glow rooms containing a visitor who fears it and dim those who love it. cuts reading load directly. deferred because it removes the reading puzzle that *is* the intended difficulty; revisit if input-side fixes under-correct.

### implemented

- **visitor count**: `3 + floor(wave × 0.5)` visitors per wave. linear scaling.
- **biased sampling** (wave 5+): visitors tend to love what others fear, creating deploy dilemmas. probability ramps from 0.3 at wave 5 to cap 0.9. the primary strategic tension mechanic.
- **per-creature cooldowns**: bat 12s, cat 14s, spider 15s, snake 16s, dinosaur 17s, gorilla 18s. creates tactical choices about deployment order.
- **faster cooldowns unlock** (25 coins): 25% reduction to all cooldowns. early relief for cooldown friction.
- **monster type effects** (50 coins, monster lab): zombie +20% points, witch +25% lifetime, skeleton -20% lifetime (faster recharge), vampire 50% hug resist (+ scare on resist), astronaut combo +1, ghost 80% hug block (pure defense, no scare). creates deployment strategy around monster type choice.

### planned (not yet implemented)

- **shorter visits at high waves**: reduce `visitorRoomVisits` from 4-6 to 3-4 past wave 12. less time per visitor to scare them. tightens the window without speeding anything up.
- **faster visitor movement**: visitors walk 10-20% faster per 5 waves. subtle, compresses decision time.
- **creature lifetime decay**: creatures expire faster at higher waves (e.g., -0.5s per 5 waves). forces more active deployment cycling.
- **wave modifiers** (one per wave, randomly chosen at higher waves):
  - "herd": all visitors share the same fear
  - "fickle": visitors swap fear/love mid-wave after 2 room visits
  - "rush": visitors dwell 50% less between rooms
  - "brave": visitors need to be scared twice to count
  - "dark": fear/love bubbles hidden for the first 3 seconds
- **group dynamics**: when a visitor gets scared, adjacent visitors who share the same fear flinch (+5 points). rewards spatial planning.

