# boo boss

a haunted house management game. you run a spooky house attraction, deploying scare creatures to frighten visitors as they ride through on a dark-ride train. visitors have fears and loves - match a creature to their fear and they get scared, but if they love it, they'll hug it and it disappears.

## origins

a father-and-child brainstorm. the spooky-house concept itself came from the child, along with the witch-grabs-your-hat action (sparked by a real haunted house visit) and the zombie and dinosaur creatures. the rest grew around those seeds.

## how to play

a train arrives carrying visitors. each visitor has a fear (red jagged bubble) and a love (pink heart bubble) floating above their head while they ride - this is your planning window. read them before they hop off.

visitors disembark at different rooms and wander. pick a creature from the bottom panel, then tap a room to deploy. if a visitor's fear matches, they get scared and you score. if their love matches, they hug the creature and it vanishes. neutral visitors walk past, unimpressed.

score enough to earn coins between waves. coins unlock new creatures, rooms, monster types (zombie, witch, skeleton, vampire, astronaut, ghost), and scare actions (jump out, grab hat, drop from ceiling, swarm, peek-a-boo, chase). with everything unlocked, deployment is a four-stage pick: creature then monster type then action then room.

## controls

- tap a creature slot, then tap a room to deploy (works on touch and mouse)
- 🔊 toggle sound
- ↻ restart current wave (long-press to reset all progress)
- 🏆 leaderboard

## run locally

no build step. open `index.html` in any modern browser. save data lives in localStorage under `hauntedHouse_progress`.

## tech

built with AI (Claude Code). vanilla JS, inline SVG, CSS animations, Web Audio synthesis. modules load as plain `<script>` tags in a fixed order, each exposing a single IIFE namespace. no framework, no bundler, no dependencies.

## design

see [docs/plan.md](docs/plan.md) for the full design doc - mvp, shipped expansions (monster lab, director's chair), the four axes of scare-building, unlock tiers, and the thinking behind each choice.
