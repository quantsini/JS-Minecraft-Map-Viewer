Chunk = function(rawChunkData, x, z) {
	this.rawChunkData = rawChunkData;
	this.loaded = false;
	this.sections = [];
	this.x = x;
	this.z = z;
};


Chunk.prototype.load = function() {
	if (!this.loaded) {
		var nbtData = new NBTReader(this.rawChunkData)
		var chunkData = nbtData.read(false);
		this.sections = chunkData.root.Level.Sections;
		if (chunkData.root.Level.Sections === undefined) {
			this.sections = [];
		}
		this.loaded = true;
	}
};