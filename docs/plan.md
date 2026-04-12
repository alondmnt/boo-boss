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
- coins: 1 coin per wave completed + 1 bonus coin for wave bonus threshold

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

the scare behaviour performed when a visitor enters the room. each action is a short animation sequence triggered on the combined creature+monster SVG.

**MVP actions** (3 at start, more unlock):

- **jump out**: character hidden (opacity 0 or behind furniture), snaps to full visibility with scale bounce. universal, works for any creature.
- **grab hat**: character reaches toward visitor (the child's idea). a hand/leg/wing extends. visitor's hat/accessory lifts off briefly. works best with limbed creatures.
- **drop from ceiling**: character descends from above (like spider on thread, bat swooping, cat leaping down). vertical translation animation.

**unlockable actions**:
- **creep up**: slow approach from behind (horizontal slide, growing larger)
- **chase**: character rushes across room toward visitor (fast horizontal movement)
- **cackle/howl**: character stays still but emits visible sound waves (concentric arcs radiating from mouth). sound-focused scare.
- **peek-a-boo**: character pops in and out of furniture (wardrobe, trunk, cauldron)
- **swarm**: character multiplies briefly (3-4 copies appear then merge back)

#### axis 4: room (where to deploy)

(described in rooms section below)

#### how the axes combine

the SVG factory takes `(creature, monsterType, action)` and composites them:
1. **creature** determines the base SVG body paths and proportions
2. **monster type** applies colour transforms, adds costume SVG elements (hat, cape, bandages), modifies facial features
3. **action** determines which `@keyframes` animation plays on scare trigger

visitor fears and loves are keyed to **creature type** (people are scared of spiders, not of "zombie spiders" specifically). monster type and action affect **scare effectiveness** (multipliers) but don't change the fear/love match.

#### progressive unlock of axes

```
MVP (0-50):        [creature] + [room]                            = 2 picks
expansion 1 (55-85):  [creature] + [monster type] + [room]          = 3 picks
expansion 2 (90+):    [creature] + [monster type] + [action] + [room] = 4 picks
```

in the MVP, creatures have a default monster type and default action baked in. the player just picks creature + room. when axis 2 unlocks, the existing creatures gain selectable monster types. when axis 3 unlocks, actions become selectable too.

### rooms (3 open at start, 6 total across expansions)

2 rooms × 3 floors Victorian house. the full structure is drawn from the start; locked rooms are dark with boarded doorways. the train track winds through all unlocked rooms - when a room unlocks, new track sections connect it to the route.

**floor 1** (ground) - both open at start:
1. **entrance hall** - grand Victorian foyer, wooden panels, chandelier with cobwebs, tiled floor. track enters from outside here. (warm brown)
2. **kitchen** - cast-iron stove, hanging copper pots, dripping tap, stone floor. track exits to outside here. (grey/metal)

**floor 2** (upper) - bedroom open at start, attic locked:
3. **bedroom** - four-poster bed with dusty canopy, wardrobe (slightly ajar), ornate mirror. (purple/dark blue)
4. **attic** *(locked, unlocks at 12 coins)* - exposed beams, old trunks, dormer window with moonlight, dust motes. (dark grey/silver)

**floor 3** (tower) - fully locked at start:
5. **tower** *(locked, unlocks ~coins 60)* - stone walls, narrow window with lightning flashes, bats. (dark stone grey)
6. **observatory** *(locked, unlocks ~coins 80)* - telescope, star charts, cracked dome ceiling showing night sky, owl perch. (deep blue/black)

**track route** (grows with unlocks):
- MVP (3 rooms): entrance hall → bedroom (up) → kitchen → exit
- +attic: entrance hall → bedroom → attic → kitchen → exit
- +tower: entrance hall → bedroom → attic → tower (up) → kitchen → exit
- +observatory: entrance hall → bedroom → attic → tower → observatory → kitchen → exit

visitors move between adjacent rooms on foot (same floor) or ride the track between floors. 1 deployed character per room at a time (MVP constraint).

### visitors (sketched, minimal)

visitors are intentionally simple - stick-figure-level SVG outlines so the scare characters remain the visual focus.

- simple side-view silhouettes (~40px tall). circle head, rectangle body, two line-legs. minimal randomisation: skin tone fill, maybe a hat or glasses.
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
| 25 | `snake` | snake creature | creature |
| 30 | `attic` | attic room opens | room |
| 35 | `rat` | rat creature | creature |
| 40 | `tower` | tower room opens (floor 3) | room |
| 45 | `fasterCooldowns` | all cooldowns reduced by 25% | upgrade |
| 50 | `endlessMode` | play past wave 10, increasing difficulty | upgrade |
| 55 | `monsterLab` | monster type selection (3-pick flow) | axis 2 |
| 65 | `vampire` | vampire monster type | monster |
| 75 | `astronaut` | astronaut monster type (child request) | monster |
| 85 | `ghost` | ghost monster type | monster |

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

### expansion 2: "the director's chair" (~coins 80-120)
**unlocks axis 3: actions.** deployment becomes 4-pick: creature -> monster type -> action -> room.
- jump out, grab hat, drop from ceiling available from the start
- creep, chase, cackle/howl, peek-a-boo, swarm unlock progressively
- the child's hat-grab works on any creature (spider leg reaches out, gorilla arm, bat wing, etc.)
- combo bonuses for specific creature + monster + action triples
- **observatory unlocks** (~coins 80) - floor 3 complete, full 6-room house open

### expansion 3: "house upgrades" (~coins 120+)
persistent room modifications, bought with coins, persist between waves.

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
expansion 2 (90+):     [creature] + [monster type] + [action] + [room]     = 4 picks
expansion 3:           4 picks + [room themes & traps] (persistent layer)
```

## verification

- open `index.html` in browser, tap splash screen to start
- train arrives carrying 3 visitors with thought bubbles (fear/love icons visible)
- train winds through entrance hall -> bedroom -> kitchen. visitors hop off at different rooms.
- tap spider in creature panel -> tap kitchen -> spider materialises with animation + sound
- visitor walks into kitchen: if fears spider -> scared reaction + score. if loves spider -> hug + hearts + spider removed
- spider panel icon shows cooldown timer, re-enables after 15s
- complete wave -> all visitors board exit train -> score summary -> coin awarded -> unlock check
- at 5 coins: owl creature unlocks with fanfare
- at 10 coins: attic unlocks, track extends to include it
- reset button restarts current wave. long-press resets all progress
- sound toggle mutes/unmutes all audio
- test on mobile (touch) and desktop (click)

## commit plan

1. `feat: scaffold project with index.html and module structure` - index.html with SVG container, script tags, basic CSS reset. empty IIFE shells for all 16 modules.
2. `feat: add config, game-state, and progress modules` - CONFIG with creature/monster/action rosters, room defs, wave progression, scoring. GameState overlay. Progress with localStorage and unlock tier system.
3. `feat: add house cutaway SVG generation and train track` - House module generating 2×3 Victorian cutaway with locked/unlocked rooms. Train module with track path through unlocked rooms, cart animation.
4. `feat: add visitor SVG factory and movement` - Visitor module with simple sketched figures, walk animation, thought bubbles (fear/love icons), room-to-room movement.
5. `feat: add creature SVG factories` - Creatures module with detailed SVG bodies for spider, gorilla, bat, cat. idle pose, scare pose, hug pose for each.
6. `feat: add monster type overlays and scare factory` - MonsterTypes module (zombie, witch, skeleton overlays). ScareFactory compositing creature + monster type. Actions module with jump-out, grab-hat, drop-from-ceiling. MVP uses defaults (no player choice for axes 2-3 yet).
7. `feat: add scare evaluation and reaction animations` - Reactions + Particles modules. scared/hug/neutral state handling, CSS keyframes, spooky burst and heart particles.
8. `feat: add audio synthesis` - Audio module with synthesised sounds per creature, plus hug, deploy, wave start/end, coin, fanfare.
9. `feat: add picker UI for creature selection and room targeting` - Picker module with creature panel, cooldown display, tap-creature-then-tap-room flow.
10. `feat: add wave state machine with train integration` - Wave module managing train arrival, visitor disembarkation at rooms, active visitor tracking, exit train, wave completion.
11. `feat: add game state machine and splash screen` - Game module tying everything together. splash -> playing -> game over. generation counter.
12. `feat: add unlock tiers and fanfare` - wire up UNLOCK_TIERS (owl, attic, snake, faster cooldowns, rat, endless mode) with fanfare and track extension animation.
13. `feat: add CSS styling and animations` - complete stylesheet: Victorian house theme, train/track, visitor walk cycle, creature idle/scare/hug keyframes, panel styling, responsive mobile layout.
