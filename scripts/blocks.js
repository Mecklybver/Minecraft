import {
  MeshLambertMaterial,
  NearestFilter,
  SRGBColorSpace,
  TextureLoader,
} from "three";

const textureLoader = new TextureLoader();

function loadTexture(path) {
  const texture = textureLoader.load(path);
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = NearestFilter;
  texture.magFilter = NearestFilter;
  return texture;
}

const textures = {
  grass: loadTexture("textures/grass.png"),
  grassSide: loadTexture("textures/grass_side.png"),
  dirt: loadTexture("textures/dirt.png"),
  stone: loadTexture("textures/stone.png"),
  coalOre: loadTexture("textures/coal_ore.png"),
  ironOre: loadTexture("textures/iron_ore.png"),
};

export const blocks = {
  empty: {
    id: 0,
    name: "empty",
  },
  grass: {
    id: 1,
    name: "grass",
    color: 0x559020,
    material: [
      new MeshLambertMaterial({ map: textures.grassSide }),
      new MeshLambertMaterial({ map: textures.grassSide }),
      new MeshLambertMaterial({ map: textures.grass }),
      new MeshLambertMaterial({ map: textures.dirt }),
      new MeshLambertMaterial({ map: textures.grassSide }),
      new MeshLambertMaterial({ map: textures.grassSide }),
    ],
  },
  dirt: {
    id: 2,
    name: "dirt",
    color: 0x807020,
    material: new MeshLambertMaterial({ map: textures.dirt }),
  },
  stone: {
    id: 3,
    name: "stone",
    color: 0x808080,
    material: new MeshLambertMaterial({ map: textures.stone }),
    scale: {
      x: 30,
      y: 30,
      z: 30,
    },
    scarcity: 0.5,
  },
  coalOre: {
    id: 4,
    name: "coalOre",
    color: 0x202020,
    material: new MeshLambertMaterial({ map: textures.coalOre }),
    scale: {
      x: 20,
      y: 20,
      z: 20,
    },
    scarcity: 0.8,
  },
  ironOre: {
    id: 5,
    name: "ironOre",
    color: 0x806060,
    material: new MeshLambertMaterial({ map: textures.ironOre }),
    scale: {
      x: 60,
      y: 60,
      z: 60,
    },
    scarcity: 0.9,
  },
};

export const resources = [blocks.stone, blocks.coalOre, blocks.ironOre];
