// Ch. 8-style texture loader, kept only for experiments E2/E3.
// Breaks conventions on purpose: runtime objects in the schema, wrong filters,
// properties that do not exist in Three.js.
AFRAME.registerComponent("ch8-texture", {
  schema: {
    src: { type: "string" },
    repeat: { type: "vec2", default: { x: 1, y: 1 } },
    texture: { default: null },
    material: { default: null },
    mesh: { default: null }
  },
  init: function () {
    this.data.mesh = this.el.getObject3D("mesh");
    this.data.texture = new THREE.TextureLoader().load(this.data.src);
    this.data.texture.wrapS = this.data.texture.wrapT = THREE.RepeatWrapping;
    this.data.texture.repeat.set(this.data.repeat.x, this.data.repeat.y);
    this.data.texture.minFilter = THREE.NearestFilter;            // no mipmaps -> shimmer
    this.data.texture.magFilter = THREE.LinearMipmapLinearFilter; // invalid for magnification
    this.data.texture.anisotropic = 16;                           // does not exist (anisotropy)
    this.data.texture.generateMipMaps = false;                    // does not exist (generateMipmaps)
    this.data.material = new THREE.MeshStandardMaterial({ map: this.data.texture });
    this.data.mesh.material = this.data.material;
  }
});
