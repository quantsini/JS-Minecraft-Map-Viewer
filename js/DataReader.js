function byteToBitArray(b) {
	
	var ret = new Array();
	for (var i = 0; i < 8; i++) {
		ret[i] = (((b & Math.pow(2, 7-i)) == Math.pow(2, 7-i)) ? 1 : 0 );
	}
	return ret;
	
}

function bitArrayToByte(ba) {
	
	var ret = 0;
	for (var i = 0; i < ba.length; i++) {
		ret += (ba[i] * Math.pow(2, ba.length-i-1));
	}
	return ret;
	
}

function bitArrayToNumber(ba) {
	
	var ret = 0;
	for (var i = 0; i < ba.length; i++) {
		ret += (ba[i] * Math.pow(2, ba.length-i-1));
	}
	return ret;
	
}

function BitReader(ba) {
	
	this.byteArray = ba;
	this.byteArrayIndex = 0;
	this.byteRead = 0;
	this.index = 0;
	
}


BitReader.prototype.readBits = function(howMany) {
	
	var ret = new Array();
	for (var b = 0; b < howMany && this.byteArrayIndex < this.byteArray.length; b++) {
		if (this.index == 0) {
			this.byteRead = byteToBitArray(this.byteArray[this.byteArrayIndex]);
			this.byteArrayIndex++;
		}
		ret.push(this.byteRead.shift());
		this.index = (this.index + 1) % 8;
	}
	return ret;
	
}

BitReader.prototype.skipBits = function(howMany) {
	for (var b = 0; b < howMany && this.byteArrayIndex < this.byteArray.length; b++) {
		if (this.index == 0) {
			this.byteRead = byteToBitArray(this.byteArray[this.byteArrayIndex]);
			this.byteArrayIndex++;
		}
		this.byteRead.shift();
		this.index = (this.index + 1) % 8;
	}
}

BitReader.prototype.skipBytes = function(howMany) {
	this.skipBits(howMany * 8);
}

BitReader.prototype.skipToByteBoundry = function() {
	this.skipBits(8 - this.index);
}

BitReader.prototype.readByte = function() {
	var ret = 0;
	if (this.index == 0) {
		ret = this.byteArray[this.byteArrayIndex];
		this.byteArrayIndex++;
	} else {
		ret = bitArrayToByte(this.readBits(8));
	}
	return ret;
}

BitReader.prototype.readBytes = function(howMany) {
	
	var ret = new Array();
	if (this.index == 0) {
		ret = this.byteArray.slice(this.byteArrayIndex, this.byteArrayIndex + howMany);
		this.byteArrayIndex += howMany;
	} else {
		for (var i = 0; i < howMany; i++) {
			ret.push(bitArrayToByte(this.readBits(8)));
		}
	}
	return ret;
	
}



function DataReader(a) {
	
	this.bytes = a;
	this.index = 0;
	this.byteRead = 0;
	this.bitIndex = 0;
	this.endian = "big";
	
}

DataReader.prototype.readByte = function() {
	if (this.eof()) return;
	var ret = this.bytes.charCodeAt(this.index);
	this.index++;
	return ret;
}

DataReader.prototype.size = function() {
	return this.bytes.length;
}
DataReader.prototype.readBytes = function(howMany) {
	if (this.eof()) return;
	var ret = new Array();
	for (var i = 0; i < howMany; i++) {
		ret.push(this.readByte());
	}
	return ret;
}


DataReader.prototype.readInteger24 = function(numBytes) {
	
	if (this.eof()) return;
	
	var howMany = 3; // default to a 4-byte integer
	if (numBytes) {
		howMany = numBytes;
	}
	
	var ret = 0;
	if (this.endian == "little") {
		var origIndex = this.index;
		for (var n = this.index + howMany - 1; n >= origIndex; n--) {
			ret = ((ret << 8) | this.bytes.charCodeAt(n));
			this.index++;
		}
	} else {
		for (var n = 0; n < howMany; n++) {
			ret = ((ret << 8) | this.bytes.charCodeAt(this.index));
			this.index++;
		}
	}
	return ret;
	
}
DataReader.prototype.readInteger32 = function(numBytes) {
	
	if (this.eof()) return;
	
	var howMany = 4; // default to a 4-byte integer
	if (numBytes) {
		howMany = numBytes;
	}
	
	var ret = 0;
	if (this.endian == "little") {
		var origIndex = this.index;
		for (var n = this.index + howMany - 1; n >= origIndex; n--) {
			ret = ((ret << 8) | this.bytes.charCodeAt(n));
			this.index++;
		}
	} else {
		for (var n = 0; n < howMany; n++) {
			ret = ((ret << 8) | this.bytes.charCodeAt(this.index));
			this.index++;
		}
	}
	return ret;
	
}

DataReader.prototype.readString = function(len) {
	if (!len || this.eof()) return;
	var ret = this.bytes.substring(this.index, this.index + len);
	this.index += len;
	return ret;
}

DataReader.prototype.readNullTerminatedString = function() {
	if (this.eof()) return;
	var slen = 0;
	var n = this.index;
	var finished = false;
	while (!finished && n <= this.bytes.length) {
		var c = this.bytes.charCodeAt(n);
		if (c == 0) {
			finished = true;
		}
		slen++;
		n++;
	}
	var ret = this.bytes.substring(this.index, this.index + (slen - 1));
	this.index += slen;
	return ret;
	
}

DataReader.prototype.seek = function(num) {
	this.index = num;
}

DataReader.prototype.eof = function() {
	return (this.index >= this.bytes.length - 1);
}