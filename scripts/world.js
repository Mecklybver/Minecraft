import { Group } from "three";
import { WorldChunk } from "./worldchunk";

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
      scale: 30,
      magnitude: 0.2,
      offset: 0.2,
    },
  };

  constructor(seed = 0) {
    super();
  }

  generate() {
    this.disposeChunks();
    for (let x = -1; x <= 1; x++) {
      for (let z = -1; z <= 1; z++) {
        const chunk = new WorldChunk(this.chunkSize, this.params);
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
    const coords = this.worldToChunksCoords(
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
    const chunk = new WorldChunk(this.chunkSize, this.params);
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
    const coords = this.worldToChunksCoords(x, y, z);
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

  worldToChunksCoords(x, y, z) {
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
}
