# CapyCode Art Style Spec

This is the source of truth for anyone producing final mascot art
(replacing the placeholders in `src/assets/capy/`).

## Canvas

- **64×64 pixels**, base sprite
- Transparent background
- Centered, identical canvas size across every outfit variant
- Modern kawaii pixel art — think Stardew Valley / Animal Crossing, not
  retro GameBoy, not Minecraft blockiness

## Color Palette

| Hex | Role |
|---|---|
| `#5A3A28` | Outline |
| `#8B5E3C` | Dark fur |
| `#C49A6C` | Main fur |
| `#E8C9A6` | Light fur |
| `#F7E6CB` | Belly / muzzle |
| `#2B211C` | Eyes |
| `#F7B6C2` | Blush |
| `#87A97A` | Scarf |
| `#5F8C56` | Scarf shade |
| `#FFFFFF` | Cup |
| `#B07A4A` | Tea |
| `#EDE9E4` | Steam |

## Identity Rules

The mascot must stay **identical** across every outfit. Only accessories
change. Never change: face, proportions, body, base colors, or shading.

## Required States (v1)

`default`, `detective`, `builder`, `sleepy`, `celebration`, `cheerleader`,
`thinking`, `happy`, `blink`

These are the only states shipped. Don't add a new one without art to
back it — see `src/lib/moodMachine.ts`.

## Layered Approach (recommended)

Split art into layers so accessories can be swapped independently:
`body → face → blush → accessory → hand-held item`. This also makes future
community-contributed outfits (see the open-source vision) far easier to
review and merge.
