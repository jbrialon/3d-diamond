import * as THREE from "three";
import { gsap } from "gsap";
import Experience from "../Experience";

import vertexShader from "../../shaders/loader/vertex.glsl";
import fragmentShader from "../../shaders/loader/fragment.glsl";

export default class Loader {
  constructor() {
    this.experience = new Experience();
    this.scene = this.experience.scene;

    // Options
    this.options = {
      uColor: 0xf0f0f0,
      uAlpha: 1,
    };

    // Setup
    this.setGeometry();
    this.setMaterial();
    this.setMesh();
  }

  setGeometry() {
    this.geometry = new THREE.PlaneGeometry(2, 2, 1, 1);
  }

  setMaterial() {
    this.material = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        uAlpha: new THREE.Uniform(this.options.uAlpha),
        uColor: new THREE.Uniform(new THREE.Color(this.options.uColor)),
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
    });
  }

  setMesh() {
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.mesh);
  }

  hideLoader() {
    gsap.to(this.material.uniforms.uAlpha, {
      duration: 3,
      value: 0,
      ease: "power4.inOut",
      onComplete: () => {
        this.destroy();
      },
    });
  }

  destroy() {
    this.geometry.dispose();
    this.material.dispose();
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
    this.scene.remove(this.mesh);
  }
}
