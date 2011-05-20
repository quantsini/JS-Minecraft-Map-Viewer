importScripts("util.js", "DataReader.js", "deflate.js", "inflate.js", "nbt.js");


var CHUNK_SIZE_X = 16;
var CHUNK_SIZE_Y = 128;
var CHUNK_SIZE_Z = 16;
var BLOCK_SIZE = 64;
var RADIUS = 5;

this.onmessage = function(event) {
	this.data = event.data.d;
	this.reader = new DataReader(this.data);
	debug(this.reader);
	this.offsets = event.data.o;
	var x = event.data.x;
	var z = event.data.z;
	
	var ret = readChunk(x,z);
	postMessage({blocks: ret, cx: event.data.cx, cz: event.data.cz});
}

debug = function(s) {
	this.postMessage({type: "debug", data: s});
}

readChunk = function(x, z) {
	/*
	 * worker = new Worker('readchunk.js'); worker.onmessage = function(event) {
	 * callback(event.data); } worker.postMessage({r: reader, x: x, z: z});
	 * 
	 */
	var rawChunk = this.__readNBTChunk(x, z);

	if (rawChunk) {
		var chunkNBT = new NBTReader(rawChunk);
		var chunkData = chunkNBT.read(false);
		var blocks = chunkData.root.Level.Blocks;
		var retBlocks = new Uint8Array(16 * 16 * 128);

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
					}
				}
			}
		}
		return retBlocks
	} else {
		return false;
	}

}



/*
 * readNBTChunk Returns an array of bytes that corresponds to the NBT payload of
 * a chunk at chunk location x, z Returns false on error. Returns null on out of
 * range
 * 
 */
__readNBTChunk = function(x, z) {
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