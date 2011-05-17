RegionFile = function(data, regionLoc) {
			this.regionLoc = regionLoc;
			this.offsets = new Array();
			this.reader = new DataReader(data);
			//extract header information
			for (var lcv = 0; lcv < 1024; lcv++) {
				var k = this.reader.readInteger32();
				var offset = (k >> 8) & 0xFFFFFF;
				var length = k & 0xFF;
				
				this.offsets[lcv] = ({sectorNumber: offset, numSectors: length});
			}
			this.ready = true;
}

RegionFile.prototype.constructor = RegionFile;

/*
 * readNBTChunk
 * Returns an array of bytes that corresponds to the NBT payload of a chunk at chunk location x, z
 * Returns false on error. Returns null on out of range
 *
 */
RegionFile.prototype.readNBTChunk = function (x, z) {
		if (this.ready) {
			//load a chunk
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
				//GZIP
				alert("gzip is not supported");
			} else if (compressionType === 2) {
				//ZLIB
				
				//since we're using deflate and not ZLIB, ignore first 2 bytes, and last 4 bytes
				this.reader.readByte();
				this.reader.readByte();
				compressedChunkData = this.reader.readBytes(length-5);
				
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