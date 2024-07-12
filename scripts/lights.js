import {
  AmbientLight,
  CameraHelper,
  DirectionalLight,
  Vector2,
  Vector3,
} from "three";

export class Lights {
  constructor(scene) {
    this.scene = scene;

    this.ambientLight = new AmbientLight(0xffffff, 0.3);
    this.scene.add(this.ambientLight);

    this.sun = new DirectionalLight();
    this.sun.castShadow = true;
    this.sun.shadow.camera.left = -100;
    this.sun.shadow.camera.right = 100;
    this.sun.shadow.camera.top = 100;
    this.sun.shadow.camera.bottom = -100;
    this.sun.shadow.camera.near = 0.1;
    this.sun.shadow.camera.far = 200;
    this.sun.shadow.bias = -0.0001;
    this.sun.shadow.mapSize = new Vector2(2048, 2048);

    this.scene.add(this.sun);

    this.shadowHelper = new CameraHelper(this.sun.shadow.camera);
    // this.scene.add(this.shadowHelper);
    this.scene.add(this.sun.target)

  }

  update(player) {
    this.sun.position.copy(player.camera.position);
    this.sun.position.sub(new Vector3(-50, -50, -50));
    this.sun.target.position.copy(player.camera.position);
  }
}
