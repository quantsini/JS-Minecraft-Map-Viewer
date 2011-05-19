
var CHUNK_SIZE_X = 16;
var CHUNK_SIZE_Y = 128;
var CHUNK_SIZE_Z = 16;
var BLOCK_SIZE = 64;
var RADIUS = 5;

World = function(scene) {
	this.scene = scene;
	this.regions = new Array();
	this.blockHandler = new BlockHandler();
	this.ready = false;
	this.chunkBuffer = new Array();
	this.playerChunks = new Array();
	this.oldCoords = [null, null];
}

World.prototype.constructor = World;

/*
 * addRegion This method will add a regionfile to this world.
 */
World.prototype.addRegion = function(region) {
	this.regions.push(region);
}

/*
 * addBlockTexture This method will add the blocktype to the block handler, used
 * for getting the correct material when loading a chunk Users can define the
 * materials, and perhaps define meshes and functionality of the block
 * 
 */
World.prototype.addBlockTexture = function(blockType) {
	this.blockHandler.addType(blockType);
}

/*
 * updateWorld This method will automatically load new chunks if a player
 * crosses a chunk boundary, and remove chunks that are not within the 5x5
 * matrix centered on the player
 * 
 * TODO: Make this method more efficient at chunk loading and unloading.
 */
World.prototype.updateWorld = function(playerCoordinates) {
	var x = playerCoordinates.x;
	var y = playerCoordinates.y;
	var z = playerCoordinates.z;
	
	// chunk coordinates
	var chunkX = Math.floor(x/16);
	var chunkZ = Math.floor(z/16);
	
	// region coordinates
	var regionX = Math.floor(chunkX/32);
	var regionZ = Math.floor(chunkZ/32);
	
	// encapsulate coordinates
	var coords = "(" + x + ", " + y + ", " + z + ")";
	var chunkCoords = "(" + chunkX + ", " + chunkZ + ")";
	var regionCoords = "(" + regionX + ", " + regionZ + ")";
	
	
	// entered a new chunk
	if (this.oldCoords[0] == null || (this.oldCoords[0] != chunkX || this.oldCoords[1] != chunkZ))
	{
		this.ready = true;
	}
	
	// ready makes sure this is called only once
	if (this.ready == true) {
		this.ready = false;	
		// compute the chunks needed to be rendered
		this.playerChunks = new Array();
		
		// chunkX, chunkY
		for (var lcv = 0; lcv < RADIUS; lcv++) {
			for (var lcv1 = 0; lcv1 < RADIUS; lcv1++) {
				this.playerChunks.push({x: chunkX + (RADIUS-1)/2 - lcv, z:  chunkZ + (RADIUS-1)/2 - lcv1});
			}
		}
						
		// make this better
		if (this.chunkBuffer.length != 0) {
			newChunkBuffer = new Array();
			for (var lcv = 0; lcv < this.chunkBuffer.length; lcv++) {
				remove = true;
				for (var lcv1 = 0; lcv1 < this.playerChunks.length; lcv1++) {
					if (this.chunkBuffer[lcv].x == this.playerChunks[lcv1].x && this.chunkBuffer[lcv].z == this.playerChunks[lcv1].z) {
						newChunkBuffer.push(this.chunkBuffer[lcv]);
						remove = false;
					}
									
				}
								
				if (remove) {
					// console.log("removing chunk at " +
					// this.chunkBuffer[lcv].x + "," + this.chunkBuffer[lcv].z);
					this.scene.removeObject(this.chunkBuffer[lcv].mesh); 
					
					
					// hack - see https://github.com/mrdoob/three.js/issues/116
					var o, ol, zobject;
					object = this.chunkBuffer[lcv].mesh;
					for ( o = this.scene.__webglObjects.length - 1; o >= 0; o -- ) {
						zobject = this.scene.__webglObjects[ o ].object;
						if ( object == zobject ) {
							this.scene.__webglObjects.splice( o, 1 );
							// return;
						}
					}
					// end hack
					
				}
			}
							
			this.chunkBuffer = newChunkBuffer;
		}
		
		// render new chunks
		thisObject = this;
		$.each(this.playerChunks, function(index, item) {
			if (!(thisObject.__chunkRendered(item.x,item.z))) {
				if (thisObject.regions.length != 0) {
					thisObject.__renderChunk(item.x,item.z);
				}
			}
		});
						
	}
				
	this.oldCoords = [chunkX, chunkZ];
}

/* private methods */
// checks if chunk x,z is rendered
World.prototype.__chunkRendered = function(x,z) {
	for (var lcv = 0; lcv < this.chunkBuffer.length; lcv++) {
		if (this.chunkBuffer[lcv].x == x && this.chunkBuffer[lcv].z == z) {
			return true;
		}
	}
	return false;
}

// parses the chunk data and generates a THREE.Mesh for that chunk
World.prototype.__buildMesh = function(chunkInfo) {
	// just extract one region
	var hThreshold = -1;
	var chunkData = chunkInfo["data"];
	var chunkOffset = chunkInfo["chunkLoc"];
	var geometry = new THREE.Geometry();
	
	
	// for each coordinate
	for (var x = 0; x < CHUNK_SIZE_X; x++) {
		for (var y = 0; y < CHUNK_SIZE_Y; y++) {
			for (var z = 0; z < CHUNK_SIZE_Z; z++) {
				if (y > hThreshold) {
					// get the index for the block using the special formula
					var index = y + ( z * CHUNK_SIZE_Y + ( x * CHUNK_SIZE_Y * CHUNK_SIZE_Z ) );
					
					// the block ID for the block at (x,y,z)
					var blockID = chunkData[0][index];
					var newIndex = chunkData[1][index];
					
					// not air
					var cube = undefined;
					if (blockID != 0) {
						// get the GL cube
						
						cube = this.blockHandler.getCorrectGLCube(blockID, newIndex);
						
						// merge the cube to the geometry
						if (cube) {
							cube.position.y = y * BLOCK_SIZE;
							cube.position.x = (x + chunkOffset[0] * 16) * BLOCK_SIZE;
							cube.position.z = (z + chunkOffset[1] * 16) * BLOCK_SIZE;

							GeometryUtils.merge( geometry, cube );

						}
					}
				}
			}
		}
	}
	
	// return the geometry for this block
	return geometry;
}

// renders the chunk at global chunk location cx, cz
World.prototype.__renderChunk = function(cx,cz, tempCallback) {
	// renders this chunk at world location cx, cz
	// get the correct region for this chunk
	var regionX = Math.floor(cx/32);
	var regionZ = Math.floor(cz/32);
	var regionFile = null;
	
	// get the region the chunk resides in
	$.each(this.regions, function(index, region) {
		if (region.regionLoc.x == regionX && region.regionLoc.z == regionZ) {
			regionFile = region;
		}
	});
	
	if (regionFile != null) {
		// get the local chunk coordinates
		lcx = cx - 32*regionX;
		lcz = cz - 32*regionZ;
		rawChunk = regionFile.readChunk(lcx,lcz);
		if (rawChunk) {
			regionOffsetX = regionFile.regionLoc.x * 32;
			regionOffsetZ = regionFile.regionLoc.z * 32;
			temp = {chunkLoc: [(lcx + regionOffsetX), (lcz + regionOffsetZ)], data: rawChunk};
			
			var g = this.__buildMesh(temp);
			
			if (g) {
				mesh = new THREE.Mesh( g, new THREE.MeshFaceMaterial() );
				this.scene.addObject( mesh )
				
				this.chunkBuffer.push({x: cx, z: cz, mesh: mesh});
			}
		}
	}
}