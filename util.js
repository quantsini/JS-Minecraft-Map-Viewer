Number.prototype.mod = function(n) {
  return ((this % n) + n) % n;
};

function wrapText(text, width) {
  var i = 0;
  var s = '';
  do {
    s += text.substr(i, 1);

    if ((i % width) === (width-1)) {
      s += '<br/>';
    }
    i++;
  } while (i<text.length);
  return s;
}

function decode64(input) {
     var output = "";
     var chr1, chr2, chr3 = "";
     var enc1, enc2, enc3, enc4 = "";
     var i = 0;
 
     // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
     var base64test = /[^A-Za-z0-9\+\/\=]/g;
     if (base64test.exec(input)) {
        alert("There were invalid base64 characters in the input text.\n" +
              "Valid base64 characters are A-Z, a-z, 0-9, '+', '/',and '='\n" +
              "Expect errors in decoding.");
     }
     input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
 
     do {
        enc1 = keyStr.indexOf(input.charAt(i++));
        enc2 = keyStr.indexOf(input.charAt(i++));
        enc3 = keyStr.indexOf(input.charAt(i++));
        enc4 = keyStr.indexOf(input.charAt(i++));
 
        chr1 = (enc1 << 2) | (enc2 >> 4);
        chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
        chr3 = ((enc3 & 3) << 6) | enc4;
 
        output = output + String.fromCharCode(chr1);
 
        if (enc3 != 64) {
           output = output + String.fromCharCode(chr2);
        }
        if (enc4 != 64) {
           output = output + String.fromCharCode(chr3);
        }
 
        chr1 = chr2 = chr3 = "";
        enc1 = enc2 = enc3 = enc4 = "";
 
     } while (i < input.length);
 
     return unescape(output);
}

function baseConverter(number, ob, nb) {
  if (typeof(number) === 'undefined')     
    return 0;
  number = number.toString();
  // Created 1997 by Brian Risk.  http://brianrisk.com
  number = number.toUpperCase();
  var list = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  var dec = 0;
  for (var i = 0; i <= number.length; i++) {
    dec += (list.indexOf(number.charAt(i))) * (Math.pow(ob, (number.length - i - 1)));
  }
  number = "";
  var magnitude = Math.floor((Math.log(dec)) / (Math.log(nb)));
  for (var m = magnitude; m >= 0; m--) {
    var amount = Math.floor(dec / Math.pow(nb, m));
    number = number + list.charAt(amount);
    dec -= amount * (Math.pow(nb, m));
  }
  return number;
}

//http://stackoverflow.com/questions/1240408/reading-bytes-from-javascript-string
//answer at top by Borgar (with slight modification to make part faster)
//http://borgar.net/
/*
function stringToBytes(str) {
  var ch, st, re = [];
  var ilen = str.length;
  for (var i = 0; i < ilen; i++) {
    re.push(str.charCodeAt(i) ); // get char
  }
  // return an array of bytes
  return re;
}
*/


function stringToBytes(str) {
  var ch, st, re = [];
  var ilen = str.length;
  for (var i = 0; i < ilen; i++) {
    ch = str.charCodeAt(i); // get char
    st = []; // set up "stack"
    do {
      st.push(ch & 0xFF); // push byte to stack
      ch = ch >> 8; // shift value down by 1 byte
    }
    while (ch);

    var jlen = st.length - 1;
    for (var j = jlen; j >= 0; j--) {
      re.push(st[j]);
    }
  }
  // return an array of bytes
  return re;
}

function get_ms1bit(i)
{
    var x = 0;
    var l = 0;
    for (var j = i; i && !(j == 1) && l<20000; j >>= 1) { x++; l++; }
    return i ? j <<= x: 0;
}

/*
function checkBit(value,n,bits)
{
    var value = value;
    if(value & (1<<(bits-n))) { return true; }
    else { return false; }
} */

function makeSigned(n) {
  var isNegative = get_ms1bit(n) == 128;
  if (!isNegative) {
    return n;
  } else {
    //var n2 = ~n;
    //return n2 + 1;
    return -(Math.pow(2, 8) - n);
  }
}

function ByteReader(arr) {
  this.bytes = arr;
  this.position = 0;

  this.readByte = function() {
    
    if (this.position == this.bytes.length) {
  
      return -1;
    } else {
      return this.bytes[this.position++];
    }

  }
}

function getIntAt(arr, offs) {
  return (arr[offs + 0] << 24) +
  (arr[offs + 1] << 16) +
  (arr[offs + 2] << 8) +
  arr[offs + 3];
}

