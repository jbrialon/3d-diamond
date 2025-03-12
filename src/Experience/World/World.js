import Experience from "../Experience";
import Loader from "./Loader";
import Diamond from "./Diamond";

export default class World {
  constructor() {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.resources = this.experience.resources;

    this.loader = new Loader();

    // Wait for resources to be loaded
    this.resources.on("ready", () => {
      // Setup
      this.diamond = new Diamond();

      // Show Experience
      this.loader.hideLoader();
    });
  }

  update() {
    if (this.diamond) this.diamond.update();
  }
}
