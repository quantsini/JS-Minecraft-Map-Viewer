RegionFile = function(data, regionLoc) {
	this.regionLoc = regionLoc;
	this.offsets = new Array();
	this.reader = new DataReader(data);
	// extract header information
	for ( var lcv = 0; lcv < 1024; lcv++) {
		var k = this.reader.readInteger32();
		var offset = (k >> 8) & 0xFFFFFF;
		var length = k & 0xFF;

		this.offsets[lcv] = ( {
			sectorNumber : offset,
			numSectors : length
		});
	}
	this.ready = true;
}

RegionFile.prototype.constructor = RegionFile;

/*
 * readChunk Returns either a pair of typed arrays (a,b) of type UINT8. a
 * corresponds to the type of block at the position given by the special block
 * array formula. b corresponds to the block face index for speeding
 * computations up x, z are coordinates local to this region.
 * 
 * returns false if this chunk doesn't exist
 */
RegionFile.prototype.readChunk = function(x, z) {
	var rawChunk = this.__readNBTChunk(x, z);

	if (rawChunk) {
		var chunkNBT = new NBTReader(rawChunk);
		var chunkData = chunkNBT.read(false);
		var blocks = chunkData.root.Level.Blocks;
		var retBlocks = new Uint8Array(16 * 16 * 128);
		var retIndexes = new Uint8Array(16 * 16 * 128);
		for ( var x = 0; x < CHUNK_SIZE_X; x++) {
			for ( var y = 0; y < CHUNK_SIZE_Y; y++) {
				for ( var z = 0; z < CHUNK_SIZE_Z; z++) {
					// get the index for the block using the special formula
					var index = y
							+ (z * CHUNK_SIZE_Y + (x * CHUNK_SIZE_Y * CHUNK_SIZE_Z));

					// the block ID for the block at (x,y,z)
					var blockID = blocks[index];

					// not air
					if (blockID != 0) {
						// get the index for which the faces will be blank
						// facing those adjecent to a block
						retBlocks[index] = blockID;
						retIndexes[index] = this.__getNewBlockIndex(blocks, x,
								y, z);
					}
				}
			}
		}
		return [ retBlocks, retIndexes ];
	} else {
		return false;
	}

}

// gets the block index of a block at x,y,z relative to a chunk.
RegionFile.prototype.__getNewBlockIndex = function(chunkData, x, y, z) {
	var px, nx, py, ny, pz, nz;

	// {n,p}{x,y,z} is 1 if there is a block adjecent to it.
	nz = (z > 0 && chunkData[y
			+ ((z - 1) * CHUNK_SIZE_Y + ((x) * CHUNK_SIZE_Y * CHUNK_SIZE_Z))]) ? 1
			: 0;
	pz = (z < (CHUNK_SIZE_Z - 1) && chunkData[y
			+ ((z + 1) * CHUNK_SIZE_Y + ((x) * CHUNK_SIZE_Y * CHUNK_SIZE_Z))]) ? 1
			: 0;

	px = (x > 0 && chunkData[y
			+ ((z) * CHUNK_SIZE_Y + ((x - 1) * CHUNK_SIZE_Y * CHUNK_SIZE_Z))]) ? 1
			: 0;
	nx = (x < (CHUNK_SIZE_X - 1) && chunkData[y
			+ ((z) * CHUNK_SIZE_Y + ((x + 1) * CHUNK_SIZE_Y * CHUNK_SIZE_Z))]) ? 1
			: 0;

	ny = (y > 0 && chunkData[(y - 1)
			+ ((z) * CHUNK_SIZE_Y + ((x) * CHUNK_SIZE_Y * CHUNK_SIZE_Z))]) ? 1
			: 0;
	py = (y < (CHUNK_SIZE_Y - 1) && chunkData[(y + 1)
			+ ((z) * CHUNK_SIZE_Y + ((x) * CHUNK_SIZE_Y * CHUNK_SIZE_Z))]) ? 1
			: 0;

	// sides = { px: true, nx: true, py: true, ny: true, pz: true, nz: true };
	var newIndex = nz + 2 * pz + 2 * 2 * ny + 2 * 2 * 2 * py + 2 * 2 * 2 * 2
			* nx + 2 * 2 * 2 * 2 * 2 * px;

	return newIndex;
}

/*
 * readNBTChunk Returns an array of bytes that corresponds to the NBT payload of
 * a chunk at chunk location x, z Returns false on error. Returns null on out of
 * range
 * 
 */
RegionFile.prototype.__readNBTChunk = function(x, z) {
	if (this.ready) {
		// load a chunk
		if (x < 0 || x >= 32) {
			return null;
		}
		if (z < 0 || z >= 32) {
			return null;
		}
		var offset = this.offsets[x + z * 32];
		var sectorNumber = offset.sectorNumber;
		var numSectors = offset.numSectors;

		if (sectorNumber + numSectors > this.reader.size() * 4096) {
			return null;
		}

		if (sectorNumber === 0 && numSectors === 0) {
			return null;
		}

		this.reader.seek(sectorNumber * 4096);

		var length = this.reader.readInteger32();
		var compressionType = this.reader.readByte();
		if (compressionType === 1) {
			// GZIP
			alert("gzip is not supported");
		} else if (compressionType === 2) {
			// ZLIB

			// since we're using deflate and not ZLIB, ignore first 2 bytes, and
			// last 4 bytes
			this.reader.readByte();
			this.reader.readByte();
			compressedChunkData = this.reader.readBytes(length - 5);

			inflated = new Array();

			err = puff(inflated, compressedChunkData);
			if (err != 0) {
				return null;
			}
		}

		return inflated;
	} else {
		return false;
	}
}