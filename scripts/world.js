import { Group } from "three";
import { WorldChunk } from "./worldchunk";
import { DataStore } from "./dataStore";
import { RNG } from "./rng";

export class World extends Group {
  drawDistance = 1;
  gap = 0;
  asyncLoading = true;
  chunkSize = {
    width: 32,
    height: 32,
  };
  params = {
    seed: 0,
    terrain: {
      scale: 80,
      magnitude: 0.2,
      offset: 0.2,
    },
    trees: {
      trunk: {
        minHeight: 4,
        maxHeight: 7,
      },
      canopy: {
        minRadius: 2,
        maxRadius: 4,
        density: 0.5,
      },
      frequency: 0.01,
    },
    clouds: {
      scale: 30,
      density: 0.5,
    },
  };
  dataStore = new DataStore();

  constructor(seed = 0) {
    super();
  }

  generate() {
    this.dataStore.clear();
    this.disposeChunks();
    for (let x = -1; x <= 1; x++) {
      for (let z = -1; z <= 1; z++) {
        const chunk = new WorldChunk(
          this.chunkSize,
          this.params,
          this.dataStore
        );
        chunk.position.set(
          x * (this.chunkSize.width + this.gap),
          0,
          z * (this.chunkSize.width + this.gap)
        );
        chunk.userData = { x, z };
        chunk.generate();
        this.add(chunk);
      }
    }
  }

  /**
   * @param {Player} player
   */

  update(player) {
    const visibleChunks = this.getVisibleChunks(player);
    const chunksToAdd = this.getChunksToAdd(visibleChunks);
    this.removeUnusedChunks(visibleChunks);

    for (const chunk of chunksToAdd) {
      this.generateChunk(chunk.x, chunk.z);
    }
  }

  /**
   * @param {Player}  player
   * @returns {{x: number, z:number}[]}
   */

  getVisibleChunks(player) {
    const coords = this.worldToChunkCoords(
      player.position.x,
      0,
      player.position.z
    );

    const visibleChunks = [];
    for (
      let x = coords.chunk.x - this.drawDistance;
      x <= coords.chunk.x + this.drawDistance;
      x++
    ) {
      for (
        let z = coords.chunk.z - this.drawDistance;
        z <= coords.chunk.z + this.drawDistance;
        z++
      ) {
        visibleChunks.push({ x, z });
      }
    }

    return visibleChunks;
  }

  /**
   *
   * @param {{x: number, z:number}[]} visibleChunks
   * @returns {{x:number , z: number}[]}
   */

  getChunksToAdd(visibleChunks) {
    // Filter down visible chunks, removing ones that already exist
    return visibleChunks.filter((chunkToAdd) => {
      const chunkExists = this.children
        .map((obj) => obj.userData)
        .find(({ x, z }) => {
          return chunkToAdd.x === x && chunkToAdd.z === z;
        });

      return !chunkExists;
    });
  }

  /**
   * @param {{ x: number, z: number }[]} visibleChunks
   */

  removeUnusedChunks(visibleChunks) {
    // Filter current chunks, getting ones that don't exist in visible chunks
    const chunksToRemove = this.children.filter((obj) => {
      const { x, z } = obj.userData;
      const chunkExists = visibleChunks.find((visibleChunk) => {
        return visibleChunk.x === x && visibleChunk.z === z;
      });

      return !chunkExists;
    });

    for (const chunk of chunksToRemove) {
      chunk.disposeChildren();
      this.remove(chunk);
      // console.log(`Removed chunk at X: ${chunk.userData.x} Z: ${chunk.userData.z}`);
    }
  }

  /**
   *
   * @param {number} x
   * @param {number} z
   */
  generateChunk(x, z) {
    const chunk = new WorldChunk(this.chunkSize, this.params, this.dataStore);
    chunk.position.set(
      x * (this.chunkSize.width + this.gap),
      0,
      z * (this.chunkSize.width + this.gap)
    );
    chunk.userData = { x, z };

    if (this.asyncLoading) {
      requestIdleCallback(chunk.generate.bind(chunk), { timeout: 1000 });
    } else {
      chunk.generate();
    }
    this.add(chunk);
    // console.log(`Added chunk at X: ${x} Z: ${z}`);
  }
  /**
   *
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns {{id:number, instanceId:number} | null}
   */

  getBlock(x, y, z) {
    const coords = this.worldToChunkCoords(x, y, z);
    const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);
    if (chunk && chunk.loaded) {
      return chunk.getBlock(coords.block.x, coords.block.y, coords.block.z);
    } else {
      return null;
    }
  }

  /**
   *
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns {{
   *  chunk : {
   *    x: number,
   *    z: number,},
   * block: {
   *  x: number,
   *  y: number,
   *  z: number,}}
   * }
   */

  worldToChunkCoords(x, y, z) {
    const chunkCoords = {
      x: Math.floor(x / this.chunkSize.width),
      z: Math.floor(z / this.chunkSize.width),
    };
    const blockCoords = {
      x: x - this.chunkSize.width * chunkCoords.x,
      y,
      z: z - this.chunkSize.width * chunkCoords.z,
    };
    return {
      chunk: chunkCoords,
      block: blockCoords,
    };
  }

  /**
   *
   * @param {number} chunkX
   * @param {number} chunkZ
   * @returns {WorldChunk | null}
   */

  getChunk(chunkX, chunkZ) {
    return this.children.find((chunk) => {
      return chunk.userData.x === chunkX && chunk.userData.z === chunkZ;
    });
  }

  disposeChunks() {
    this.traverse((chunk) => {
      if (chunk.disposeInstances) {
        chunk.disposeInstances();
      }
    });
    this.clear();
  }

  /**
   * Removes the block at (x, y, z) and sets it to empty
   * @param {number} x
   * @param {number} y
   * @param {number} z
   */
  removeBlock(x, y, z) {
    const coords = this.worldToChunkCoords(x, y, z);
    const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);

    if (chunk) {
      chunk.removeBlock(coords.block.x, coords.block.y, coords.block.z);

      // Reveal any adjacent blocks that may have been exposed after the block at (x,y,z) was removed
      this.revealBlock(x - 1, y, z);
      this.revealBlock(x + 1, y, z);
      this.revealBlock(x, y - 1, z);
      this.revealBlock(x, y + 1, z);
      this.revealBlock(x, y, z - 1);
      this.revealBlock(x, y, z + 1);
    }
  }

  /**
   *
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @param {number} blockId
   */
  addBlock(x, y, z, blockId) {
    const coords = this.worldToChunkCoords(x, y, z);
    const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);

    if (chunk) {
      chunk.addBlock(coords.block.x, coords.block.y, coords.block.z, blockId);
      // Reveal any adjacent blocks that may have been exposed after the block at (x,y,z) was removed
      this.hideBlock(x - 1, y, z);
      this.hideBlock(x + 1, y, z);
      this.hideBlock(x, y - 1, z);
      this.hideBlock(x, y + 1, z);
      this.hideBlock(x, y, z - 1);
      this.hideBlock(x, y, z + 1);
    }
  }

  /**
   *
   * @param {number} x
   * @param {number} y
   * @param {number} z
   */

  revealBlock(x, y, z) {
    const coords = this.worldToChunkCoords(x, y, z);
    const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);

    if (chunk) {
      chunk.addBlockInstance(coords.block.x, coords.block.y, coords.block.z);
    }
  }
  /**
   *
   * @param {number} x
   * @param {number} y
   * @param {number} z
   */

  hideBlock(x, y, z) {
    const coords = this.worldToChunkCoords(x, y, z);
    const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);

    // Remove the block instance if it is totally obscured
    if (
      chunk &&
      chunk.isBlockObscured(coords.block.x, coords.block.y, coords.block.z)
    ) {
      chunk.deleteBlockInstance(coords.block.x, coords.block.y, coords.block.z);
    }
  }
}
