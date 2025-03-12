import Stats from "stats-gl";

export default class Performance {
  constructor() {
    this.active = window.location.hash === "#debug";

    if (this.active) {
      this.stats = new Stats({
        trackGPU: true,
        trackHz: true,
        trackCPT: true,
        minimal: false,
        mode: 2,
        horizontal: false,
      });
      document.body.appendChild(this.stats.dom);
    }
  }

  init(renderer) {
    if (this.active) this.stats.init(renderer);
  }

  begin() {
    if (this.active) this.stats.begin();
  }

  update() {
    if (this.active) this.stats.update();
  }

  end() {
    if (this.active) this.stats.end();
  }
}
