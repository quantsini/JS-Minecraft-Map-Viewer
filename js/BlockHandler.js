BlockHandler = function() {
	this.blockTypes = [];

	defaultMaterial = [];
	for ( var i = 0; i < 6; i++) {
		defaultMaterial.push( [ new THREE.MeshBasicMaterial( {
			color : 0xa020f0
		}) ]); // color purple
	}
	defaultBlockType = new BlockType(-1, defaultMaterial);

	this.blockTypes.push(defaultBlockType);
}

/*
 * addType This will add the block type to this handler
 * 
 */
BlockHandler.prototype.addType = function(blkT) {
	this.blockTypes.push(blkT);
}

/*
 * getCorrectGLCube Gets the THREE.Cube that corresponds to the correct index.
 * Index is the cube index depending on which faces are missing. See BlockType
 */
BlockHandler.prototype.getCorrectGLCube = function(t, index) {
	for ( var lcv = 0; lcv < this.blockTypes.length; lcv++) {
		if (this.blockTypes[lcv].isType(t)) {
			return this.blockTypes[lcv].getCubeMesh(index);
		}
	}

	return this.blockTypes[0].getCubeMesh(index);
}