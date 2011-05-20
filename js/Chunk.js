function Chunk(chunkData, chunkX, chunkY, regionFile) {
	this.chunkData = chunkData;
	this.chunkX = chunkX;
	this.chunkY = chunkY;
	this.regionFile = regionFile;
}

Chunk.prototype.constructor = Chunk;
