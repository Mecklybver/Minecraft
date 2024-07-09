import GUI from "three/examples/jsm/libs/lil-gui.module.min.js";
import { resources } from "./blocks";

export let isGuiVisible = true;

export function createUI(world, player, scene) {
  const gui = new GUI();
  const sceneFolder = gui.addFolder("Scene");
  sceneFolder.add(scene.fog, "near", 0, 100).name("Near");
  sceneFolder.add(scene.fog, "far", 100, 1000).name("Far");

  const playerFolder = gui.addFolder("Player");
  playerFolder.add(player, "maxSpeed", 1, 20).name("Max Speed");
  playerFolder.add(player.cameraHelper, "visible").name("Show Camera");
  playerFolder.add(player.boundsHelper, "visible").name("Show Player");

  const terrainFolder = gui.addFolder("Terrain");
  terrainFolder.add(world, "asyncLoading").name("Async Loading");
  terrainFolder.add(world, "drawDistance", 0, 5, 1).name("Draw Distance");
  terrainFolder.add(world.chunkSize, "width", 8, 138, 1).name("Width");
  terrainFolder.add(world.chunkSize, "height", 8, 138, 1).name("Height");
  terrainFolder.add(world.params, "seed", 0, 10000).name("Seed");
  terrainFolder.add(world.params.terrain, "scale", 10, 100).name("Scale");
  terrainFolder.add(world.params.terrain, "magnitude", 0, 1).name("Magnitude");
  terrainFolder.add(world.params.terrain, "offset", 0, 1).name("Offset");

  const resourcesFolder = gui.addFolder("Resources");

  resources.forEach((resource) => {
    const resourceFolder = resourcesFolder.addFolder(resource.name);
    resourceFolder.add(resource, "scarcity", 0, 1).name("Scarciry");

    const scaleFolder = resourceFolder.addFolder("Scale");
    scaleFolder.add(resource.scale, "x", 1, 100).name("X Scale");
    scaleFolder.add(resource.scale, "y", 1, 100).name("Y Scale");
    scaleFolder.add(resource.scale, "z", 1, 100).name("Z Scale");

    resourceFolder.close();

    gui.close();
  });

  gui.onChange(() => {
    world.generate();
  });
  // Event listener for keydown to toggle GUI visibility
  window.addEventListener("keydown", (e) => {
    if (e.key === "F1") {
      isGuiVisible = !isGuiVisible;
      gui.domElement.style.display = isGuiVisible ? "block" : "none";
      e.preventDefault(); // Prevent the default action of the F1 key (e.g., opening help)
    }
  });

  // Initial setup to hide the GUI when the function is first called
  gui.domElement.style.display = isGuiVisible ? "block" : "none";
}
