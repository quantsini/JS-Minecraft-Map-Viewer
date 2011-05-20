RegionFile = function(data, regionLoc) {
	this.multiThreaded = true;
	this.regionLoc = regionLoc;
	this.offsets = new Uint32Array(1024);
	this.reader = new DataReader(data);
	this.data = data;
	// extract header information
	for ( var lcv = 0; lcv < 1024; lcv++) {
		var k = this.reader.readInteger32();

		this.offsets[lcv] = k;
	}
	
	//each regionfile has it's own worker thread to read chunks. up to 4 total region threads can be operating at a time.
	this.worker = new Worker('js/readchunk.js');
}

/*
 * setCall sets the callback function for when a chunk is read into memory
 */
RegionFile.prototype.setCall = function(f) {
	this.callback = f;
	var thisObject = this;
	this.worker.onmessage = function(event) {
		if (event.data.type) {
			//console.log(event.data.data);
		} else {
			if (thisObject.callback) {
				var blocks = event.data.blocks;
				var cx = event.data.cx;
				var cz = event.data.cz;
				thisObject.callback(blocks,cx,cz);
			}
			else
			{
				console.log("wtf");
			}
		}
	}
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
RegionFile.prototype.readChunk = function(x, z, cx, cz) {
	if (this.multiThreaded) {
	this.worker.postMessage( {
		d : this.data,
		x : x,
		z : z,
		o : this.offsets,
		cx : cx,
		cz : cz
	});
	
	return false;
	}
	else {
	var rawChunk = this.__readNBTChunk(x, z);

	if (rawChunk) {
		var chunkNBT = new NBTReader(rawChunk);
		var chunkData = chunkNBT.read(false);
		var blocks = chunkData.root.Level.Blocks;
		var retBlocks = new Uint8Array(16 * 16 * 128);

		for ( var x = 0; x < CHUNK_SIZE_X; x++) {
			for ( var y = 0; y < CHUNK_SIZE_Y; y++) {
				for ( var z = 0; z < CHUNK_SIZE_Z; z++) {
					// get the index for
					// the block using
					// the special
					// formula
					var index = y
							+ (z * CHUNK_SIZE_Y + (x * CHUNK_SIZE_Y * CHUNK_SIZE_Z));
					// the
					// block
					// ID
					// for
					// the
					// block
					// at
					// (x,y,z)
					var blockID = blocks[index]; // not air
					if (blockID != 0) {
						// get the index for which the faces will be blank
						// facing those adjecent to a block
						retBlocks[index] = blockID;
					}
				}
			}
		}
		return retBlocks
	} else {
		return false;
	}
	}
}

/*
 * readNBTChunk Returns an array of bytes that corresponds to the NBT payload of
 * a chunk at chunk location x, z Returns false on error. Returns null on out of
 * range
 * 
 */
RegionFile.prototype.__readNBTChunk = function(x, z) {
	// load a chunk
	if (x < 0 || x >= 32) {
		return null;
	}
	if (z < 0 || z >= 32) {
		return null;
	}
	var offset = this.offsets[x + z * 32];
	var sectorNumber = (offset >> 8) & 0xFFFFFF;
	var numSectors = offset & 0xFF;

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

		/*
		 * FIND A BETTER INFLATE ALGORITHM THAT WORKS WITH NATIVE Uint8Arrays
		 */
		inflated = new Array(); // puff only can accept regular
		// arrays,
		err = puff(inflated, compressedChunkData);

		if (err != 0) {
			console.log("err puffing " + err);
			return null;
		}

		inflated = new Uint8Array(inflated);
	}

	return inflated;
}