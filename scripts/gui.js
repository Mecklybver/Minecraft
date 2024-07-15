import GUI from "three/examples/jsm/libs/lil-gui.module.min.js";
import { resources } from "./blocks";

export let isGuiVisible = false;

export function createUI(world, player, scene) {
  const gui = new GUI();

  const sceneFolder = gui.addFolder("Scene");
  sceneFolder.add(scene.fog, "near", 0, 100, 1).name("Fog Near");
  sceneFolder.add(scene.fog, "far", 20, 200, 1).name("Fog Far");

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
  terrainFolder
    .add(world.params.terrain, "waterHeight", 0, 20)
    .name("Water Height");

  const caveFolder = gui.addFolder("Cave");
  caveFolder.add(world.params.cave, "visible", true).name("Visible");
  caveFolder.add(world.params.cave, "scale", 1, 100).name("Scale"); // Scale for horizontal expansion
  caveFolder.add(world.params.cave, "amplitude", 0, 50).name("Amplitude"); // Adjusted for a broader range
  caveFolder.add(world.params.cave, "offset", 0, 20).name("Offset"); // Keep the offset range
  caveFolder.add(world.params.cave, "threshold", 0, 1).name("Threshold"); // Adjusted for a proper range
  caveFolder
    .add(world.params.cave, "rotation", 0, Math.PI * 2)
    .name("Rotation"); // Full rotation in radians
  caveFolder.add(world.params.cave, "density", 0, 1, 0.05).name("Density");
  caveFolder.add(world.params.cave, "bottom", 0, 20).name("Depth");

  const treeFolder = gui.addFolder("Trees");
  treeFolder.add(world.params.trees, "visible", true).name("Visible");
  treeFolder.add(world.params.trees, "frequency", 0, 0.1).name("Frequency");
  treeFolder
    .add(world.params.trees.trunk, "minHeight", 0, 10)
    .name("Min Trunk Height");
  treeFolder
    .add(world.params.trees.trunk, "maxHeight", 0, 20)
    .name("Max Trunk Height");
  treeFolder
    .add(world.params.trees.canopy, "minRadius", 0, 10)
    .name("Min Canopy Height");
  treeFolder
    .add(world.params.trees.canopy, "maxRadius", 0, 20)
    .name("Max Canopy Height");
  treeFolder
    .add(world.params.trees.canopy, "density", 0, 1, 0.05)
    .name("Canopy Density");

  const cloudFolder = gui.addFolder("Clouds");
  cloudFolder.add(world.params.clouds, "visible", true).name("Visible");

  cloudFolder.add(world.params.clouds, "density", 0, 1).name("Cloud Cover");
  cloudFolder.add(world.params.clouds, "scale", 0, 100).name("Cloud Size");

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
