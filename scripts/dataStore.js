export class DataStore{
    constructor() {
        this.data={}
    }

    clear() {
        this.data = {}
    }

    contains(chunkX, chunkY, blockX, blockY, blockZ) {
        const key = this.getKey(chunkX, chunkY, blockX, blockY, blockZ)
        return this.data[key] !== undefined
    }

    get (chunkX, chunkY, blockX, blockY, blockZ) {
        const key = this.getKey(chunkX, chunkY, blockX, blockY, blockZ)
        const blockId = this.data[key]
        console.log(`get ${key} to ${blockId}`)
        return blockId
    }

    set(chunkX, chunkY, blockX, blockY, blockZ, blockId) {
        const key = this.getKey(chunkX, chunkY, blockX, blockY, blockZ)
        this.data[key] = blockId
        console.log(`set ${key} to ${blockId}`)

    }

    getKey(chunkX, chunkY, blockX, blockY, blockZ) {
        return `${chunkX}-${chunkY}-${blockX}-${blockY}-${blockZ}`

    }
}