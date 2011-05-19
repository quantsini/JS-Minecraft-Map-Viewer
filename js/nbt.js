//requires util
//requires deflate

var tags = {
	'_0' : 'TAG_End',
	'_1' : 'TAG_Byte',
	'_2' : 'TAG_Short',
	'_3' : 'TAG_Int',
	'_4' : 'TAG_Long',
	'_5' : 'TAG_Float',
	'_6' : 'TAG_Double',
	'_7' : 'TAG_Byte_Array',
	'_8' : 'TAG_String',
	'_9' : 'TAG_List',
	'_10' : 'TAG_Compound'
};

function TAG(nbtreader) {

	this.reader = nbtreader;

	this.read = function() {
		this.bytes = this.reader.readBytes(this.byteCount);
		return this.decode();
	};
}

function readName() {
	var tagName = new TAG_String(this.reader);
	this.name = tagName.read();
	return this.name;
}

function TAG_End(nbtreader) {
	this.readName = function() {
		return 'END';
	};

	this.read = function() {
		return 1;
	};
}

function TAG_Unknown(nbtreader) {
	this.readName = readName;
	this.read = function() {
		return 'unknown tag type';
	};
}

function TAG_Int(nbtreader) {

	this.read = function() {
		this.bytes = nbtreader.readBytes(4);
		return this.decode();
	};

	this.decode = function() {
		return makeint(this.bytes);
	};

	this.reader = nbtreader;
}

// http://efreedom.com/Question/1-1597709/Convert-String-Hex-Representation-IEEE-754-Double-JavaScript-Numeric-Variable
// http://stackoverflow.com/users/140740/DigitalRoss

function makefloat(bytes) {
	var a = (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | (bytes[3]);
	var isNegative = bytes[0] > 127;
	var mult = 1;
	if (isNegative)
		mult = -1;

	return mult
			* ((a & 0x7fffff | 0x800000) * 1.0 / Math.pow(2, 23) * Math.pow(2,
					((a >> 23 & 0xff) - 127)));
}

function makedouble(bytes) {
	var b = (bytes[4] << 24) | (bytes[5] << 16) | (bytes[6] << 8) | (bytes[7]);
	var a = makeSigned((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8)
			| (bytes[3]));

	var isNegative = bytes[0] > 127;
	var mult = 1;
	if (isNegative)
		mult = -1;
	var e = (a >> 52 - 32 & 0x7ff) - 1023;
	return mult
			* ((a & 0xfffff | 0x100000) * 1.0 / Math.pow(2, 52 - 32)
					* Math.pow(2, e) + b * 1.0 / Math.pow(2, 52)
					* Math.pow(2, e));
}

function TAG_Float(nbtreader) {

	this.read = function() {
		this.bytes = nbtreader.readBytes(4);
		return this.decode();
	};

	this.decode = function() {
		return makefloat(this.bytes);
	};

	this.reader = nbtreader;
}

function TAG_Double(nbtreader) {

	this.read = function() {
		this.bytes = nbtreader.readBytes(8);
		return this.decode();
	};

	this.decode = function() {

		return makedouble(this.bytes);
	};

	this.reader = nbtreader;
}

function TAG_Byte(nbtreader) {

	this.read = function() {
		this.bytes = nbtreader.readBytes(1);
		return this.decode();
	};

	this.decode = function() {
		return this.bytes[0];
	};

	this.reader = nbtreader;
}

function TAG_Short(nbtreader) {

	this.read = function() {
		this.bytes = nbtreader.readBytes(2);
		return this.decode();
	};

	this.decode = function() {
		return makeshort(this.bytes);
	};
	this.byteCount = 2;
	this.reader = nbtreader;

}

function makeint(bytes) {
	var num = (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8)
			| (bytes[3]);
	num = makeSigned(num, 64);
	return num;
}

function makeshort(bytes) {
	var num = (bytes[0] << 8) | bytes[1];
	num = makeSigned(num, 16);
	return num;
}

function TAG_String(nbtreader) {

	this.read = function() {
		if (!this.reader)
			return 0;
		var shortBytes = this.reader.readBytes(2);
		this.byteCount = makeshort(shortBytes);
		if (this.byteCount === 0) {
			return "";
		} else {
			this.bytes = this.reader.readBytes(this.byteCount);

			return this.decode();
		}
	};

	this.decode = function() {
		var bytereader = new ByteReader(this.bytes);
		var translator = new Utf8Translator(bytereader);
		var str = "";
		var ch = 1;

		do {
			try {
				ch = translator.readChar();
			} catch (e) {
				break;
			}
			if (ch)
				str += ch;
		} while (ch);
		
		return str;
	};

	this.reader = nbtreader;
}

function TAG_Long(nbtreader) {
	this.read = function() {
		this.bytes = nbtreader.readBytes(8);
		return this.decode();
	};

	this.decode = function() {
		var num = (this.bytes[0] << 56) | (this.bytes[1] << 48)
				| (this.bytes[2] << 40) | (this.bytes[3] << 32)
				| (this.bytes[4] << 24) | (this.bytes[5] << 16)
				| (this.bytes[6] << 8) | (this.bytes[7]);
		num = makeSigned(num, 64);
		return num;
	};

	this.reader = nbtreader;
}

function TAG_List(nbtreader) {
	this.reader = nbtreader;

	this.read = function() {
		var type = this.reader.readBytes(1);
		var length = makeint(this.reader.readBytes(4));
		var arr = [];
		var tag = null;
		for ( var i = 0; i < length; i++) {
			tag = this.reader.read(type, '_' + i.toString());
			arr.push(tag);
		}
		return arr;
	};

	this.decode = function() {

	};
}

function TAG_Byte_Array(nbtreader) {
	this.reader = nbtreader;

	this.read = function() {
		var type = 1;
		var length = makeint(this.reader.readBytes(4));
		var tag = null;
		var ret = this.reader.data.subarray(this.reader.position,
				this.reader.position + length - 1);
		this.reader.position += length;
		
		return ret;
	};

	this.decode = function() {

	};
}

function TAG_Compound(nbtreader) {
	this.reader = nbtreader;
	var i = 0;
	this.read = function() {
		var obj = {};
		var tag = null;
		do {
			tag = this.reader.read();
			if ((tag !== null) && (typeof (tag) !== 'undefined') && !tag['END']) {
				for ( var k in tag) {
					
					obj[k] = tag[k];
				}
			}
			i++;
		} while ((tag !== null) && (typeof (tag) !== 'undefined')
				&& !tag['END'] && i < 100);
		return obj;
	};

	this.decode = function() {

	};
}

TAG_String.prototype.readName = readName;
TAG_Byte.prototype.readName = readName;
TAG_Short.prototype.readName = readName;
TAG_Int.prototype.readName = readName;
TAG_Long.prototype.readName = readName;
TAG_Compound.prototype.readName = readName;
TAG_List.prototype.readName = readName;
TAG_Float.prototype.readName = readName;
TAG_Double.prototype.readName = readName;
TAG_Byte_Array.prototype.readName = readName;

function NBTReader(data) {
	this.position = 0;
	this.data = data;
	this.read = function(typespec) {
		var type = null;
		if (!typespec) {
			type = this.readBytes(1);
			if (type.length === 0)
				return null;
		} else {
			type = typespec;
		}

		if (type instanceof Uint8Array) {
			typeStr = '_' + type[0].toString();
		} else {
			var typeStr = '_' + type.toString();
		}
		var name = tags[typeStr];


		var tag = null;

		switch (name) {
		case 'TAG_End':
			tag = new TAG_End(this);
			break;
		case 'TAG_Byte':
			tag = new TAG_Byte(this);
			break;
		case 'TAG_Short':
			tag = new TAG_Short(this);
			break;
		case 'TAG_Int':
			tag = new TAG_Int(this);
			break;
		case 'TAG_Long':
			tag = new TAG_Long(this);
			break;
		case 'TAG_Float':
			tag = new TAG_Float(this);
			break;
		case 'TAG_Double':
			tag = new TAG_Double(this);
			break;
		case 'TAG_Byte_Array':
			tag = new TAG_Byte_Array(this);
			break;
		case 'TAG_String':
			tag = new TAG_String(this);
			break;
		case 'TAG_List':
			tag = new TAG_List(this);
			break;
		case 'TAG_Compound':
			tag = new TAG_Compound(this);
			break;
		default:
			tag = new TAG_Unknown(this);
			break;
		}
		var ret = new Object();
		var name2 = '';
		if (!typespec) {
			name2 = tag.readName();
			if (name === 'TAG_Compound' && name2 === '')
				name2 = 'root';
			ret[name2] = tag.read();
		} else {
			ret = tag.read();
		}

		return ret;
	};

	this.readBytes = function(count) {
		
		var ret = new Uint8Array(count);
		var start = this.position;
		var k = 0;
		for ( var i = start; i < this.data.length & i < start + count; i++) {
			ret[k++] = this.data[i];
			this.i++;
			//this.position++;
		}
		
		this.position = this.position + count;
		return ret
	};

}
