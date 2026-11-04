/* =========================================================================
   PA4 - Custom System & Components
   Student ID: 241177 | Variant: x1177- (Winter steppe, orbit, click, corridor)
   ========================================================================= */

// Set window.X1177_DEBUG = true in the console (or ?debug in the URL)
// to log every x1177-motion life-cycle call with a timestamp (E1).
window.X1177_DEBUG = window.X1177_DEBUG || /[?&]debug/.test(location.search);
function x1177log(el, method, extra) {
  if (!window.X1177_DEBUG) return;
  const t = performance.now().toFixed(1).padStart(8);
  console.log(`[${t} ms] x1177-motion#${el.id || "?"} ${method}${extra ? " " + extra : ""}`);
}

// 1. Custom System: x1177-gallery
AFRAME.registerSystem("x1177-gallery", {
  init: function () {
    this.exhibits = [];
    this.selected = null;
    this.isPaused = false;

    this.onKeyDown = (e) => {
      const k = e.key.toLowerCase();
      if (k === "m") this.toggleAllMotion();
      else if (k === "x") this.removeSelected();
    };
    window.addEventListener("keydown", this.onKeyDown);
  },

  register: function (el) {
    if (this.exhibits.indexOf(el) === -1) {
      this.exhibits.push(el);
      this.updateCounter();
    }
  },

  unregister: function (el) {
    const idx = this.exhibits.indexOf(el);
    if (idx !== -1) {
      this.exhibits.splice(idx, 1);
      if (this.selected === el) this.selected = null;
      this.updateCounter();
    }
  },

  // Single-selection rule
  select: function (el) {
    if (this.selected && this.selected !== el) {
      const prev = this.selected.components["x1177-exhibit"];
      if (prev) prev.deselect();
    }
    this.selected = el;
    this.updateCounter();
  },

  clearSelection: function (el) {
    if (this.selected === el) {
      this.selected = null;
      this.updateCounter();
    }
  },

  // Pause only the motion component, so hover/click keep working while frozen.
  toggleAllMotion: function () {
    this.isPaused = !this.isPaused;
    this.exhibits.forEach((ex) => {
      const motion = ex.components["x1177-motion"];
      if (!motion) return;
      if (this.isPaused) motion.pause();
      else motion.play();
    });
  },

  removeSelected: function () {
    const el = this.selected;
    if (el && el.parentNode) el.parentNode.removeChild(el);
  },

  updateCounter: function () {
    const counterEl = document.querySelector("#gallery-counter");
    if (!counterEl) return;
    const total = this.exhibits.length;
    let name = "None";
    let n = 0;
    if (this.selected && this.selected.components["x1177-exhibit"]) {
      name = this.selected.components["x1177-exhibit"].data.name;
      n = this.exhibits.indexOf(this.selected) + 1;
    }
    counterEl.setAttribute("value", `Selected: ${name} (${n} of ${total})`);
  }
});

// 2. Custom Motion Component: x1177-motion
AFRAME.registerComponent("x1177-motion", {
  schema: {
    type: { type: "string", default: "orbit", oneOf: ["bob", "orbit", "pulse"] },
    amplitude: { type: "number", default: 0.4 },
    period: { type: "number", default: 4.0 },   // seconds
    phase: { type: "number", default: 0.0 }     // radians
  },

  init: function () {
    x1177log(this.el, "init");
    // Base pose stored once: every frame is computed from it, so no drift.
    this.basePosition = this.el.object3D.position.clone();
    this.baseScale = this.el.object3D.scale.clone();
    // Accumulated angle (rad). Integrating omega*dt instead of omega*t means a
    // new period changes speed only, never the current angle -> no jump.
    this.angle = this.data.phase;
    // Amplitude eases toward the target so setAttribute never snaps the pose.
    this.currentAmplitude = this.data.amplitude;
  },

  update: function (oldData) {
    x1177log(this.el, "update", "oldData=" + JSON.stringify(oldData) + " data=" + JSON.stringify(this.data));
    if (oldData.phase !== undefined && oldData.phase !== this.data.phase) {
      this.angle += this.data.phase - oldData.phase;
    }
    if (oldData.type !== undefined && oldData.type !== this.data.type) {
      this.el.object3D.position.copy(this.basePosition);
      this.el.object3D.scale.copy(this.baseScale);
    }
  },

  tick: function (time, timeDelta) {
    if (!timeDelta) return;
    const dt = Math.min(timeDelta, 100) / 1000; // clamp after tab switches
    const omega = (2 * Math.PI) / Math.max(this.data.period, 0.01);
    this.angle += omega * dt;
    // Exponential approach (~0.25 s time constant) to the target amplitude
    const k = 1 - Math.exp(-dt / 0.25);
    this.currentAmplitude += (this.data.amplitude - this.currentAmplitude) * k;

    const a = this.currentAmplitude;
    const s = Math.sin(this.angle);
    const p = this.el.object3D.position;

    if (this.data.type === "orbit") {
      p.x = this.basePosition.x + Math.cos(this.angle) * a;
      p.z = this.basePosition.z + s * a;
    } else if (this.data.type === "bob") {
      p.y = this.basePosition.y + s * a;
    } else if (this.data.type === "pulse") {
      const f = 1 + s * a * 0.5;
      this.el.object3D.scale.set(this.baseScale.x * f, this.baseScale.y * f, this.baseScale.z * f);
    }
  },

  // tick() is not called while paused; this.angle is kept, so play() resumes
  // from exactly the same pose.
  pause: function () { x1177log(this.el, "pause"); },
  play: function () { x1177log(this.el, "play"); },

  remove: function () {
    x1177log(this.el, "remove");
    this.el.object3D.position.copy(this.basePosition);
    this.el.object3D.scale.copy(this.baseScale);
  }
});

// 3. Custom Texture Loader Component: x1177-texture (rewrite of Ch. 8 loader)
AFRAME.registerComponent("x1177-texture", {
  // Schema = configuration only. Runtime objects live on `this`.
  schema: {
    src: { type: "map" },
    normalSrc: { type: "map" },
    repeat: { type: "vec2", default: { x: 1, y: 1 } },
    anisotropy: { type: "number", default: 8 }
  },

  init: function () {
    this.texture = null;
    this.normalTexture = null;
    this.material = null;
    this.mesh = null;
    this.originalMaterial = null;
    this.onObject3DSet = this.onObject3DSet.bind(this);
    this.el.addEventListener("object3dset", this.onObject3DSet);
  },

  onObject3DSet: function (evt) {
    if (evt.detail.type === "mesh" && evt.target === this.el) this.apply();
  },

  update: function (oldData) {
    const srcChanged = oldData.src !== this.data.src || oldData.normalSrc !== this.data.normalSrc;
    if (srcChanged) {
      this.apply();                       // first call + real src changes only
    } else if (this.texture) {
      this.configure(this.texture);       // repeat / anisotropy: no reload
      if (this.normalTexture) this.configure(this.normalTexture);
    }
  },

  apply: function () {
    const mesh = this.el.getObject3D("mesh");
    if (!mesh || !this.data.src) return;  // wait for object3dset
    if (!this.originalMaterial || this.mesh !== mesh) {
      this.mesh = mesh;
      this.originalMaterial = mesh.material;
    }
    this.disposeRuntime();

    this.texture = this.makeTexture(this.data.src, true);
    this.normalTexture = this.data.normalSrc ? this.makeTexture(this.data.normalSrc, false) : null;
    this.material = new THREE.MeshStandardMaterial({
      map: this.texture,
      normalMap: this.normalTexture,
      roughness: 0.9
    });
    mesh.material = this.material;
  },

  makeTexture: function (src, isColor) {
    let tex;
    if (src instanceof HTMLImageElement) {
      // Reuse the image preloaded by <a-assets>
      tex = new THREE.Texture(src);
      if (src.complete) tex.needsUpdate = true;
      else src.addEventListener("load", () => { tex.needsUpdate = true; }, { once: true });
    } else {
      tex = new THREE.TextureLoader().load(src);
    }
    if (isColor) tex.colorSpace = THREE.SRGBColorSpace;
    this.configure(tex);
    return tex;
  },

  configure: function (tex) {
    const renderer = this.el.sceneEl.renderer;
    const maxAniso = renderer ? renderer.capabilities.getMaxAnisotropy() : 1;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(this.data.repeat.x, this.data.repeat.y);
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter; // trilinear: no shimmer far away
    tex.magFilter = THREE.LinearFilter;             // smooth close up
    tex.anisotropy = Math.min(this.data.anisotropy, maxAniso); // sharp at grazing angles
    tex.needsUpdate = true;
  },

  disposeRuntime: function () {
    if (this.texture) this.texture.dispose();
    if (this.normalTexture) this.normalTexture.dispose();
    if (this.material) this.material.dispose();
    this.texture = this.normalTexture = this.material = null;
  },

  remove: function () {
    this.el.removeEventListener("object3dset", this.onObject3DSet);
    if (this.mesh && this.originalMaterial) this.mesh.material = this.originalMaterial;
    this.disposeRuntime();
  }
});

// 4. Custom Exhibit Component: x1177-exhibit
AFRAME.registerComponent("x1177-exhibit", {
  schema: {
    name: { type: "string", default: "Exhibit" },
    info: { type: "string", default: "Description" }
  },

  init: function () {
    this.system = this.el.sceneEl.systems["x1177-gallery"];
    this.isSelected = false;
    this.infoEntity = null;
    this.originalAmplitude = null;
    this.baseScale = this.el.object3D.scale.clone();
    if (this.system) this.system.register(this.el);
  },

  events: {
    mouseenter: function () {
      this.el.object3D.scale.copy(this.baseScale).multiplyScalar(1.15);
    },
    mouseleave: function () {
      if (!this.isSelected) this.el.object3D.scale.copy(this.baseScale);
    },
    click: function () {
      if (this.isSelected) {
        this.deselect();
        if (this.system) this.system.clearSelection(this.el);
      } else {
        this.select();
      }
    }
  },

  select: function () {
    this.isSelected = true;
    if (this.system) this.system.select(this.el);
    const motion = this.el.getAttribute("x1177-motion");
    if (motion) {
      this.originalAmplitude = motion.amplitude;
      this.el.setAttribute("x1177-motion", "amplitude", motion.amplitude * 2);
    }
    this.createInfoPanel();
  },

  deselect: function () {
    this.isSelected = false;
    this.el.object3D.scale.copy(this.baseScale);
    if (this.originalAmplitude !== null && this.el.getAttribute("x1177-motion")) {
      this.el.setAttribute("x1177-motion", "amplitude", this.originalAmplitude);
    }
    this.originalAmplitude = null;
    this.removeInfoPanel();
  },

  createInfoPanel: function () {
    this.removeInfoPanel();
    const panel = document.createElement("a-entity");
    panel.setAttribute("position", "0 2.3 0");
    panel.innerHTML =
      '<a-plane width="2.4" height="0.75" color="#0f2027" opacity="0.9"></a-plane>' +
      '<a-text align="center" position="0 0.17 0.01" width="4" color="#00d2ff"></a-text>' +
      '<a-text align="center" position="0 -0.12 0.01" width="2.3" wrap-count="44" color="#ffffff"></a-text>';
    const texts = panel.querySelectorAll("a-text");
    texts[0].setAttribute("value", this.data.name);
    texts[1].setAttribute("value", this.data.info);
    this.infoEntity = panel;
    this.el.appendChild(panel);
  },

  removeInfoPanel: function () {
    if (this.infoEntity && this.infoEntity.parentNode) {
      this.infoEntity.parentNode.removeChild(this.infoEntity);
    }
    this.infoEntity = null;
  },

  remove: function () {
    if (this.system) this.system.unregister(this.el);
    this.removeInfoPanel();
  }
});