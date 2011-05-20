BlockType = function(t, m, s) {
	function generateCubes(material) {
		if (material == undefined) {
			alert("undefined material");
		}

		if (s == undefined) {
			s = [ BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE ]
		}
		// there are 64 possible cubes with missing face arrangements. This is
		// \sum_{i=0}^6 (6 choose i). Where (6 choose i) is the standard
		// binomial coefficient function.
		cubes = [];

		// compute all possible ways to have no faces. exactly like binary with
		// nz being the least significant bit.
		sides = {
			px : true,
			nx : true,
			py : true,
			ny : true,
			pz : true,
			nz : true
		};
		for ( var px = 0; px < 2; px++) {
			for ( var nx = 0; nx < 2; nx++) {
				for ( var py = 0; py < 2; py++) {
					for ( var ny = 0; ny < 2; ny++) {
						for ( var pz = 0; pz < 2; pz++) {
							for ( var nz = 0; nz < 2; nz++) {
								sides = {
									px : 1 - px,
									nx : 1 - nx,
									py : 1 - py,
									ny : 1 - ny,
									pz : 1 - pz,
									nz : 1 - nz
								};
								var cubeMesh = new THREE.Mesh(new THREE.Cube(s[0], s[1], s[2], 1, 1, 1, material,false, sides), new THREE.MeshFaceMaterial() );
								cubes.push(cubeMesh);
							}

						}

					}

				}

			}

		}

		return cubes;
	}

	this.type = t;
	this.cubes = generateCubes(m);
}
BlockType.prototype.constructor = BlockType;

/*
 * isType This method will test if this blockType corresponds to the input type
 * (as an integer)
 * 
 */
BlockType.prototype.isType = function(t) {
	return t == this.type;
}

/*
 * getCubeMesh Returns the correct THREE.Cube given the index
 * 
 */
BlockType.prototype.getCubeMesh = function(index) {
	if (index == 63) { // 63 is a cube that has no faces, optimization
		return undefined;
	}
	return this.cubes[index];
}