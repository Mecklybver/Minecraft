import { AmbientLight,
  CameraHelper,
  DirectionalLight,
  Vector2} from "three";

export const lights = (scene) => {
  const ambientLight = new AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);
  const sun = new DirectionalLight(0xffffff, 1);
  sun.position.set(50, 50, 50);
  sun.castShadow = true;
  sun.shadow.camera.left = -50;
  sun.shadow.camera.right = 50;
  sun.shadow.camera.top = -50;
  sun.shadow.camera.bottom = 50;
  sun.shadow.camera.near = 0.1;
  sun.shadow.camera.far = 100;
  sun.shadow.bias = 0.0001;
  sun.shadow.mapSize = new Vector2(512, 512);
  scene.add(sun);
  const shadowHelper = new CameraHelper(sun.shadow.camera);
  scene.add(shadowHelper);
};
