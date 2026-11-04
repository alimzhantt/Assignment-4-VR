# PA4 – A-Frame VR Scene with Custom Component

**Student ID:** 241177  
**Variant:** Winter Steppe (`x1177-`)  
**Course:** AR/VR/XR Applications (6B04103 AI Business)  

## ❄️ Variant Parameters
* **Prefix:** `x1177-`
* **Theme:** Winter Steppe (Snow & Ice Exhibits built procedurally with A-Frame primitives)
* **Exhibit Motion:** Orbit (Circular trajectory around base point)
* **Interaction:** Point-and-click (Mouse desktop + Laser-controls VR)
* **Layout:** Corridor (Two rows of 3 exhibits, 3m apart, along 10m length)

---

## 🚀 How to Run Locally

1. Open the repository folder in **VS Code**.
2. Start a static HTTP server (e.g., click **Go Live** via Live Server extension).
3. Open `http://localhost:5500` in **Google Chrome** or **Firefox**.
4. Use WASD + Mouse for desktop controls, or use the **Immersive Web Emulator** / Meta Quest Browser to click **Enter VR**.

---

## 🎮 Controls & Key Map

* **WASD:** Move camera around the corridor.
* **Mouse / VR Laser:** Hover over exhibits to scale, click to select/deselect.
* **Key `M`:** Global Pause / Resume all exhibit motion.
* **Key `X`:** Delete selected exhibit from scene and DOM (updates counter live).

---

## 📜 Texture Credits & Licences

* `snow-ground`: Three.js Official Repository Samples (CC0 / MIT License).
* `ice-texture`: Three.js Official Repository Samples (CC0 / MIT License).
* `sky-winter`: Three.js Official Repository Samples (CC0 / MIT License).