# MAELSTROM

A neon arcade shooter for desktop, tablet and phone.

Play it at https://maelstrom.mokhan.ca

## Controls

| Action | Keyboard | Touch |
| --- | --- | --- |
| Move | Arrows / WASD | Drag anywhere |
| Fire | Space | Hold |
| Pause | P / Esc | ❚❚ button |
| Mute | M | ♪ button |
| Start / restart | Enter | Play button |

Survive the waves. Every five kills in a row raises your multiplier, and one hit resets it. Grab power-ups: **S** for spread shot, **R** for rapid fire, **+** for a shield.

## Development

Requires Node 22.

```bash
npm install
npm run dev      # http://localhost:5173, also on your LAN for phone testing
npm test
npm run lint
npm run build    # outputs dist/
```

Gameplay tuning lives in `src/config.js`.

## Deployment

Hosted on Cloudflare Workers static assets (`wrangler.jsonc`). Workers Builds deploys every push to `main` once the tests pass.
