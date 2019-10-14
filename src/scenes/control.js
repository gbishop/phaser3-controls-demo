import { Scene } from "phaser";

export class Control extends Scene {
  constructor() {
    super({
      key: "control"
    });
  }

  create() {
    console.log("create control");
    this.input.keyboard.on("keydown-C", e => {
      console.log("C");
      this.scene.resume("game");
      this.scene.pause();
    });
  }
}
