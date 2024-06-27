import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  PCFSoftShadowMap,
} from "three";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import { World } from "./world.js";
import { lights } from "./lights.js";
import { createUI } from "./gui.js";

const stats = new Stats();
document.body.appendChild(stats.dom);

const renderer = new WebGLRenderer({antialias: true});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x80a0e0, 1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const camera = new PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(-32, 16 , -32)

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(16, 0, 16);
controls.update();

const scene = new Scene();
const world = new World();
world.generate();
scene.add(world);



const animate = () => {
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
  stats.update();
};

lights(scene);
createUI(world);
animate();

addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
