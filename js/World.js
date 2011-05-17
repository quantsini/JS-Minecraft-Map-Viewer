
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
 * addRegion
 * This method will add a regionfile to this world.
 */
World.prototype.addRegion = function(region) {
	this.regions.push(region);
}

/*
 * addBlockTexture
 * This method will add the blocktype to the block handler, used for getting the correct material when loading a chunk
 * Users can define the materials, and perhaps define meshes and functionality of the block
 *
 */
World.prototype.addBlockTexture = function(blockType) {
	this.blockHandler.addType(blockType);
}

/*
 * updateWorld 
 * This method will automatically load new chunks if a player crosses a chunk boundary, and remove chunks that are not
 * within the 5x5 matrix centered on the player
 * 
 */
World.prototype.updateWorld = function(playerCoordinates) {
	var x = playerCoordinates.x;
	var y = playerCoordinates.y;
	var z = playerCoordinates.z;
	var chunkX = Math.floor(x/16);
	var chunkZ = Math.floor(z/16);
	var regionX = Math.floor(chunkX/32);
	var regionZ = Math.floor(chunkZ/32);
	var coords = "(" + x + ", " + y + ", " + z + ")";
	var chunkCoords = "(" + chunkX + ", " + chunkZ + ")";
	var regionCoords = "(" + regionX + ", " + regionZ + ")";
	
	
	//entered a new chunk
	if (this.oldCoords[0] == null || (this.oldCoords[0] != chunkX || this.oldCoords[1] != chunkZ))
	{
		this.ready = true;
	}
	
	if (this.ready == true) {
		console.log("yeah");
		this.ready = false;	
		//compute the chunks needed to be rendered
		this.playerChunks = new Array();
		
		//chunkX, chunkY
		for (var lcv = 0; lcv < RADIUS; lcv++) {
			for (var lcv1 = 0; lcv1 < RADIUS; lcv1++) {
				this.playerChunks.push({x: chunkX + (RADIUS-1)/2 - lcv, z:  chunkZ + (RADIUS-1)/2 - lcv1});
			}
		}
						
		//make this better	
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
					console.log("removing chunk at " + this.chunkBuffer[lcv].x + "," + this.chunkBuffer[lcv].z);
					this.scene.removeObject(this.chunkBuffer[lcv].mesh); 
					
					//hack - see https://github.com/mrdoob/three.js/issues/116
					var o, ol, zobject;
					object = this.chunkBuffer[lcv].mesh;
					for ( o = this.scene.__webglObjects.length - 1; o >= 0; o -- ) {
						zobject = this.scene.__webglObjects[ o ].object;
						if ( object == zobject ) {
							this.scene.__webglObjects.splice( o, 1 );
							//return;
						}
					}
					//end hack
					
				}
			}
							
			this.chunkBuffer = newChunkBuffer;
		}
		
		//render new chunks		
		thisObject = this;
		$.each(this.playerChunks, function(index, item) {
			console.log("trying to render chunk at " + item.x + "," + item.z);
			if (!(thisObject.chunkRendered(item.x,item.z))) {
				if (thisObject.regions.length != 0) {
					thisObject.renderChunk(item.x,item.z);
					console.log("rendered chunk at " + item.x + "," + item.z);
				}
			}
		});
						
	}
				
	this.oldCoords = [chunkX, chunkZ];
}

/* private methods */
//checks if chunk x,z is rendered
World.prototype.chunkRendered = function(x,z) {
	for (var lcv = 0; lcv < this.chunkBuffer.length; lcv++) {
		if (this.chunkBuffer[lcv].x == x && this.chunkBuffer[lcv].z == z) {
			return true;
		}
	}
	return false;
}

//gets the block index of a block at x,y,z relative to a chunk.
World.prototype.getNewBlockIndex = function(chunkData, x,y,z) {
	var px, nx, py, ny, pz, nz;
							
	//{n,p}{x,y,z} is 1 if there is a block adjecent to it.
	nz = (z > 0 && chunkData[y + ( (z - 1) * CHUNK_SIZE_Y + ( (x) * CHUNK_SIZE_Y * CHUNK_SIZE_Z ) )]) ? 1 : 0;
	pz = (z < (CHUNK_SIZE_Z-1) && chunkData[y + ( (z + 1) * CHUNK_SIZE_Y + ( (x) * CHUNK_SIZE_Y * CHUNK_SIZE_Z ) )]) ? 1 : 0;
	
	px = (x > 0 && chunkData[y + ( (z) * CHUNK_SIZE_Y + ( (x - 1) * CHUNK_SIZE_Y * CHUNK_SIZE_Z ) )]) ? 1 : 0;
	nx = (x < (CHUNK_SIZE_X-1) && chunkData[y + ( (z) * CHUNK_SIZE_Y + ( (x + 1) * CHUNK_SIZE_Y * CHUNK_SIZE_Z ) )]) ? 1 : 0;
	
	ny = (y > 0 && chunkData[(y - 1) + ( (z) * CHUNK_SIZE_Y + ( (x) * CHUNK_SIZE_Y * CHUNK_SIZE_Z ) )]) ? 1 : 0;
	py = (y < (CHUNK_SIZE_Y-1) && chunkData[(y + 1) + ( (z) * CHUNK_SIZE_Y + ( (x) * CHUNK_SIZE_Y * CHUNK_SIZE_Z ) )]) ? 1 : 0;
	
	//sides = { px: true, nx: true, py: true, ny: true, pz: true, nz: true };
	var newIndex = nz + 2*pz + 2*2*ny + 2*2*2*py + 2*2*2*2*nx + 2*2*2*2*2*px;
		
	return newIndex;
}

//parses the chunk data and generates a THREE.Mesh for that chunk
World.prototype.parseChunk = function(chunkInfo) {
	//just extract one region
	var hThreshold = -1;
	var chunkData = chunkInfo["data"];
	var chunkOffset = chunkInfo["chunkLoc"];
	var geometry = new THREE.Geometry();
	
	//var geometry = false;
	//for each coordinate
	for (var x = 0; x < CHUNK_SIZE_X; x++) {
		for (var y = 0; y < CHUNK_SIZE_Y; y++) {
			for (var z = 0; z < CHUNK_SIZE_Z; z++) {
				if (y > hThreshold) {
					//get the index for the block using the special formula
					var index = y + ( z * CHUNK_SIZE_Y + ( x * CHUNK_SIZE_Y * CHUNK_SIZE_Z ) );
					
					//the block ID for the block at (x,y,z)
					var blockID = chunkData[index];
					
					//not air
					var cube = undefined;
					if (blockID != 0) {
						//get the index for which the faces will be blank facing those adjecent to a block
						newIndex = this.getNewBlockIndex(chunkData, x,y,z);
						
						//get the GL cube
						cube = this.blockHandler.getCorrectGLCube(blockID, newIndex);
						
						
						//merge the cube to the geometry
						if (cube != undefined) {
							cube.position.y = y*BLOCK_SIZE;
							cube.position.x = (x + chunkOffset[0] * 16) * BLOCK_SIZE;
							cube.position.z = (z + chunkOffset[1] * 16) * BLOCK_SIZE;
							if (geometry == false) {
								geometry = cube;
							}
							else
							{
								GeometryUtils.merge( geometry, cube );
							}
						}
					}
				}
			}
		}
	}
	
	//return the geometry for this block
	return geometry;
}

//renders the chunk at global chunk location cx, cz
World.prototype.renderChunk = function(cx,cz) {
	//renders this chunk at world location cx, cz
	//get the correct region for this chunk
	var regionX = Math.floor(cx/32);
	var regionZ = Math.floor(cz/32);
	var regionFile = null;
	
	$.each(this.regions, function(index, region) {
		if (region.regionLoc.x == regionX && region.regionLoc.z == regionZ) {
			regionFile = region;
		}
	});
	
	if (regionFile != null) {
		lcv = cx - 32*regionX;
		lcv1 = cz - 32*regionZ;
		rawChunk = regionFile.readNBTChunk(lcv,lcv1);
				
		if (rawChunk != null && rawChunk != false) {
			chunkNBT = new NBTReader(rawChunk);
					
			if (chunkNBT != null) {
				chunkData = chunkNBT.read(false);
				blocks = chunkData.root.Level.Blocks;
				regionOffsetX = regionFile.regionLoc.x * 32;
				regionOffsetZ = regionFile.regionLoc.z * 32;
				temp = {chunkLoc: [(lcv + regionOffsetX), (lcv1 + regionOffsetZ)], data: blocks};
				var g = this.parseChunk(temp);
				mesh = new THREE.Mesh( g, new THREE.MeshFaceMaterial() );
				this.scene.addObject( mesh );
				
				this.chunkBuffer.push({x: cx, z: cz, mesh: mesh});
			}
			else
			{
				console.log("error reading chunk NBT");
			}
		}
	}
}