				BlockHandler = function() {
					this.blockTypes = [];
					
					defaultMaterial = [];
					for ( var i = 0; i < 6; i ++ ) {
						defaultMaterial.push( [ new THREE.MeshBasicMaterial( { color: 0xa020f0 } ) ] ); //color purple
					}
					defaultBlockType = new BlockType(-1,defaultMaterial);
					
					this.blockTypes.push(defaultBlockType);
				}
				
				BlockHandler.prototype.addType = function(blkT) {
					this.blockTypes.push(blkT);
				}
				
				BlockHandler.prototype.getCorrectGLCube = function(t, index) {
					for (var lcv = 0; lcv < this.blockTypes.length; lcv++) {
						if (this.blockTypes[lcv].isType(t)) {
							return this.blockTypes[lcv].getCubeMesh(index);
						}
					}
					
					return this.blockTypes[0].getCubeMesh(index);
				}