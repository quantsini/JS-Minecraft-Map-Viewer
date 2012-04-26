function DataReader(a) {
	this.bytes = a
	this.index = 0;
	this.byteRead = 0;
	this.bitIndex = 0;
	this.endian = "big";
}

DataReader.prototype.readByte = function() {
	if (this.eof())
		return;
	var ret = this.bytes[this.index];
	this.index++;
	return ret;
}

DataReader.prototype.size = function() {
	return this.bytes.length;
}
DataReader.prototype.readBytes = function(howMany) {
	if (this.eof())
		return;
	var start = this.index;
	var ret = this.bytes.subarray(start,start+howMany);
	this.index = this.index + howMany;
	return ret;
}

DataReader.prototype.readInteger24 = function(numBytes) {

	if (this.eof())
		return;

	var howMany = 3;
	if (numBytes) {
		howMany = numBytes;
	}

	var ret = 0;
	if (this.endian == "little") {
		var origIndex = this.index;
		for ( var n = this.index + howMany - 1; n >= origIndex; n--) {
			ret = ((ret << 8) | this.bytes[n]);
			this.index++;
		}
	} else {
		for ( var n = 0; n < howMany; n++) {
			ret = ((ret << 8) | this.bytes[this.index]);
			this.index++;
		}
	}
	return ret;

}
DataReader.prototype.readInteger32 = function(numBytes) {

	if (this.eof())
		return;

	var howMany = 4; // default to a 4-byte integer
	if (numBytes) {
		howMany = numBytes;
	}

	var ret = 0;
	if (this.endian == "little") {
		var origIndex = this.index;
		for ( var n = this.index + howMany - 1; n >= origIndex; n--) {
			ret = ((ret << 8) | this.bytes[n]);
			this.index++;
		}
	} else {
		for ( var n = 0; n < howMany; n++) {
			ret = ((ret << 8) | this.bytes[this.index]);
			this.index++;
		}
	}
	return ret;

}

DataReader.prototype.seek = function(num) {
	this.index = num;
}

DataReader.prototype.eof = function() {
	return (this.index >= this.bytes.length - 1);
}