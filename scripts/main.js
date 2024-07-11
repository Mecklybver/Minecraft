import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  PCFSoftShadowMap,
  Fog
} from "three";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import { World} from "./world.js";
import { Lights } from "./lights.js";
import { createUI } from "./gui.js";
import { Player } from "./player.js";
import { Physics } from "./physics.js";
import { blocks} from "./blocks.js";

const stats = new Stats();
document.body.appendChild(stats.dom);

const renderer = new WebGLRenderer({antialias: true, alpha: true});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x80a0e0, 1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const orbitCamera = new PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
orbitCamera.position.set(-32, 16 , -32)

const controls = new OrbitControls(orbitCamera, renderer.domElement);
controls.target.set(16, 0, 16);
controls.update();

const scene = new Scene();
const world = new World();
world.generate();
scene.add(world);

const player = new Player(scene, orbitCamera);

const physics = new Physics(scene);

const lights = new Lights(scene);

scene.fog= new Fog(0x80a0e0, 50, 100);

function onMouseDown(e) {
  if (player.controls.isLocked && player.selectedCoords) {
    if (player.activeBlockId === blocks.empty.id) {


      console.log(`removing block at ${JSON.stringify(player.selectedCoords)}`)
      world.removeBlock(
        player.selectedCoords.x,
        player.selectedCoords.y,
        player.selectedCoords.z
      )
    } else {
       console.log(
         `adding block at ${JSON.stringify(player.selectedCoords)}`
       );
       world.addBlock(
         player.selectedCoords.x,
         player.selectedCoords.y,
         player.selectedCoords.z,
         player.activeBlockId
       );
    }
  }

}
document.addEventListener('mousedown', onMouseDown);

let previousTime = performance.now();
const animate = () => {
  let currentTime = performance.now();
  const deltaTime = (currentTime - previousTime) / 1000;
  requestAnimationFrame(animate);
  player.update(world);
  physics.update(deltaTime, player, world);
  lights.update(player);
  world.update(player);
  renderer.render(scene,player.controls.isLocked ? player.camera : orbitCamera);
  stats.update();

  previousTime = currentTime;
};

createUI(world, player, scene);
animate();

addEventListener("resize", () => {
  orbitCamera.aspect = window.innerWidth / window.innerHeight;
  orbitCamera.updateProjectionMatrix();
  player.camera.aspect = window.innerWidth / window.innerHeight;
  player.camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
