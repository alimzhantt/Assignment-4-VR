# PA4 – A-Frame VR Scene with Custom Component

**Student ID:** 241177
**Variant:** Winter Steppe (`x1177-`)
**Course:** AR/VR/XR Applications (6B04103 AI Business)

## Variant parameters
* **Prefix:** `x1177-` (`x1177-motion`, `x1177-texture`, `x1177-exhibit`, system `x1177-gallery`)
* **Theme (7):** Winter steppe – six exhibits built from A-Frame primitives, no model files
* **Motion (7 mod 3 = 1):** Orbit – circle around the base point
* **Interaction (1 mod 2 = 1):** Point-and-click – mouse cursor on desktop, `laser-controls` on both hands in VR
* **Layout (1 mod 2 = 1):** Corridor – two rows of 3 exhibits, 3 m apart (x = ±1.5), along 10 m (z = 3 … −7)

## How to run
1. Open the folder in VS Code.
2. Start a static server (Live Server → **Go Live**, or `npx serve .` / `python -m http.server 5500`).
3. Open `http://localhost:5500` in Chrome or Firefox.
4. Desktop: WASD + mouse. VR: Meta Quest Browser or the Immersive Web Emulator → **Enter VR**.
5. Optional: `http://localhost:5500/?debug` logs every `x1177-motion` life-cycle call (E1).

## Controls
| Input | Action |
|---|---|
| W A S D | Move the rig along the corridor |
| Mouse drag | Look around |
| Hover (mouse / laser) | Exhibit grows ×1.15 |
| Click (mouse / trigger) | Select / deselect; selected exhibit shows its info panel and orbits with double amplitude |
| **M** | Pause / resume all exhibit motion (through the `x1177-gallery` system) |
| **X** | Remove the selected exhibit from the DOM; counter updates |

## Files
* `index.html` – scene, `<a-assets>`, rig, exhibits
* `components.js` – `x1177-gallery` system, `x1177-motion`, `x1177-texture`, `x1177-exhibit`
* `textures/` – `snow.jpg` (1024²), `ice.jpg` (1024²), `sky.jpg` (1024×512)
* `experiments/ch8-texture.js` – Ch. 8-style loader used only for write-up experiments E2/E3 (not loaded by the scene)

## Texture credits and licences
All three textures (`textures/snow.jpg`, `textures/ice.jpg`, `textures/sky.jpg`) were generated procedurally (seamless multi-octave noise, Python + NumPy + Pillow) by the author for this project and are released under **CC0 1.0** (public domain dedication).