/* =========================================================================
   PA4 - Custom System & Components
   Student ID: 241177 | Variant: x1177-
   ========================================================================= */

// 1. Custom System: x1177-gallery
AFRAME.registerSystem("x1177-gallery", {
  init: function () {
    this.exhibits = [];
    this.selected = null;
    this.isPaused = false;

    // Keyboard Shortcuts (M: Pause/Resume Motion, X: Delete Selected)
    window.addEventListener("keydown", (e) => {
      if (e.key === "m" || e.key === "M") {
        this.toggleAllMotion();
      } else if (e.key === "x" || e.key === "X") {
        this.removeSelected();
      }
    });
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
      if (this.selected === el) {
        this.selected = null;
      }
      this.updateCounter();
    }
  },

  select: function (el) {
    // Single selection rule
    if (this.selected && this.selected !== el) {
      const prevComponent = this.selected.components["x1177-exhibit"];
      if (prevComponent) prevComponent.deselect();
    }
    this.selected = el;
    this.updateCounter();
  },

  toggleAllMotion: function () {
    this.isPaused = !this.isPaused;
    this.exhibits.forEach((ex) => {
      if (this.isPaused) {
        ex.pause();
      } else {
        ex.play();
      }
    });
  },

  removeSelected: function () {
    if (this.selected) {
      const elToRemove = this.selected;
      this.selected = null;
      if (elToRemove.parentNode) {
        elToRemove.parentNode.removeChild(elToRemove);
      }
    }
  },

  updateCounter: function () {
    const counterEl = document.querySelector("#gallery-counter");
    if (!counterEl) return;
    const total = this.exhibits.length;
    let selectedName = "None";

    if (this.selected && this.selected.components["x1177-exhibit"]) {
      selectedName = this.selected.components["x1177-exhibit"].data.name;
    }

    const selectedIdx = this.selected ? this.exhibits.indexOf(this.selected) + 1 : 0;
    counterEl.setAttribute(
      "value",
      `Selected: ${selectedName} (${selectedIdx} of ${total})`
    );
  }
});

// 2. Custom Motion Component: x1177-motion
AFRAME.registerComponent("x1177-motion", {
  schema: {
    type: { type: "string", default: "orbit", oneOf: ["bob", "orbit", "pulse"] },
    amplitude: { type: "number", default: 0.4 },
    period: { type: "number", default: 4.0 },
    phase: { type: "number", default: 0.0 }
  },

  init: function () {
    // Store original base pose to prevent drift
    this.basePosition = this.el.object3D.position.clone();
    this.baseScale = this.el.object3D.scale.clone();
    this.timeAccumulator = 0;
  },

  update: function (oldData) {
    // Live schema adjustments without jumping
    if (oldData.period && oldData.period !== this.data.period) {
      // Smooth scaling of phase accumulator if needed
    }
  },

  tick: function (time, timeDelta) {
    if (isNaN(timeDelta)) return;
    const dt = timeDelta / 1000;
    this.timeAccumulator += dt;

    const omega = (2 * Math.PI) / (this.data.period || 1.0);
    const angle = omega * this.timeAccumulator + this.data.phase;
    const val = Math.sin(angle) * this.data.amplitude;

    if (this.data.type === "bob") {
      this.el.object3D.position.y = this.basePosition.y + val;
    } else if (this.data.type === "orbit") {
      // Circular motion in XZ plane around base position
      const cosVal = Math.cos(angle) * this.data.amplitude;
      this.el.object3D.position.x = this.basePosition.x + cosVal;
      this.el.object3D.position.z = this.basePosition.z + val;
    } else if (this.data.type === "pulse") {
      const s = 1.0 + val * 0.5;
      this.el.object3D.scale.set(
        this.baseScale.x * s,
        this.baseScale.y * s,
        this.baseScale.z * s
      );
    }
  },

  pause: function () {},
  play: function () {},

  remove: function () {
    // Restore base pose on component removal
    if (this.basePosition) this.el.object3D.position.copy(this.basePosition);
    if (this.baseScale) this.el.object3D.scale.copy(this.baseScale);
  }
});

// 3. Custom Texture Loader Component: x1177-texture
AFRAME.registerComponent("x1177-texture", {
  schema: {
    src: { type: "map" },
    repeat: { type: "vec2", default: { x: 1, y: 1 } },
    anisotropy: { type: "number", default: 4 }
  },

  init: function () {
    this.texture = null;
    this.material = null;
    this.appliedMesh = null;

    if (this.el.getObject3D("mesh")) {
      this.applyTexture();
    } else {
      this.el.addEventListener("object3dset", () => {
        this.applyTexture();
      });
    }
  },

  applyTexture: function () {
    const mesh = this.el.getObject3D("mesh");
    if (!mesh || !this.data.src) return;

    const textureLoader = new THREE.TextureLoader();
    const srcUrl = typeof this.data.src === "string" ? this.data.src : this.data.src.src;

    textureLoader.load(srcUrl, (tex) => {
      this.texture = tex;
      this.texture.wrapS = THREE.RepeatWrapping;
      this.texture.wrapT = THREE.RepeatWrapping;
      this.texture.repeat.set(this.data.repeat.x, this.data.repeat.y);

      // Optimized texture filtering
      this.texture.minFilter = THREE.LinearMipmapLinearFilter;
      this.texture.magFilter = THREE.LinearFilter;
      this.texture.anisotropy = this.data.anisotropy;

      this.material = new THREE.MeshStandardMaterial({ map: this.texture });
      this.appliedMesh = mesh;
      this.originalMaterial = mesh.material;
      mesh.material = this.material;
    });
  },

  update: function (oldData) {
    if (oldData.src && oldData.src !== this.data.src) {
      this.applyTexture();
    }
  },

  remove: function () {
    if (this.appliedMesh && this.originalMaterial) {
      this.appliedMesh.material = this.originalMaterial;
    }
    if (this.texture) this.texture.dispose();
    if (this.material) this.material.dispose();
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
    if (this.system) {
      this.system.register(this.el);
    }

    this.isSelected = false;
    this.infoEntity = null;

    // Store initial scale for hover effects
    this.baseScale = this.el.object3D.scale.clone();
  },

  events: {
    mouseenter: function () {
      this.el.object3D.scale.set(
        this.baseScale.x * 1.15,
        this.baseScale.y * 1.15,
        this.baseScale.z * 1.15
      );
    },
    mouseleave: function () {
      if (!this.isSelected) {
        this.el.object3D.scale.copy(this.baseScale);
      }
    },
    click: function () {
      if (this.isSelected) {
        this.deselect();
      } else {
        this.select();
      }
    }
  },

  select: function () {
    this.isSelected = true;
    if (this.system) this.system.select(this.el);

    // Double motion amplitude on selection
    const motion = this.el.getAttribute("x1177-motion");
    if (motion) {
      this.originalAmplitude = motion.amplitude;
      this.el.setAttribute("x1177-motion", "amplitude", motion.amplitude * 2.0);
    }

    // Attach info panel above exhibit
    this.createInfoPanel();
  },

  deselect: function () {
    this.isSelected = false;
    this.el.object3D.scale.copy(this.baseScale);

    // Restore motion amplitude
    const motion = this.el.getAttribute("x1177-motion");
    if (motion && this.originalAmplitude) {
      this.el.setAttribute("x1177-motion", "amplitude", this.originalAmplitude);
    }

    this.removeInfoPanel();
  },

  createInfoPanel: function () {
    this.removeInfoPanel();

    this.infoEntity = document.createElement("a-entity");
    this.infoEntity.setAttribute("position", "0 2.2 0");

    const plane = document.createElement("a-plane");
    plane.setAttribute("width", "2.2");
    plane.setAttribute("height", "0.7");
    plane.setAttribute("color", "#0f2027");
    plane.setAttribute("opacity", "0.9");
    this.infoEntity.appendChild(plane);

    const titleText = document.createElement("a-text");
    titleText.setAttribute("value", this.data.name);
    titleText.setAttribute("align", "center");
    titleText.setAttribute("position", "0 0.15 0.01");
    titleText.setAttribute("scale", "0.6 0.6 0.6");
    titleText.setAttribute("color", "#00d2ff");
    this.infoEntity.appendChild(titleText);

    const descText = document.createElement("a-text");
    descText.setAttribute("value", this.data.info);
    descText.setAttribute("align", "center");
    descText.setAttribute("position", "0 -0.1 0.01");
    descText.setAttribute("scale", "0.4 0.4 0.4");
    descText.setAttribute("color", "#ffffff");
    this.infoEntity.appendChild(descText);

    this.el.appendChild(this.infoEntity);
  },

  removeInfoPanel: function () {
    if (this.infoEntity && this.infoEntity.parentNode) {
      this.infoEntity.parentNode.removeChild(this.infoEntity);
      this.infoEntity = null;
    }
  },

  remove: function () {
    if (this.system) {
      this.system.unregister(this.el);
    }
    this.removeInfoPanel();
  }
});