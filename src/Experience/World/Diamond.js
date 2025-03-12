import * as THREE from "three";
import Experience from "../Experience";
import { MeshBVH, MeshBVHHelper, SAH } from "three-mesh-bvh";

import diamondMaterial from "../Materials/DiamondMaterial.js";

export default class Plane {
  constructor() {
    this.experience = new Experience();
    this.debug = this.experience.debug;
    this.scene = this.experience.scene;
    this.time = this.experience.time;
    this.resources = this.experience.resources;
    this.sizes = this.experience.sizes;
    this.camera = this.experience.camera.instance;

    // Options
    this.options = {
      bounces: 3,
      fresnel: 1,
      fresnelCoef: 20,
      reflection: 0.2,
      reflectionCoef: 0.001,
      color: 0xffffff,
      correctMips: true,
      chromaticAberration: false,
    };

    // Setup
    this.envMapDiamond = this.resources.items.envMapDiamond;
    this.resource = this.resources.items.diamondModel;

    this.setDiamondMaterial();
    this.setModel();

    // Debug
    this.setDebug();
  }
  setDiamondMaterial() {
    this.diamondMaterial = diamondMaterial({
      envMap: this.envMapDiamond,
      bounces: this.options.bounces,
      fresnel: this.options.fresnel,
      fresnelCoef: this.options.fresnelCoef,
      reflection: this.options.reflection,
      reflectionCoef: this.options.reflectionCoef,
      color: new THREE.Color(this.options.color),
      correctMips: this.options.correctMips,
      chromaticAberration: this.options.chromaticAberration,
      projectionMatrixInverse: this.camera.projectionMatrixInverse,
      matrixWorld: this.camera.matrixWorld,
      resolution: new THREE.Vector2(this.sizes.width, this.sizes.height),
    });
  }

  setModel() {
    this.model = this.resource.scene;
    this.model.traverse((child) => {
      if (child.name.includes("diamond")) {
        const diamond = child;
        const mergedGeometry = diamond.geometry;
        mergedGeometry.boundsTree = new MeshBVH(mergedGeometry.toNonIndexed(), {
          lazyGeneration: false,
          strategy: SAH,
        });

        const collider = new THREE.Mesh(mergedGeometry);
        collider.material.wireframe = true;
        collider.material.opacity = 0.5;
        collider.material.transparent = true;
        collider.visible = false;
        collider.boundsTree = mergedGeometry.boundsTree;

        this.diamondMesh = new THREE.Mesh(
          diamond.geometry,
          this.diamondMaterial
        );
        this.diamondMesh.material.uniforms.uBvh.value.updateFrom(
          collider.boundsTree
        );
        this.diamondMesh.isDiamond = true;
      }
    });
    this.scene.add(this.diamondMesh);
  }

  setDebug() {
    if (this.debug.active) {
      this.debugFolder = this.debug.ui.addFolder({
        title: "Diamond",
      });
      this.debugFolder
        .addBinding(this.options, "bounces", {
          min: 0,
          max: 4,
          step: 1,
        })
        .on("change", () => {
          this.diamondMaterial.uniforms.uBounces.value = this.options.bounces;
        });
      this.debugFolder
        .addBinding(this.options, "correctMips")
        .on("change", () => {
          this.diamondMaterial.uniforms.uCorrectMips.value =
            this.options.correctMips;
        });
      this.debugFolder
        .addBinding(this.options, "fresnel", {
          min: 0,
          max: 1,
          step: 0.001,
        })
        .on("change", () => {
          this.diamondMaterial.uniforms.uFresnel.value = this.options.fresnel;
        });
      this.debugFolder
        .addBinding(this.options, "fresnelCoef", {
          min: 0,
          max: 100,
          step: 0.00001,
        })
        .on("change", () => {
          this.diamondMaterial.uniforms.uFresnelCoef.value =
            this.options.fresnelCoef;
        });
      this.debugFolder
        .addBinding(this.options, "reflection", {
          min: 0,
          max: 1,
          step: 0.001,
        })
        .on("change", () => {
          this.diamondMaterial.uniforms.uReflection.value =
            this.options.reflection;
        });
      this.debugFolder
        .addBinding(this.options, "reflectionCoef", {
          min: 0,
          max: 1,
          step: 0.0001,
        })
        .on("change", () => {
          this.diamondMaterial.uniforms.uReflectionCoef.value =
            this.options.reflectionCoef;
        });
    }
  }

  update() {}
}
