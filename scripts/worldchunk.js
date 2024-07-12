import { Group, BoxGeometry, InstancedMesh, Matrix4, Vector3 } from "three";
import { SimplexNoise } from "three/examples/jsm/Addons.js";
import { RNG } from "./rng";
import { blocks, resources } from "./blocks";

const geometry = new BoxGeometry(1, 1, 1);

export class WorldChunk extends Group {
  /**
   * @type {{
   * id: number,
   * instanceId: number
   * }[][][]}
   */
  data = [];

  params = {
    seed: 0,
    terrain: {
      scale: 30,
      magnitude: 0.2,
      offset: 0.2,
    },
  };
  constructor(size, params, dataStore) {
    super();
    this.loaded = false;
    this.size = size;
    this.params = params;
    this.dataStore = dataStore;
  }
  generate() {
    const rng = new RNG(this.params.seed);

    this.initializeTerrain();
    this.generateResources(rng);
    this.generateTerrain(rng);
    this.generateTrees(rng);
    this.generateClouds(rng);
    this.loadPlayerChanges();
    this.generateMeshes();
    this.loaded = true;
  }
  initializeTerrain() {
    this.data = [];
    for (let x = 0; x < this.size.width; x++) {
      const slice = [];
      for (let y = 0; y < this.size.height; y++) {
        const row = [];
        for (let z = 0; z < this.size.width; z++) {
          row.push({
            id: blocks.empty.id,
            instanceId: null,
          });
        }
        slice.push(row);
      }
      this.data.push(slice);
    }
  }

  generateResources(rng) {
    const simplex = new SimplexNoise(rng);
    resources.forEach((resource) => {
      for (let x = 0; x < this.size.width; x++) {
        for (let y = 0; y < this.size.height; y++) {
          for (let z = 0; z < this.size.width; z++) {
            const value = simplex.noise3d(
              (this.position.x + x) / resource.scale.x,
              (this.position.y + y) / resource.scale.y,
              (this.position.z + z) / resource.scale.z
            );
            if (value > resource.scarcity) {
              this.setBlockId(x, y, z, resource.id);
            }
          }
        }
      }
    });
  }

  generateTerrain(rng) {
    const simplex = new SimplexNoise(rng);
    for (let x = 0; x < this.size.width; x++) {
      for (let z = 0; z < this.size.width; z++) {
        const value = simplex.noise(
          (this.position.x + x) / this.params.terrain.scale,
          (this.position.z + z) / this.params.terrain.scale
        );

        const scaledNoise =
          this.params.terrain.offset + this.params.terrain.magnitude * value;

        let height = Math.floor(this.size.height * scaledNoise);

        height = Math.max(0, Math.min(height, this.size.height - 1));

        for (let y = 0; y <= this.size.height; y++) {
          if (y < height && this.getBlock(x, y, z).id === blocks.empty.id) {
            this.setBlockId(x, y, z, blocks.dirt.id);
          } else if (y === height) {
            this.setBlockId(x, y, z, blocks.grass.id);
          } else if (y > height) {
            this.setBlockId(x, y, z, blocks.empty.id);
          }
        }
      }
    }
  }

  loadPlayerChanges() {
    for (let x = 0; x < this.size.width; x++) {
      for (let y = 0; y < this.size.height; y++) {
        for (let z = 0; z < this.size.width; z++) {
          if (
            this.dataStore.contains(this.position.x, this.position.z, x, y, z)
          ) {
            const blockId = this.dataStore.get(
              this.position.x,
              this.position.z,
              x,
              y,
              z
            );
            this.setBlockId(x, y, z, blockId);
          }
        }
      }
    }
  }

  generateMeshes() {
    this.clear();

    const maxCount = this.size.width * this.size.height * this.size.width;
    const meshes = {};

    Object.values(blocks)
      .filter((blockType) => blockType.id !== blocks.empty.id)
      .forEach((blockType) => {
        const mesh = new InstancedMesh(geometry, blockType.material, maxCount);
        mesh.name = blockType.id;
        mesh.count = 0;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        meshes[blockType.id] = mesh;
      });

    const matrix = new Matrix4();
    for (let x = 0; x < this.size.width; x++) {
      for (let y = 0; y < this.size.height; y++) {
        for (let z = 0; z < this.size.width; z++) {
          const blockId = this.getBlock(x, y, z).id;
          if (blockId === blocks.empty.id) continue;
          const mesh = meshes[blockId];
          const instanceId = mesh.count;

          if (!this.isBlockObscured(x, y, z)) {
            matrix.setPosition(x, y, z);
            mesh.setMatrixAt(instanceId, matrix);
            this.setBlockInstanceId(x, y, z, instanceId);
            mesh.count++;
          }
        }
      }
    }
    this.add(...Object.values(meshes));
  }

  /**
   *
   * @param {RNG} rng
   */
  generateTrees(rng) {
    const generateTreeTrunk = (x, z, rng) => {
      const minH = this.params.trees.trunk.minHeight;
      const maxH = this.params.trees.trunk.maxHeight;
      const h = Math.round(minH + (maxH - minH) * rng.random());

      for (let y = 0; y < this.size.height; y++) {
        const block = this.getBlock(x, y, z);
        if (block && block.id === blocks.grass.id) {
          for (let treeY = 0; treeY <= y + h; treeY++) {
            this.setBlockId(x, treeY, z, blocks.tree.id);
          }
          generateTreeCanopy(x, y + h, z, rng); // Corrected: Call generateTreeCanopy here with the proper parameters
          break; // Ensure we break out of the loop once the tree trunk is generated
        }
      }
    };

    const generateTreeCanopy = (centerX, centerY, centerZ, rng) => {
      const minR = this.params.trees.canopy.minRadius;
      const maxR = this.params.trees.canopy.maxRadius;
      const r = Math.round(minR + (maxR - minR) * rng.random());

      for (let x = -r; x <= r; x++) {
        for (let y = -r; y <= r; y++) {
          for (let z = -r; z <= r; z++) {
            const n = rng.random()
            if (x * x + y * y + z * z >= r * r) continue;
            const block = this.getBlock(centerX + x, centerY + y, centerZ + z);
            if (block && block.id !== blocks.empty.id) continue;
            if (n < this.params.trees.canopy.density) {
              this.setBlockId(
                centerX + x,
                centerY + y,
                centerZ + z,
                blocks.leaves.id
              );
            }
          }
        }
      }
    };
    let offset = this.params.trees.canopy.maxRadius;
    for (let x = offset; x < this.size.width - offset; x++) {
      for (let z = offset; z < this.size.width - offset; z++) {
        if (rng.random() < this.params.trees.frequency) {
          generateTreeTrunk(x, z, rng);
        }
      }
    }
  }

  /**
   * @param {RNG} rng
   */

  generateClouds(rng) {
    const simplez = new SimplexNoise(rng);
    for (let x = 0; x < this.size.width; x++) {
      for (let z = 0; z < this.size.width; z++) {
        const value = (simplez.noise(
          (this.position.x + x) / this.params.clouds.scale,
          (this.position.z + z) / this.params.clouds.scale
        ) + 1 )* 0.5;
        if (value < this.params.clouds.density) {
          this.setBlockId(x, this.size.height - 1, z, blocks.cloud.id);
        }
      }
    }
  }

  /**
   *
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @param {number} id
   * @param {number} instanceId
   * @returns {{id:number, instanceId:number}}
   */
  getBlock(x, y, z) {
    if (this.inBounds(x, y, z)) {
      return this.data[x][y][z];
    } else {
      return null;
    }
  }

  /**
   *
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @param {number} id
   */
  setBlockId(x, y, z, id) {
    if (this.inBounds(x, y, z)) {
      this.data[x][y][z].id = id;
    }
  }

  /**
   *
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @param {number} instanceId
   */
  setBlockInstanceId(x, y, z, instanceId) {
    if (this.inBounds(x, y, z)) {
      this.data[x][y][z].instanceId = instanceId;
    }
  }

  /**
   *
   * @param {*} x
   * @param {*} y
   * @param {*} z
   * @returns {boolean}
   */
  inBounds(x, y, z) {
    if (
      x >= 0 &&
      x < this.size.width &&
      y >= 0 &&
      y < this.size.height &&
      z >= 0 &&
      z < this.size.width
    ) {
      return true;
    } else {
      return false;
    }
  }
  isBlockObscured(x, y, z) {
    const up = this.getBlock(x, y + 1, z)?.id ?? blocks.empty.id;
    const down = this.getBlock(x, y - 1, z)?.id ?? blocks.empty.id;
    const left = this.getBlock(x + 1, y, z)?.id ?? blocks.empty.id;
    const right = this.getBlock(x - 1, y, z)?.id ?? blocks.empty.id;
    const forward = this.getBlock(x, y, z + 1)?.id ?? blocks.empty.id;
    const back = this.getBlock(x, y, z - 1)?.id ?? blocks.empty.id;

    // If any of the block's sides is exposed, it is not obscured
    if (
      up === blocks.empty.id ||
      down === blocks.empty.id ||
      left === blocks.empty.id ||
      right === blocks.empty.id ||
      forward === blocks.empty.id ||
      back === blocks.empty.id
    ) {
      return false;
    } else {
      return true;
    }
  }
  disposeChildren() {
    this.traverse((obj) => {
      if (obj.dispose) obj.dispose();
    });
    this.clear();
  }

  /**
   *
   * @param {number} x
   * @param {number} y
   * @param {number} z
   */

  removeBlock(x, y, z) {
    const block = this.getBlock(x, y, z);
    if (block && block.id !== blocks.empty.id) {
      console.log(`Removing block at X:${x} Y:${y} Z:${z}`);
      this.deleteBlockInstance(x, y, z);
      this.setBlockId(x, y, z, blocks.empty.id);
      this.dataStore.set(
        this.position.x,
        this.position.z,
        x,
        y,
        z,
        blocks.empty.id
      );
    }
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @param {number} blockId
   */

  addBlock(x, y, z, blockId) {
    if (this.getBlock(x, y, z).id === blocks.empty.id) {
      this.setBlockId(x, y, z, blockId);
      this.addBlockInstance(x, y, z);
      this.dataStore.set(this.position.x, this.position.z, x, y, z, blockId);
    }
  }

  /**
   *
   * @param {number} x
   * @param {number} y
   * @param {number} z
   */
  addBlockInstance(x, y, z) {
    const block = this.getBlock(x, y, z);

    // If this block is non-empty and does not already have an instance, create a new one
    if (block && block.id !== blocks.empty.id && !block.instanceId) {
      // Append a new instance to the end of our InstancedMesh
      const mesh = this.children.find(
        (instanceMesh) => instanceMesh.name === block.id
      );
      const instanceId = mesh.count++;
      this.setBlockInstanceId(x, y, z, instanceId);

      // Update the appropriate instanced mesh
      // Also re-compute the bounding sphere so raycasting works
      const matrix = new Matrix4();
      matrix.setPosition(x, y, z);
      mesh.setMatrixAt(instanceId, matrix);
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
  }

  /**
   *
   * @param {number} x
   * @param {number} y
   * @param {number} z
   */

  deleteBlockInstance(x, y, z) {
    const block = this.getBlock(x, y, z);

    if (block.id === blocks.empty.id || !block.instanceId) return;

    // Get the mesh and instance id of the block
    const mesh = this.children.find(
      (instanceMesh) => instanceMesh.name === block.id
    );

    const instanceId = block.instanceId;

    // We can't remove an instance directly, so we swap it with the last instance
    // and decrease the count by 1. We need to do two things:
    //   1. Swap the matrix of the last instance with the matrix at `instanceId`
    //   2. Set the instanceId for the last instance to `instanceId`
    const lastMatrix = new Matrix4();
    mesh.getMatrixAt(mesh.count - 1, lastMatrix);

    // Also need to get the block coordinates of the instance
    // to update the instance id for that block
    const v = new Vector3();
    v.setFromMatrixPosition(lastMatrix);
    this.setBlockInstanceId(v.x, v.y, v.z, instanceId);

    // Swap the transformation matrices
    mesh.setMatrixAt(instanceId, lastMatrix);

    // Decrease the mesh count to "delete" the block
    mesh.count--;

    // Notify the instanced mesh we updated the instance matrix
    // Also re-compute the bounding sphere so raycasting works
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();

    this.setBlockInstanceId(x, y, z, undefined);
  }
}
