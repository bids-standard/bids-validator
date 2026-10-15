var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __knownSymbol = (name, symbol) => (symbol = Symbol[name]) ? symbol : Symbol.for("Symbol." + name);
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __using = (stack, value, async) => {
  if (value != null) {
    if (typeof value !== "object" && typeof value !== "function") __typeError("Object expected");
    var dispose, inner;
    if (async) dispose = value[__knownSymbol("asyncDispose")];
    if (dispose === void 0) {
      dispose = value[__knownSymbol("dispose")];
      if (async) inner = dispose;
    }
    if (typeof dispose !== "function") __typeError("Object not disposable");
    if (inner) dispose = function() {
      try {
        inner.call(this);
      } catch (e) {
        return Promise.reject(e);
      }
    };
    stack.push([async, dispose, value]);
  } else if (async) {
    stack.push([async]);
  }
  return value;
};
var __callDispose = (stack, error, hasError) => {
  var E = typeof SuppressedError === "function" ? SuppressedError : function(e, s, m, _) {
    return _ = Error(m), _.name = "SuppressedError", _.error = e, _.suppressed = s, _;
  };
  var fail = (e) => error = hasError ? new E(e, error, "An error was suppressed during disposal") : (hasError = true, e);
  var next = (it) => {
    while (it = stack.pop()) {
      try {
        var result = it[1] && it[1].call(it[2]);
        if (it[0]) return Promise.resolve(result).then(next, (e) => (fail(e), next()));
      } catch (e) {
        fail(e);
      }
    }
    if (hasError) throw error;
  };
  return next();
};

// node-modules-polyfills:node:buffer
function dew$2() {
  if (_dewExec$2) return exports$2;
  _dewExec$2 = true;
  exports$2.byteLength = byteLength;
  exports$2.toByteArray = toByteArray;
  exports$2.fromByteArray = fromByteArray;
  var lookup = [];
  var revLookup = [];
  var Arr = typeof Uint8Array !== "undefined" ? Uint8Array : Array;
  var code = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  for (var i = 0, len = code.length; i < len; ++i) {
    lookup[i] = code[i];
    revLookup[code.charCodeAt(i)] = i;
  }
  revLookup["-".charCodeAt(0)] = 62;
  revLookup["_".charCodeAt(0)] = 63;
  function getLens(b64) {
    var len2 = b64.length;
    if (len2 % 4 > 0) {
      throw new Error("Invalid string. Length must be a multiple of 4");
    }
    var validLen = b64.indexOf("=");
    if (validLen === -1) validLen = len2;
    var placeHoldersLen = validLen === len2 ? 0 : 4 - validLen % 4;
    return [validLen, placeHoldersLen];
  }
  function byteLength(b64) {
    var lens = getLens(b64);
    var validLen = lens[0];
    var placeHoldersLen = lens[1];
    return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
  }
  function _byteLength(b64, validLen, placeHoldersLen) {
    return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
  }
  function toByteArray(b64) {
    var tmp;
    var lens = getLens(b64);
    var validLen = lens[0];
    var placeHoldersLen = lens[1];
    var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen));
    var curByte = 0;
    var len2 = placeHoldersLen > 0 ? validLen - 4 : validLen;
    var i2;
    for (i2 = 0; i2 < len2; i2 += 4) {
      tmp = revLookup[b64.charCodeAt(i2)] << 18 | revLookup[b64.charCodeAt(i2 + 1)] << 12 | revLookup[b64.charCodeAt(i2 + 2)] << 6 | revLookup[b64.charCodeAt(i2 + 3)];
      arr[curByte++] = tmp >> 16 & 255;
      arr[curByte++] = tmp >> 8 & 255;
      arr[curByte++] = tmp & 255;
    }
    if (placeHoldersLen === 2) {
      tmp = revLookup[b64.charCodeAt(i2)] << 2 | revLookup[b64.charCodeAt(i2 + 1)] >> 4;
      arr[curByte++] = tmp & 255;
    }
    if (placeHoldersLen === 1) {
      tmp = revLookup[b64.charCodeAt(i2)] << 10 | revLookup[b64.charCodeAt(i2 + 1)] << 4 | revLookup[b64.charCodeAt(i2 + 2)] >> 2;
      arr[curByte++] = tmp >> 8 & 255;
      arr[curByte++] = tmp & 255;
    }
    return arr;
  }
  function tripletToBase64(num) {
    return lookup[num >> 18 & 63] + lookup[num >> 12 & 63] + lookup[num >> 6 & 63] + lookup[num & 63];
  }
  function encodeChunk(uint8, start, end) {
    var tmp;
    var output = [];
    for (var i2 = start; i2 < end; i2 += 3) {
      tmp = (uint8[i2] << 16 & 16711680) + (uint8[i2 + 1] << 8 & 65280) + (uint8[i2 + 2] & 255);
      output.push(tripletToBase64(tmp));
    }
    return output.join("");
  }
  function fromByteArray(uint8) {
    var tmp;
    var len2 = uint8.length;
    var extraBytes = len2 % 3;
    var parts = [];
    var maxChunkLength = 16383;
    for (var i2 = 0, len22 = len2 - extraBytes; i2 < len22; i2 += maxChunkLength) {
      parts.push(encodeChunk(uint8, i2, i2 + maxChunkLength > len22 ? len22 : i2 + maxChunkLength));
    }
    if (extraBytes === 1) {
      tmp = uint8[len2 - 1];
      parts.push(lookup[tmp >> 2] + lookup[tmp << 4 & 63] + "==");
    } else if (extraBytes === 2) {
      tmp = (uint8[len2 - 2] << 8) + uint8[len2 - 1];
      parts.push(lookup[tmp >> 10] + lookup[tmp >> 4 & 63] + lookup[tmp << 2 & 63] + "=");
    }
    return parts.join("");
  }
  return exports$2;
}
function dew$1() {
  if (_dewExec$1) return exports$1;
  _dewExec$1 = true;
  exports$1.read = function(buffer, offset, isLE, mLen, nBytes) {
    var e, m;
    var eLen = nBytes * 8 - mLen - 1;
    var eMax = (1 << eLen) - 1;
    var eBias = eMax >> 1;
    var nBits = -7;
    var i = isLE ? nBytes - 1 : 0;
    var d = isLE ? -1 : 1;
    var s = buffer[offset + i];
    i += d;
    e = s & (1 << -nBits) - 1;
    s >>= -nBits;
    nBits += eLen;
    for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {
    }
    m = e & (1 << -nBits) - 1;
    e >>= -nBits;
    nBits += mLen;
    for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {
    }
    if (e === 0) {
      e = 1 - eBias;
    } else if (e === eMax) {
      return m ? NaN : (s ? -1 : 1) * Infinity;
    } else {
      m = m + Math.pow(2, mLen);
      e = e - eBias;
    }
    return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
  };
  exports$1.write = function(buffer, value, offset, isLE, mLen, nBytes) {
    var e, m, c;
    var eLen = nBytes * 8 - mLen - 1;
    var eMax = (1 << eLen) - 1;
    var eBias = eMax >> 1;
    var rt = mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0;
    var i = isLE ? 0 : nBytes - 1;
    var d = isLE ? 1 : -1;
    var s = value < 0 || value === 0 && 1 / value < 0 ? 1 : 0;
    value = Math.abs(value);
    if (isNaN(value) || value === Infinity) {
      m = isNaN(value) ? 1 : 0;
      e = eMax;
    } else {
      e = Math.floor(Math.log(value) / Math.LN2);
      if (value * (c = Math.pow(2, -e)) < 1) {
        e--;
        c *= 2;
      }
      if (e + eBias >= 1) {
        value += rt / c;
      } else {
        value += rt * Math.pow(2, 1 - eBias);
      }
      if (value * c >= 2) {
        e++;
        c /= 2;
      }
      if (e + eBias >= eMax) {
        m = 0;
        e = eMax;
      } else if (e + eBias >= 1) {
        m = (value * c - 1) * Math.pow(2, mLen);
        e = e + eBias;
      } else {
        m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
        e = 0;
      }
    }
    for (; mLen >= 8; buffer[offset + i] = m & 255, i += d, m /= 256, mLen -= 8) {
    }
    e = e << mLen | m;
    eLen += mLen;
    for (; eLen > 0; buffer[offset + i] = e & 255, i += d, e /= 256, eLen -= 8) {
    }
    buffer[offset + i - d] |= s * 128;
  };
  return exports$1;
}
function dew() {
  if (_dewExec) return exports;
  _dewExec = true;
  const base64 = dew$2();
  const ieee754 = dew$1();
  const customInspectSymbol = typeof Symbol === "function" && typeof Symbol["for"] === "function" ? Symbol["for"]("nodejs.util.inspect.custom") : null;
  exports.Buffer = Buffer22;
  exports.SlowBuffer = SlowBuffer;
  exports.INSPECT_MAX_BYTES = 50;
  const K_MAX_LENGTH = 2147483647;
  exports.kMaxLength = K_MAX_LENGTH;
  Buffer22.TYPED_ARRAY_SUPPORT = typedArraySupport();
  if (!Buffer22.TYPED_ARRAY_SUPPORT && typeof console !== "undefined" && typeof console.error === "function") {
    console.error("This browser lacks typed array (Uint8Array) support which is required by `buffer` v5.x. Use `buffer` v4.x if you require old browser support.");
  }
  function typedArraySupport() {
    try {
      const arr = new Uint8Array(1);
      const proto = {
        foo: function() {
          return 42;
        }
      };
      Object.setPrototypeOf(proto, Uint8Array.prototype);
      Object.setPrototypeOf(arr, proto);
      return arr.foo() === 42;
    } catch (e) {
      return false;
    }
  }
  Object.defineProperty(Buffer22.prototype, "parent", {
    enumerable: true,
    get: function() {
      if (!Buffer22.isBuffer(this)) return void 0;
      return this.buffer;
    }
  });
  Object.defineProperty(Buffer22.prototype, "offset", {
    enumerable: true,
    get: function() {
      if (!Buffer22.isBuffer(this)) return void 0;
      return this.byteOffset;
    }
  });
  function createBuffer(length) {
    if (length > K_MAX_LENGTH) {
      throw new RangeError('The value "' + length + '" is invalid for option "size"');
    }
    const buf = new Uint8Array(length);
    Object.setPrototypeOf(buf, Buffer22.prototype);
    return buf;
  }
  function Buffer22(arg, encodingOrOffset, length) {
    if (typeof arg === "number") {
      if (typeof encodingOrOffset === "string") {
        throw new TypeError('The "string" argument must be of type string. Received type number');
      }
      return allocUnsafe(arg);
    }
    return from(arg, encodingOrOffset, length);
  }
  Buffer22.poolSize = 8192;
  function from(value, encodingOrOffset, length) {
    if (typeof value === "string") {
      return fromString(value, encodingOrOffset);
    }
    if (ArrayBuffer.isView(value)) {
      return fromArrayView(value);
    }
    if (value == null) {
      throw new TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof value);
    }
    if (isInstance(value, ArrayBuffer) || value && isInstance(value.buffer, ArrayBuffer)) {
      return fromArrayBuffer(value, encodingOrOffset, length);
    }
    if (typeof SharedArrayBuffer !== "undefined" && (isInstance(value, SharedArrayBuffer) || value && isInstance(value.buffer, SharedArrayBuffer))) {
      return fromArrayBuffer(value, encodingOrOffset, length);
    }
    if (typeof value === "number") {
      throw new TypeError('The "value" argument must not be of type number. Received type number');
    }
    const valueOf = value.valueOf && value.valueOf();
    if (valueOf != null && valueOf !== value) {
      return Buffer22.from(valueOf, encodingOrOffset, length);
    }
    const b = fromObject(value);
    if (b) return b;
    if (typeof Symbol !== "undefined" && Symbol.toPrimitive != null && typeof value[Symbol.toPrimitive] === "function") {
      return Buffer22.from(value[Symbol.toPrimitive]("string"), encodingOrOffset, length);
    }
    throw new TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof value);
  }
  Buffer22.from = function(value, encodingOrOffset, length) {
    return from(value, encodingOrOffset, length);
  };
  Object.setPrototypeOf(Buffer22.prototype, Uint8Array.prototype);
  Object.setPrototypeOf(Buffer22, Uint8Array);
  function assertSize(size) {
    if (typeof size !== "number") {
      throw new TypeError('"size" argument must be of type number');
    } else if (size < 0) {
      throw new RangeError('The value "' + size + '" is invalid for option "size"');
    }
  }
  function alloc(size, fill, encoding) {
    assertSize(size);
    if (size <= 0) {
      return createBuffer(size);
    }
    if (fill !== void 0) {
      return typeof encoding === "string" ? createBuffer(size).fill(fill, encoding) : createBuffer(size).fill(fill);
    }
    return createBuffer(size);
  }
  Buffer22.alloc = function(size, fill, encoding) {
    return alloc(size, fill, encoding);
  };
  function allocUnsafe(size) {
    assertSize(size);
    return createBuffer(size < 0 ? 0 : checked(size) | 0);
  }
  Buffer22.allocUnsafe = function(size) {
    return allocUnsafe(size);
  };
  Buffer22.allocUnsafeSlow = function(size) {
    return allocUnsafe(size);
  };
  function fromString(string, encoding) {
    if (typeof encoding !== "string" || encoding === "") {
      encoding = "utf8";
    }
    if (!Buffer22.isEncoding(encoding)) {
      throw new TypeError("Unknown encoding: " + encoding);
    }
    const length = byteLength(string, encoding) | 0;
    let buf = createBuffer(length);
    const actual = buf.write(string, encoding);
    if (actual !== length) {
      buf = buf.slice(0, actual);
    }
    return buf;
  }
  function fromArrayLike(array) {
    const length = array.length < 0 ? 0 : checked(array.length) | 0;
    const buf = createBuffer(length);
    for (let i = 0; i < length; i += 1) {
      buf[i] = array[i] & 255;
    }
    return buf;
  }
  function fromArrayView(arrayView) {
    if (isInstance(arrayView, Uint8Array)) {
      const copy = new Uint8Array(arrayView);
      return fromArrayBuffer(copy.buffer, copy.byteOffset, copy.byteLength);
    }
    return fromArrayLike(arrayView);
  }
  function fromArrayBuffer(array, byteOffset, length) {
    if (byteOffset < 0 || array.byteLength < byteOffset) {
      throw new RangeError('"offset" is outside of buffer bounds');
    }
    if (array.byteLength < byteOffset + (length || 0)) {
      throw new RangeError('"length" is outside of buffer bounds');
    }
    let buf;
    if (byteOffset === void 0 && length === void 0) {
      buf = new Uint8Array(array);
    } else if (length === void 0) {
      buf = new Uint8Array(array, byteOffset);
    } else {
      buf = new Uint8Array(array, byteOffset, length);
    }
    Object.setPrototypeOf(buf, Buffer22.prototype);
    return buf;
  }
  function fromObject(obj) {
    if (Buffer22.isBuffer(obj)) {
      const len = checked(obj.length) | 0;
      const buf = createBuffer(len);
      if (buf.length === 0) {
        return buf;
      }
      obj.copy(buf, 0, 0, len);
      return buf;
    }
    if (obj.length !== void 0) {
      if (typeof obj.length !== "number" || numberIsNaN(obj.length)) {
        return createBuffer(0);
      }
      return fromArrayLike(obj);
    }
    if (obj.type === "Buffer" && Array.isArray(obj.data)) {
      return fromArrayLike(obj.data);
    }
  }
  function checked(length) {
    if (length >= K_MAX_LENGTH) {
      throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + K_MAX_LENGTH.toString(16) + " bytes");
    }
    return length | 0;
  }
  function SlowBuffer(length) {
    if (+length != length) {
      length = 0;
    }
    return Buffer22.alloc(+length);
  }
  Buffer22.isBuffer = function isBuffer(b) {
    return b != null && b._isBuffer === true && b !== Buffer22.prototype;
  };
  Buffer22.compare = function compare(a, b) {
    if (isInstance(a, Uint8Array)) a = Buffer22.from(a, a.offset, a.byteLength);
    if (isInstance(b, Uint8Array)) b = Buffer22.from(b, b.offset, b.byteLength);
    if (!Buffer22.isBuffer(a) || !Buffer22.isBuffer(b)) {
      throw new TypeError('The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array');
    }
    if (a === b) return 0;
    let x = a.length;
    let y = b.length;
    for (let i = 0, len = Math.min(x, y); i < len; ++i) {
      if (a[i] !== b[i]) {
        x = a[i];
        y = b[i];
        break;
      }
    }
    if (x < y) return -1;
    if (y < x) return 1;
    return 0;
  };
  Buffer22.isEncoding = function isEncoding(encoding) {
    switch (String(encoding).toLowerCase()) {
      case "hex":
      case "utf8":
      case "utf-8":
      case "ascii":
      case "latin1":
      case "binary":
      case "base64":
      case "ucs2":
      case "ucs-2":
      case "utf16le":
      case "utf-16le":
        return true;
      default:
        return false;
    }
  };
  Buffer22.concat = function concat(list, length) {
    if (!Array.isArray(list)) {
      throw new TypeError('"list" argument must be an Array of Buffers');
    }
    if (list.length === 0) {
      return Buffer22.alloc(0);
    }
    let i;
    if (length === void 0) {
      length = 0;
      for (i = 0; i < list.length; ++i) {
        length += list[i].length;
      }
    }
    const buffer = Buffer22.allocUnsafe(length);
    let pos = 0;
    for (i = 0; i < list.length; ++i) {
      let buf = list[i];
      if (isInstance(buf, Uint8Array)) {
        if (pos + buf.length > buffer.length) {
          if (!Buffer22.isBuffer(buf)) buf = Buffer22.from(buf);
          buf.copy(buffer, pos);
        } else {
          Uint8Array.prototype.set.call(buffer, buf, pos);
        }
      } else if (!Buffer22.isBuffer(buf)) {
        throw new TypeError('"list" argument must be an Array of Buffers');
      } else {
        buf.copy(buffer, pos);
      }
      pos += buf.length;
    }
    return buffer;
  };
  function byteLength(string, encoding) {
    if (Buffer22.isBuffer(string)) {
      return string.length;
    }
    if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
      return string.byteLength;
    }
    if (typeof string !== "string") {
      throw new TypeError('The "string" argument must be one of type string, Buffer, or ArrayBuffer. Received type ' + typeof string);
    }
    const len = string.length;
    const mustMatch = arguments.length > 2 && arguments[2] === true;
    if (!mustMatch && len === 0) return 0;
    let loweredCase = false;
    for (; ; ) {
      switch (encoding) {
        case "ascii":
        case "latin1":
        case "binary":
          return len;
        case "utf8":
        case "utf-8":
          return utf8ToBytes(string).length;
        case "ucs2":
        case "ucs-2":
        case "utf16le":
        case "utf-16le":
          return len * 2;
        case "hex":
          return len >>> 1;
        case "base64":
          return base64ToBytes(string).length;
        default:
          if (loweredCase) {
            return mustMatch ? -1 : utf8ToBytes(string).length;
          }
          encoding = ("" + encoding).toLowerCase();
          loweredCase = true;
      }
    }
  }
  Buffer22.byteLength = byteLength;
  function slowToString(encoding, start, end) {
    let loweredCase = false;
    if (start === void 0 || start < 0) {
      start = 0;
    }
    if (start > this.length) {
      return "";
    }
    if (end === void 0 || end > this.length) {
      end = this.length;
    }
    if (end <= 0) {
      return "";
    }
    end >>>= 0;
    start >>>= 0;
    if (end <= start) {
      return "";
    }
    if (!encoding) encoding = "utf8";
    while (true) {
      switch (encoding) {
        case "hex":
          return hexSlice(this, start, end);
        case "utf8":
        case "utf-8":
          return utf8Slice(this, start, end);
        case "ascii":
          return asciiSlice(this, start, end);
        case "latin1":
        case "binary":
          return latin1Slice(this, start, end);
        case "base64":
          return base64Slice(this, start, end);
        case "ucs2":
        case "ucs-2":
        case "utf16le":
        case "utf-16le":
          return utf16leSlice(this, start, end);
        default:
          if (loweredCase) throw new TypeError("Unknown encoding: " + encoding);
          encoding = (encoding + "").toLowerCase();
          loweredCase = true;
      }
    }
  }
  Buffer22.prototype._isBuffer = true;
  function swap(b, n, m) {
    const i = b[n];
    b[n] = b[m];
    b[m] = i;
  }
  Buffer22.prototype.swap16 = function swap16() {
    const len = this.length;
    if (len % 2 !== 0) {
      throw new RangeError("Buffer size must be a multiple of 16-bits");
    }
    for (let i = 0; i < len; i += 2) {
      swap(this, i, i + 1);
    }
    return this;
  };
  Buffer22.prototype.swap32 = function swap32() {
    const len = this.length;
    if (len % 4 !== 0) {
      throw new RangeError("Buffer size must be a multiple of 32-bits");
    }
    for (let i = 0; i < len; i += 4) {
      swap(this, i, i + 3);
      swap(this, i + 1, i + 2);
    }
    return this;
  };
  Buffer22.prototype.swap64 = function swap64() {
    const len = this.length;
    if (len % 8 !== 0) {
      throw new RangeError("Buffer size must be a multiple of 64-bits");
    }
    for (let i = 0; i < len; i += 8) {
      swap(this, i, i + 7);
      swap(this, i + 1, i + 6);
      swap(this, i + 2, i + 5);
      swap(this, i + 3, i + 4);
    }
    return this;
  };
  Buffer22.prototype.toString = function toString() {
    const length = this.length;
    if (length === 0) return "";
    if (arguments.length === 0) return utf8Slice(this, 0, length);
    return slowToString.apply(this, arguments);
  };
  Buffer22.prototype.toLocaleString = Buffer22.prototype.toString;
  Buffer22.prototype.equals = function equals(b) {
    if (!Buffer22.isBuffer(b)) throw new TypeError("Argument must be a Buffer");
    if (this === b) return true;
    return Buffer22.compare(this, b) === 0;
  };
  Buffer22.prototype.inspect = function inspect() {
    let str = "";
    const max = exports.INSPECT_MAX_BYTES;
    str = this.toString("hex", 0, max).replace(/(.{2})/g, "$1 ").trim();
    if (this.length > max) str += " ... ";
    return "<Buffer " + str + ">";
  };
  if (customInspectSymbol) {
    Buffer22.prototype[customInspectSymbol] = Buffer22.prototype.inspect;
  }
  Buffer22.prototype.compare = function compare(target, start, end, thisStart, thisEnd) {
    if (isInstance(target, Uint8Array)) {
      target = Buffer22.from(target, target.offset, target.byteLength);
    }
    if (!Buffer22.isBuffer(target)) {
      throw new TypeError('The "target" argument must be one of type Buffer or Uint8Array. Received type ' + typeof target);
    }
    if (start === void 0) {
      start = 0;
    }
    if (end === void 0) {
      end = target ? target.length : 0;
    }
    if (thisStart === void 0) {
      thisStart = 0;
    }
    if (thisEnd === void 0) {
      thisEnd = this.length;
    }
    if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
      throw new RangeError("out of range index");
    }
    if (thisStart >= thisEnd && start >= end) {
      return 0;
    }
    if (thisStart >= thisEnd) {
      return -1;
    }
    if (start >= end) {
      return 1;
    }
    start >>>= 0;
    end >>>= 0;
    thisStart >>>= 0;
    thisEnd >>>= 0;
    if (this === target) return 0;
    let x = thisEnd - thisStart;
    let y = end - start;
    const len = Math.min(x, y);
    const thisCopy = this.slice(thisStart, thisEnd);
    const targetCopy = target.slice(start, end);
    for (let i = 0; i < len; ++i) {
      if (thisCopy[i] !== targetCopy[i]) {
        x = thisCopy[i];
        y = targetCopy[i];
        break;
      }
    }
    if (x < y) return -1;
    if (y < x) return 1;
    return 0;
  };
  function bidirectionalIndexOf(buffer, val, byteOffset, encoding, dir) {
    if (buffer.length === 0) return -1;
    if (typeof byteOffset === "string") {
      encoding = byteOffset;
      byteOffset = 0;
    } else if (byteOffset > 2147483647) {
      byteOffset = 2147483647;
    } else if (byteOffset < -2147483648) {
      byteOffset = -2147483648;
    }
    byteOffset = +byteOffset;
    if (numberIsNaN(byteOffset)) {
      byteOffset = dir ? 0 : buffer.length - 1;
    }
    if (byteOffset < 0) byteOffset = buffer.length + byteOffset;
    if (byteOffset >= buffer.length) {
      if (dir) return -1;
      else byteOffset = buffer.length - 1;
    } else if (byteOffset < 0) {
      if (dir) byteOffset = 0;
      else return -1;
    }
    if (typeof val === "string") {
      val = Buffer22.from(val, encoding);
    }
    if (Buffer22.isBuffer(val)) {
      if (val.length === 0) {
        return -1;
      }
      return arrayIndexOf(buffer, val, byteOffset, encoding, dir);
    } else if (typeof val === "number") {
      val = val & 255;
      if (typeof Uint8Array.prototype.indexOf === "function") {
        if (dir) {
          return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset);
        } else {
          return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset);
        }
      }
      return arrayIndexOf(buffer, [val], byteOffset, encoding, dir);
    }
    throw new TypeError("val must be string, number or Buffer");
  }
  function arrayIndexOf(arr, val, byteOffset, encoding, dir) {
    let indexSize = 1;
    let arrLength = arr.length;
    let valLength = val.length;
    if (encoding !== void 0) {
      encoding = String(encoding).toLowerCase();
      if (encoding === "ucs2" || encoding === "ucs-2" || encoding === "utf16le" || encoding === "utf-16le") {
        if (arr.length < 2 || val.length < 2) {
          return -1;
        }
        indexSize = 2;
        arrLength /= 2;
        valLength /= 2;
        byteOffset /= 2;
      }
    }
    function read(buf, i2) {
      if (indexSize === 1) {
        return buf[i2];
      } else {
        return buf.readUInt16BE(i2 * indexSize);
      }
    }
    let i;
    if (dir) {
      let foundIndex = -1;
      for (i = byteOffset; i < arrLength; i++) {
        if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
          if (foundIndex === -1) foundIndex = i;
          if (i - foundIndex + 1 === valLength) return foundIndex * indexSize;
        } else {
          if (foundIndex !== -1) i -= i - foundIndex;
          foundIndex = -1;
        }
      }
    } else {
      if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;
      for (i = byteOffset; i >= 0; i--) {
        let found = true;
        for (let j = 0; j < valLength; j++) {
          if (read(arr, i + j) !== read(val, j)) {
            found = false;
            break;
          }
        }
        if (found) return i;
      }
    }
    return -1;
  }
  Buffer22.prototype.includes = function includes(val, byteOffset, encoding) {
    return this.indexOf(val, byteOffset, encoding) !== -1;
  };
  Buffer22.prototype.indexOf = function indexOf(val, byteOffset, encoding) {
    return bidirectionalIndexOf(this, val, byteOffset, encoding, true);
  };
  Buffer22.prototype.lastIndexOf = function lastIndexOf(val, byteOffset, encoding) {
    return bidirectionalIndexOf(this, val, byteOffset, encoding, false);
  };
  function hexWrite(buf, string, offset, length) {
    offset = Number(offset) || 0;
    const remaining = buf.length - offset;
    if (!length) {
      length = remaining;
    } else {
      length = Number(length);
      if (length > remaining) {
        length = remaining;
      }
    }
    const strLen = string.length;
    if (length > strLen / 2) {
      length = strLen / 2;
    }
    let i;
    for (i = 0; i < length; ++i) {
      const parsed = parseInt(string.substr(i * 2, 2), 16);
      if (numberIsNaN(parsed)) return i;
      buf[offset + i] = parsed;
    }
    return i;
  }
  function utf8Write(buf, string, offset, length) {
    return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length);
  }
  function asciiWrite(buf, string, offset, length) {
    return blitBuffer(asciiToBytes(string), buf, offset, length);
  }
  function base64Write(buf, string, offset, length) {
    return blitBuffer(base64ToBytes(string), buf, offset, length);
  }
  function ucs2Write(buf, string, offset, length) {
    return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length);
  }
  Buffer22.prototype.write = function write(string, offset, length, encoding) {
    if (offset === void 0) {
      encoding = "utf8";
      length = this.length;
      offset = 0;
    } else if (length === void 0 && typeof offset === "string") {
      encoding = offset;
      length = this.length;
      offset = 0;
    } else if (isFinite(offset)) {
      offset = offset >>> 0;
      if (isFinite(length)) {
        length = length >>> 0;
        if (encoding === void 0) encoding = "utf8";
      } else {
        encoding = length;
        length = void 0;
      }
    } else {
      throw new Error("Buffer.write(string, encoding, offset[, length]) is no longer supported");
    }
    const remaining = this.length - offset;
    if (length === void 0 || length > remaining) length = remaining;
    if (string.length > 0 && (length < 0 || offset < 0) || offset > this.length) {
      throw new RangeError("Attempt to write outside buffer bounds");
    }
    if (!encoding) encoding = "utf8";
    let loweredCase = false;
    for (; ; ) {
      switch (encoding) {
        case "hex":
          return hexWrite(this, string, offset, length);
        case "utf8":
        case "utf-8":
          return utf8Write(this, string, offset, length);
        case "ascii":
        case "latin1":
        case "binary":
          return asciiWrite(this, string, offset, length);
        case "base64":
          return base64Write(this, string, offset, length);
        case "ucs2":
        case "ucs-2":
        case "utf16le":
        case "utf-16le":
          return ucs2Write(this, string, offset, length);
        default:
          if (loweredCase) throw new TypeError("Unknown encoding: " + encoding);
          encoding = ("" + encoding).toLowerCase();
          loweredCase = true;
      }
    }
  };
  Buffer22.prototype.toJSON = function toJSON() {
    return {
      type: "Buffer",
      data: Array.prototype.slice.call(this._arr || this, 0)
    };
  };
  function base64Slice(buf, start, end) {
    if (start === 0 && end === buf.length) {
      return base64.fromByteArray(buf);
    } else {
      return base64.fromByteArray(buf.slice(start, end));
    }
  }
  function utf8Slice(buf, start, end) {
    end = Math.min(buf.length, end);
    const res = [];
    let i = start;
    while (i < end) {
      const firstByte = buf[i];
      let codePoint = null;
      let bytesPerSequence = firstByte > 239 ? 4 : firstByte > 223 ? 3 : firstByte > 191 ? 2 : 1;
      if (i + bytesPerSequence <= end) {
        let secondByte, thirdByte, fourthByte, tempCodePoint;
        switch (bytesPerSequence) {
          case 1:
            if (firstByte < 128) {
              codePoint = firstByte;
            }
            break;
          case 2:
            secondByte = buf[i + 1];
            if ((secondByte & 192) === 128) {
              tempCodePoint = (firstByte & 31) << 6 | secondByte & 63;
              if (tempCodePoint > 127) {
                codePoint = tempCodePoint;
              }
            }
            break;
          case 3:
            secondByte = buf[i + 1];
            thirdByte = buf[i + 2];
            if ((secondByte & 192) === 128 && (thirdByte & 192) === 128) {
              tempCodePoint = (firstByte & 15) << 12 | (secondByte & 63) << 6 | thirdByte & 63;
              if (tempCodePoint > 2047 && (tempCodePoint < 55296 || tempCodePoint > 57343)) {
                codePoint = tempCodePoint;
              }
            }
            break;
          case 4:
            secondByte = buf[i + 1];
            thirdByte = buf[i + 2];
            fourthByte = buf[i + 3];
            if ((secondByte & 192) === 128 && (thirdByte & 192) === 128 && (fourthByte & 192) === 128) {
              tempCodePoint = (firstByte & 15) << 18 | (secondByte & 63) << 12 | (thirdByte & 63) << 6 | fourthByte & 63;
              if (tempCodePoint > 65535 && tempCodePoint < 1114112) {
                codePoint = tempCodePoint;
              }
            }
        }
      }
      if (codePoint === null) {
        codePoint = 65533;
        bytesPerSequence = 1;
      } else if (codePoint > 65535) {
        codePoint -= 65536;
        res.push(codePoint >>> 10 & 1023 | 55296);
        codePoint = 56320 | codePoint & 1023;
      }
      res.push(codePoint);
      i += bytesPerSequence;
    }
    return decodeCodePointsArray(res);
  }
  const MAX_ARGUMENTS_LENGTH = 4096;
  function decodeCodePointsArray(codePoints) {
    const len = codePoints.length;
    if (len <= MAX_ARGUMENTS_LENGTH) {
      return String.fromCharCode.apply(String, codePoints);
    }
    let res = "";
    let i = 0;
    while (i < len) {
      res += String.fromCharCode.apply(String, codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH));
    }
    return res;
  }
  function asciiSlice(buf, start, end) {
    let ret = "";
    end = Math.min(buf.length, end);
    for (let i = start; i < end; ++i) {
      ret += String.fromCharCode(buf[i] & 127);
    }
    return ret;
  }
  function latin1Slice(buf, start, end) {
    let ret = "";
    end = Math.min(buf.length, end);
    for (let i = start; i < end; ++i) {
      ret += String.fromCharCode(buf[i]);
    }
    return ret;
  }
  function hexSlice(buf, start, end) {
    const len = buf.length;
    if (!start || start < 0) start = 0;
    if (!end || end < 0 || end > len) end = len;
    let out = "";
    for (let i = start; i < end; ++i) {
      out += hexSliceLookupTable[buf[i]];
    }
    return out;
  }
  function utf16leSlice(buf, start, end) {
    const bytes = buf.slice(start, end);
    let res = "";
    for (let i = 0; i < bytes.length - 1; i += 2) {
      res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
    }
    return res;
  }
  Buffer22.prototype.slice = function slice(start, end) {
    const len = this.length;
    start = ~~start;
    end = end === void 0 ? len : ~~end;
    if (start < 0) {
      start += len;
      if (start < 0) start = 0;
    } else if (start > len) {
      start = len;
    }
    if (end < 0) {
      end += len;
      if (end < 0) end = 0;
    } else if (end > len) {
      end = len;
    }
    if (end < start) end = start;
    const newBuf = this.subarray(start, end);
    Object.setPrototypeOf(newBuf, Buffer22.prototype);
    return newBuf;
  };
  function checkOffset(offset, ext, length) {
    if (offset % 1 !== 0 || offset < 0) throw new RangeError("offset is not uint");
    if (offset + ext > length) throw new RangeError("Trying to access beyond buffer length");
  }
  Buffer22.prototype.readUintLE = Buffer22.prototype.readUIntLE = function readUIntLE(offset, byteLength2, noAssert) {
    offset = offset >>> 0;
    byteLength2 = byteLength2 >>> 0;
    if (!noAssert) checkOffset(offset, byteLength2, this.length);
    let val = this[offset];
    let mul = 1;
    let i = 0;
    while (++i < byteLength2 && (mul *= 256)) {
      val += this[offset + i] * mul;
    }
    return val;
  };
  Buffer22.prototype.readUintBE = Buffer22.prototype.readUIntBE = function readUIntBE(offset, byteLength2, noAssert) {
    offset = offset >>> 0;
    byteLength2 = byteLength2 >>> 0;
    if (!noAssert) {
      checkOffset(offset, byteLength2, this.length);
    }
    let val = this[offset + --byteLength2];
    let mul = 1;
    while (byteLength2 > 0 && (mul *= 256)) {
      val += this[offset + --byteLength2] * mul;
    }
    return val;
  };
  Buffer22.prototype.readUint8 = Buffer22.prototype.readUInt8 = function readUInt8(offset, noAssert) {
    offset = offset >>> 0;
    if (!noAssert) checkOffset(offset, 1, this.length);
    return this[offset];
  };
  Buffer22.prototype.readUint16LE = Buffer22.prototype.readUInt16LE = function readUInt16LE(offset, noAssert) {
    offset = offset >>> 0;
    if (!noAssert) checkOffset(offset, 2, this.length);
    return this[offset] | this[offset + 1] << 8;
  };
  Buffer22.prototype.readUint16BE = Buffer22.prototype.readUInt16BE = function readUInt16BE(offset, noAssert) {
    offset = offset >>> 0;
    if (!noAssert) checkOffset(offset, 2, this.length);
    return this[offset] << 8 | this[offset + 1];
  };
  Buffer22.prototype.readUint32LE = Buffer22.prototype.readUInt32LE = function readUInt32LE(offset, noAssert) {
    offset = offset >>> 0;
    if (!noAssert) checkOffset(offset, 4, this.length);
    return (this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16) + this[offset + 3] * 16777216;
  };
  Buffer22.prototype.readUint32BE = Buffer22.prototype.readUInt32BE = function readUInt32BE(offset, noAssert) {
    offset = offset >>> 0;
    if (!noAssert) checkOffset(offset, 4, this.length);
    return this[offset] * 16777216 + (this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3]);
  };
  Buffer22.prototype.readBigUInt64LE = defineBigIntMethod(function readBigUInt64LE(offset) {
    offset = offset >>> 0;
    validateNumber(offset, "offset");
    const first = this[offset];
    const last = this[offset + 7];
    if (first === void 0 || last === void 0) {
      boundsError(offset, this.length - 8);
    }
    const lo = first + this[++offset] * 2 ** 8 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 24;
    const hi = this[++offset] + this[++offset] * 2 ** 8 + this[++offset] * 2 ** 16 + last * 2 ** 24;
    return BigInt(lo) + (BigInt(hi) << BigInt(32));
  });
  Buffer22.prototype.readBigUInt64BE = defineBigIntMethod(function readBigUInt64BE(offset) {
    offset = offset >>> 0;
    validateNumber(offset, "offset");
    const first = this[offset];
    const last = this[offset + 7];
    if (first === void 0 || last === void 0) {
      boundsError(offset, this.length - 8);
    }
    const hi = first * 2 ** 24 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + this[++offset];
    const lo = this[++offset] * 2 ** 24 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + last;
    return (BigInt(hi) << BigInt(32)) + BigInt(lo);
  });
  Buffer22.prototype.readIntLE = function readIntLE(offset, byteLength2, noAssert) {
    offset = offset >>> 0;
    byteLength2 = byteLength2 >>> 0;
    if (!noAssert) checkOffset(offset, byteLength2, this.length);
    let val = this[offset];
    let mul = 1;
    let i = 0;
    while (++i < byteLength2 && (mul *= 256)) {
      val += this[offset + i] * mul;
    }
    mul *= 128;
    if (val >= mul) val -= Math.pow(2, 8 * byteLength2);
    return val;
  };
  Buffer22.prototype.readIntBE = function readIntBE(offset, byteLength2, noAssert) {
    offset = offset >>> 0;
    byteLength2 = byteLength2 >>> 0;
    if (!noAssert) checkOffset(offset, byteLength2, this.length);
    let i = byteLength2;
    let mul = 1;
    let val = this[offset + --i];
    while (i > 0 && (mul *= 256)) {
      val += this[offset + --i] * mul;
    }
    mul *= 128;
    if (val >= mul) val -= Math.pow(2, 8 * byteLength2);
    return val;
  };
  Buffer22.prototype.readInt8 = function readInt8(offset, noAssert) {
    offset = offset >>> 0;
    if (!noAssert) checkOffset(offset, 1, this.length);
    if (!(this[offset] & 128)) return this[offset];
    return (255 - this[offset] + 1) * -1;
  };
  Buffer22.prototype.readInt16LE = function readInt16LE(offset, noAssert) {
    offset = offset >>> 0;
    if (!noAssert) checkOffset(offset, 2, this.length);
    const val = this[offset] | this[offset + 1] << 8;
    return val & 32768 ? val | 4294901760 : val;
  };
  Buffer22.prototype.readInt16BE = function readInt16BE(offset, noAssert) {
    offset = offset >>> 0;
    if (!noAssert) checkOffset(offset, 2, this.length);
    const val = this[offset + 1] | this[offset] << 8;
    return val & 32768 ? val | 4294901760 : val;
  };
  Buffer22.prototype.readInt32LE = function readInt32LE(offset, noAssert) {
    offset = offset >>> 0;
    if (!noAssert) checkOffset(offset, 4, this.length);
    return this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16 | this[offset + 3] << 24;
  };
  Buffer22.prototype.readInt32BE = function readInt32BE(offset, noAssert) {
    offset = offset >>> 0;
    if (!noAssert) checkOffset(offset, 4, this.length);
    return this[offset] << 24 | this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3];
  };
  Buffer22.prototype.readBigInt64LE = defineBigIntMethod(function readBigInt64LE(offset) {
    offset = offset >>> 0;
    validateNumber(offset, "offset");
    const first = this[offset];
    const last = this[offset + 7];
    if (first === void 0 || last === void 0) {
      boundsError(offset, this.length - 8);
    }
    const val = this[offset + 4] + this[offset + 5] * 2 ** 8 + this[offset + 6] * 2 ** 16 + (last << 24);
    return (BigInt(val) << BigInt(32)) + BigInt(first + this[++offset] * 2 ** 8 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 24);
  });
  Buffer22.prototype.readBigInt64BE = defineBigIntMethod(function readBigInt64BE(offset) {
    offset = offset >>> 0;
    validateNumber(offset, "offset");
    const first = this[offset];
    const last = this[offset + 7];
    if (first === void 0 || last === void 0) {
      boundsError(offset, this.length - 8);
    }
    const val = (first << 24) + // Overflow
    this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + this[++offset];
    return (BigInt(val) << BigInt(32)) + BigInt(this[++offset] * 2 ** 24 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + last);
  });
  Buffer22.prototype.readFloatLE = function readFloatLE(offset, noAssert) {
    offset = offset >>> 0;
    if (!noAssert) checkOffset(offset, 4, this.length);
    return ieee754.read(this, offset, true, 23, 4);
  };
  Buffer22.prototype.readFloatBE = function readFloatBE(offset, noAssert) {
    offset = offset >>> 0;
    if (!noAssert) checkOffset(offset, 4, this.length);
    return ieee754.read(this, offset, false, 23, 4);
  };
  Buffer22.prototype.readDoubleLE = function readDoubleLE(offset, noAssert) {
    offset = offset >>> 0;
    if (!noAssert) checkOffset(offset, 8, this.length);
    return ieee754.read(this, offset, true, 52, 8);
  };
  Buffer22.prototype.readDoubleBE = function readDoubleBE(offset, noAssert) {
    offset = offset >>> 0;
    if (!noAssert) checkOffset(offset, 8, this.length);
    return ieee754.read(this, offset, false, 52, 8);
  };
  function checkInt(buf, value, offset, ext, max, min) {
    if (!Buffer22.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance');
    if (value > max || value < min) throw new RangeError('"value" argument is out of bounds');
    if (offset + ext > buf.length) throw new RangeError("Index out of range");
  }
  Buffer22.prototype.writeUintLE = Buffer22.prototype.writeUIntLE = function writeUIntLE(value, offset, byteLength2, noAssert) {
    value = +value;
    offset = offset >>> 0;
    byteLength2 = byteLength2 >>> 0;
    if (!noAssert) {
      const maxBytes = Math.pow(2, 8 * byteLength2) - 1;
      checkInt(this, value, offset, byteLength2, maxBytes, 0);
    }
    let mul = 1;
    let i = 0;
    this[offset] = value & 255;
    while (++i < byteLength2 && (mul *= 256)) {
      this[offset + i] = value / mul & 255;
    }
    return offset + byteLength2;
  };
  Buffer22.prototype.writeUintBE = Buffer22.prototype.writeUIntBE = function writeUIntBE(value, offset, byteLength2, noAssert) {
    value = +value;
    offset = offset >>> 0;
    byteLength2 = byteLength2 >>> 0;
    if (!noAssert) {
      const maxBytes = Math.pow(2, 8 * byteLength2) - 1;
      checkInt(this, value, offset, byteLength2, maxBytes, 0);
    }
    let i = byteLength2 - 1;
    let mul = 1;
    this[offset + i] = value & 255;
    while (--i >= 0 && (mul *= 256)) {
      this[offset + i] = value / mul & 255;
    }
    return offset + byteLength2;
  };
  Buffer22.prototype.writeUint8 = Buffer22.prototype.writeUInt8 = function writeUInt8(value, offset, noAssert) {
    value = +value;
    offset = offset >>> 0;
    if (!noAssert) checkInt(this, value, offset, 1, 255, 0);
    this[offset] = value & 255;
    return offset + 1;
  };
  Buffer22.prototype.writeUint16LE = Buffer22.prototype.writeUInt16LE = function writeUInt16LE(value, offset, noAssert) {
    value = +value;
    offset = offset >>> 0;
    if (!noAssert) checkInt(this, value, offset, 2, 65535, 0);
    this[offset] = value & 255;
    this[offset + 1] = value >>> 8;
    return offset + 2;
  };
  Buffer22.prototype.writeUint16BE = Buffer22.prototype.writeUInt16BE = function writeUInt16BE(value, offset, noAssert) {
    value = +value;
    offset = offset >>> 0;
    if (!noAssert) checkInt(this, value, offset, 2, 65535, 0);
    this[offset] = value >>> 8;
    this[offset + 1] = value & 255;
    return offset + 2;
  };
  Buffer22.prototype.writeUint32LE = Buffer22.prototype.writeUInt32LE = function writeUInt32LE(value, offset, noAssert) {
    value = +value;
    offset = offset >>> 0;
    if (!noAssert) checkInt(this, value, offset, 4, 4294967295, 0);
    this[offset + 3] = value >>> 24;
    this[offset + 2] = value >>> 16;
    this[offset + 1] = value >>> 8;
    this[offset] = value & 255;
    return offset + 4;
  };
  Buffer22.prototype.writeUint32BE = Buffer22.prototype.writeUInt32BE = function writeUInt32BE(value, offset, noAssert) {
    value = +value;
    offset = offset >>> 0;
    if (!noAssert) checkInt(this, value, offset, 4, 4294967295, 0);
    this[offset] = value >>> 24;
    this[offset + 1] = value >>> 16;
    this[offset + 2] = value >>> 8;
    this[offset + 3] = value & 255;
    return offset + 4;
  };
  function wrtBigUInt64LE(buf, value, offset, min, max) {
    checkIntBI(value, min, max, buf, offset, 7);
    let lo = Number(value & BigInt(4294967295));
    buf[offset++] = lo;
    lo = lo >> 8;
    buf[offset++] = lo;
    lo = lo >> 8;
    buf[offset++] = lo;
    lo = lo >> 8;
    buf[offset++] = lo;
    let hi = Number(value >> BigInt(32) & BigInt(4294967295));
    buf[offset++] = hi;
    hi = hi >> 8;
    buf[offset++] = hi;
    hi = hi >> 8;
    buf[offset++] = hi;
    hi = hi >> 8;
    buf[offset++] = hi;
    return offset;
  }
  function wrtBigUInt64BE(buf, value, offset, min, max) {
    checkIntBI(value, min, max, buf, offset, 7);
    let lo = Number(value & BigInt(4294967295));
    buf[offset + 7] = lo;
    lo = lo >> 8;
    buf[offset + 6] = lo;
    lo = lo >> 8;
    buf[offset + 5] = lo;
    lo = lo >> 8;
    buf[offset + 4] = lo;
    let hi = Number(value >> BigInt(32) & BigInt(4294967295));
    buf[offset + 3] = hi;
    hi = hi >> 8;
    buf[offset + 2] = hi;
    hi = hi >> 8;
    buf[offset + 1] = hi;
    hi = hi >> 8;
    buf[offset] = hi;
    return offset + 8;
  }
  Buffer22.prototype.writeBigUInt64LE = defineBigIntMethod(function writeBigUInt64LE(value, offset = 0) {
    return wrtBigUInt64LE(this, value, offset, BigInt(0), BigInt("0xffffffffffffffff"));
  });
  Buffer22.prototype.writeBigUInt64BE = defineBigIntMethod(function writeBigUInt64BE(value, offset = 0) {
    return wrtBigUInt64BE(this, value, offset, BigInt(0), BigInt("0xffffffffffffffff"));
  });
  Buffer22.prototype.writeIntLE = function writeIntLE(value, offset, byteLength2, noAssert) {
    value = +value;
    offset = offset >>> 0;
    if (!noAssert) {
      const limit = Math.pow(2, 8 * byteLength2 - 1);
      checkInt(this, value, offset, byteLength2, limit - 1, -limit);
    }
    let i = 0;
    let mul = 1;
    let sub = 0;
    this[offset] = value & 255;
    while (++i < byteLength2 && (mul *= 256)) {
      if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
        sub = 1;
      }
      this[offset + i] = (value / mul >> 0) - sub & 255;
    }
    return offset + byteLength2;
  };
  Buffer22.prototype.writeIntBE = function writeIntBE(value, offset, byteLength2, noAssert) {
    value = +value;
    offset = offset >>> 0;
    if (!noAssert) {
      const limit = Math.pow(2, 8 * byteLength2 - 1);
      checkInt(this, value, offset, byteLength2, limit - 1, -limit);
    }
    let i = byteLength2 - 1;
    let mul = 1;
    let sub = 0;
    this[offset + i] = value & 255;
    while (--i >= 0 && (mul *= 256)) {
      if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
        sub = 1;
      }
      this[offset + i] = (value / mul >> 0) - sub & 255;
    }
    return offset + byteLength2;
  };
  Buffer22.prototype.writeInt8 = function writeInt8(value, offset, noAssert) {
    value = +value;
    offset = offset >>> 0;
    if (!noAssert) checkInt(this, value, offset, 1, 127, -128);
    if (value < 0) value = 255 + value + 1;
    this[offset] = value & 255;
    return offset + 1;
  };
  Buffer22.prototype.writeInt16LE = function writeInt16LE(value, offset, noAssert) {
    value = +value;
    offset = offset >>> 0;
    if (!noAssert) checkInt(this, value, offset, 2, 32767, -32768);
    this[offset] = value & 255;
    this[offset + 1] = value >>> 8;
    return offset + 2;
  };
  Buffer22.prototype.writeInt16BE = function writeInt16BE(value, offset, noAssert) {
    value = +value;
    offset = offset >>> 0;
    if (!noAssert) checkInt(this, value, offset, 2, 32767, -32768);
    this[offset] = value >>> 8;
    this[offset + 1] = value & 255;
    return offset + 2;
  };
  Buffer22.prototype.writeInt32LE = function writeInt32LE(value, offset, noAssert) {
    value = +value;
    offset = offset >>> 0;
    if (!noAssert) checkInt(this, value, offset, 4, 2147483647, -2147483648);
    this[offset] = value & 255;
    this[offset + 1] = value >>> 8;
    this[offset + 2] = value >>> 16;
    this[offset + 3] = value >>> 24;
    return offset + 4;
  };
  Buffer22.prototype.writeInt32BE = function writeInt32BE(value, offset, noAssert) {
    value = +value;
    offset = offset >>> 0;
    if (!noAssert) checkInt(this, value, offset, 4, 2147483647, -2147483648);
    if (value < 0) value = 4294967295 + value + 1;
    this[offset] = value >>> 24;
    this[offset + 1] = value >>> 16;
    this[offset + 2] = value >>> 8;
    this[offset + 3] = value & 255;
    return offset + 4;
  };
  Buffer22.prototype.writeBigInt64LE = defineBigIntMethod(function writeBigInt64LE(value, offset = 0) {
    return wrtBigUInt64LE(this, value, offset, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
  });
  Buffer22.prototype.writeBigInt64BE = defineBigIntMethod(function writeBigInt64BE(value, offset = 0) {
    return wrtBigUInt64BE(this, value, offset, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
  });
  function checkIEEE754(buf, value, offset, ext, max, min) {
    if (offset + ext > buf.length) throw new RangeError("Index out of range");
    if (offset < 0) throw new RangeError("Index out of range");
  }
  function writeFloat(buf, value, offset, littleEndian, noAssert) {
    value = +value;
    offset = offset >>> 0;
    if (!noAssert) {
      checkIEEE754(buf, value, offset, 4);
    }
    ieee754.write(buf, value, offset, littleEndian, 23, 4);
    return offset + 4;
  }
  Buffer22.prototype.writeFloatLE = function writeFloatLE(value, offset, noAssert) {
    return writeFloat(this, value, offset, true, noAssert);
  };
  Buffer22.prototype.writeFloatBE = function writeFloatBE(value, offset, noAssert) {
    return writeFloat(this, value, offset, false, noAssert);
  };
  function writeDouble(buf, value, offset, littleEndian, noAssert) {
    value = +value;
    offset = offset >>> 0;
    if (!noAssert) {
      checkIEEE754(buf, value, offset, 8);
    }
    ieee754.write(buf, value, offset, littleEndian, 52, 8);
    return offset + 8;
  }
  Buffer22.prototype.writeDoubleLE = function writeDoubleLE(value, offset, noAssert) {
    return writeDouble(this, value, offset, true, noAssert);
  };
  Buffer22.prototype.writeDoubleBE = function writeDoubleBE(value, offset, noAssert) {
    return writeDouble(this, value, offset, false, noAssert);
  };
  Buffer22.prototype.copy = function copy(target, targetStart, start, end) {
    if (!Buffer22.isBuffer(target)) throw new TypeError("argument should be a Buffer");
    if (!start) start = 0;
    if (!end && end !== 0) end = this.length;
    if (targetStart >= target.length) targetStart = target.length;
    if (!targetStart) targetStart = 0;
    if (end > 0 && end < start) end = start;
    if (end === start) return 0;
    if (target.length === 0 || this.length === 0) return 0;
    if (targetStart < 0) {
      throw new RangeError("targetStart out of bounds");
    }
    if (start < 0 || start >= this.length) throw new RangeError("Index out of range");
    if (end < 0) throw new RangeError("sourceEnd out of bounds");
    if (end > this.length) end = this.length;
    if (target.length - targetStart < end - start) {
      end = target.length - targetStart + start;
    }
    const len = end - start;
    if (this === target && typeof Uint8Array.prototype.copyWithin === "function") {
      this.copyWithin(targetStart, start, end);
    } else {
      Uint8Array.prototype.set.call(target, this.subarray(start, end), targetStart);
    }
    return len;
  };
  Buffer22.prototype.fill = function fill(val, start, end, encoding) {
    if (typeof val === "string") {
      if (typeof start === "string") {
        encoding = start;
        start = 0;
        end = this.length;
      } else if (typeof end === "string") {
        encoding = end;
        end = this.length;
      }
      if (encoding !== void 0 && typeof encoding !== "string") {
        throw new TypeError("encoding must be a string");
      }
      if (typeof encoding === "string" && !Buffer22.isEncoding(encoding)) {
        throw new TypeError("Unknown encoding: " + encoding);
      }
      if (val.length === 1) {
        const code = val.charCodeAt(0);
        if (encoding === "utf8" && code < 128 || encoding === "latin1") {
          val = code;
        }
      }
    } else if (typeof val === "number") {
      val = val & 255;
    } else if (typeof val === "boolean") {
      val = Number(val);
    }
    if (start < 0 || this.length < start || this.length < end) {
      throw new RangeError("Out of range index");
    }
    if (end <= start) {
      return this;
    }
    start = start >>> 0;
    end = end === void 0 ? this.length : end >>> 0;
    if (!val) val = 0;
    let i;
    if (typeof val === "number") {
      for (i = start; i < end; ++i) {
        this[i] = val;
      }
    } else {
      const bytes = Buffer22.isBuffer(val) ? val : Buffer22.from(val, encoding);
      const len = bytes.length;
      if (len === 0) {
        throw new TypeError('The value "' + val + '" is invalid for argument "value"');
      }
      for (i = 0; i < end - start; ++i) {
        this[i + start] = bytes[i % len];
      }
    }
    return this;
  };
  const errors = {};
  function E(sym, getMessage, Base) {
    errors[sym] = class NodeError extends Base {
      constructor() {
        super();
        Object.defineProperty(this, "message", {
          value: getMessage.apply(this, arguments),
          writable: true,
          configurable: true
        });
        this.name = `${this.name} [${sym}]`;
        this.stack;
        delete this.name;
      }
      get code() {
        return sym;
      }
      set code(value) {
        Object.defineProperty(this, "code", {
          configurable: true,
          enumerable: true,
          value,
          writable: true
        });
      }
      toString() {
        return `${this.name} [${sym}]: ${this.message}`;
      }
    };
  }
  E("ERR_BUFFER_OUT_OF_BOUNDS", function(name) {
    if (name) {
      return `${name} is outside of buffer bounds`;
    }
    return "Attempt to access memory outside buffer bounds";
  }, RangeError);
  E("ERR_INVALID_ARG_TYPE", function(name, actual) {
    return `The "${name}" argument must be of type number. Received type ${typeof actual}`;
  }, TypeError);
  E("ERR_OUT_OF_RANGE", function(str, range, input) {
    let msg = `The value of "${str}" is out of range.`;
    let received = input;
    if (Number.isInteger(input) && Math.abs(input) > 2 ** 32) {
      received = addNumericalSeparator(String(input));
    } else if (typeof input === "bigint") {
      received = String(input);
      if (input > BigInt(2) ** BigInt(32) || input < -(BigInt(2) ** BigInt(32))) {
        received = addNumericalSeparator(received);
      }
      received += "n";
    }
    msg += ` It must be ${range}. Received ${received}`;
    return msg;
  }, RangeError);
  function addNumericalSeparator(val) {
    let res = "";
    let i = val.length;
    const start = val[0] === "-" ? 1 : 0;
    for (; i >= start + 4; i -= 3) {
      res = `_${val.slice(i - 3, i)}${res}`;
    }
    return `${val.slice(0, i)}${res}`;
  }
  function checkBounds(buf, offset, byteLength2) {
    validateNumber(offset, "offset");
    if (buf[offset] === void 0 || buf[offset + byteLength2] === void 0) {
      boundsError(offset, buf.length - (byteLength2 + 1));
    }
  }
  function checkIntBI(value, min, max, buf, offset, byteLength2) {
    if (value > max || value < min) {
      const n = typeof min === "bigint" ? "n" : "";
      let range;
      {
        if (min === 0 || min === BigInt(0)) {
          range = `>= 0${n} and < 2${n} ** ${(byteLength2 + 1) * 8}${n}`;
        } else {
          range = `>= -(2${n} ** ${(byteLength2 + 1) * 8 - 1}${n}) and < 2 ** ${(byteLength2 + 1) * 8 - 1}${n}`;
        }
      }
      throw new errors.ERR_OUT_OF_RANGE("value", range, value);
    }
    checkBounds(buf, offset, byteLength2);
  }
  function validateNumber(value, name) {
    if (typeof value !== "number") {
      throw new errors.ERR_INVALID_ARG_TYPE(name, "number", value);
    }
  }
  function boundsError(value, length, type) {
    if (Math.floor(value) !== value) {
      validateNumber(value, type);
      throw new errors.ERR_OUT_OF_RANGE("offset", "an integer", value);
    }
    if (length < 0) {
      throw new errors.ERR_BUFFER_OUT_OF_BOUNDS();
    }
    throw new errors.ERR_OUT_OF_RANGE("offset", `>= ${0} and <= ${length}`, value);
  }
  const INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g;
  function base64clean(str) {
    str = str.split("=")[0];
    str = str.trim().replace(INVALID_BASE64_RE, "");
    if (str.length < 2) return "";
    while (str.length % 4 !== 0) {
      str = str + "=";
    }
    return str;
  }
  function utf8ToBytes(string, units) {
    units = units || Infinity;
    let codePoint;
    const length = string.length;
    let leadSurrogate = null;
    const bytes = [];
    for (let i = 0; i < length; ++i) {
      codePoint = string.charCodeAt(i);
      if (codePoint > 55295 && codePoint < 57344) {
        if (!leadSurrogate) {
          if (codePoint > 56319) {
            if ((units -= 3) > -1) bytes.push(239, 191, 189);
            continue;
          } else if (i + 1 === length) {
            if ((units -= 3) > -1) bytes.push(239, 191, 189);
            continue;
          }
          leadSurrogate = codePoint;
          continue;
        }
        if (codePoint < 56320) {
          if ((units -= 3) > -1) bytes.push(239, 191, 189);
          leadSurrogate = codePoint;
          continue;
        }
        codePoint = (leadSurrogate - 55296 << 10 | codePoint - 56320) + 65536;
      } else if (leadSurrogate) {
        if ((units -= 3) > -1) bytes.push(239, 191, 189);
      }
      leadSurrogate = null;
      if (codePoint < 128) {
        if ((units -= 1) < 0) break;
        bytes.push(codePoint);
      } else if (codePoint < 2048) {
        if ((units -= 2) < 0) break;
        bytes.push(codePoint >> 6 | 192, codePoint & 63 | 128);
      } else if (codePoint < 65536) {
        if ((units -= 3) < 0) break;
        bytes.push(codePoint >> 12 | 224, codePoint >> 6 & 63 | 128, codePoint & 63 | 128);
      } else if (codePoint < 1114112) {
        if ((units -= 4) < 0) break;
        bytes.push(codePoint >> 18 | 240, codePoint >> 12 & 63 | 128, codePoint >> 6 & 63 | 128, codePoint & 63 | 128);
      } else {
        throw new Error("Invalid code point");
      }
    }
    return bytes;
  }
  function asciiToBytes(str) {
    const byteArray = [];
    for (let i = 0; i < str.length; ++i) {
      byteArray.push(str.charCodeAt(i) & 255);
    }
    return byteArray;
  }
  function utf16leToBytes(str, units) {
    let c, hi, lo;
    const byteArray = [];
    for (let i = 0; i < str.length; ++i) {
      if ((units -= 2) < 0) break;
      c = str.charCodeAt(i);
      hi = c >> 8;
      lo = c % 256;
      byteArray.push(lo);
      byteArray.push(hi);
    }
    return byteArray;
  }
  function base64ToBytes(str) {
    return base64.toByteArray(base64clean(str));
  }
  function blitBuffer(src, dst, offset, length) {
    let i;
    for (i = 0; i < length; ++i) {
      if (i + offset >= dst.length || i >= src.length) break;
      dst[i + offset] = src[i];
    }
    return i;
  }
  function isInstance(obj, type) {
    return obj instanceof type || obj != null && obj.constructor != null && obj.constructor.name != null && obj.constructor.name === type.name;
  }
  function numberIsNaN(obj) {
    return obj !== obj;
  }
  const hexSliceLookupTable = function() {
    const alphabet = "0123456789abcdef";
    const table = new Array(256);
    for (let i = 0; i < 16; ++i) {
      const i16 = i * 16;
      for (let j = 0; j < 16; ++j) {
        table[i16 + j] = alphabet[i] + alphabet[j];
      }
    }
    return table;
  }();
  function defineBigIntMethod(fn) {
    return typeof BigInt === "undefined" ? BufferBigIntNotDefined : fn;
  }
  function BufferBigIntNotDefined() {
    throw new Error("BigInt not supported");
  }
  return exports;
}
var exports$2, _dewExec$2, exports$1, _dewExec$1, exports, _dewExec, exports2, Buffer2, INSPECT_MAX_BYTES, kMaxLength;
var init_node_buffer = __esm({
  "node-modules-polyfills:node:buffer"() {
    init_Buffer();
    exports$2 = {};
    _dewExec$2 = false;
    exports$1 = {};
    _dewExec$1 = false;
    exports = {};
    _dewExec = false;
    exports2 = dew();
    exports2["Buffer"];
    exports2["SlowBuffer"];
    exports2["INSPECT_MAX_BYTES"];
    exports2["kMaxLength"];
    Buffer2 = exports2.Buffer;
    INSPECT_MAX_BYTES = exports2.INSPECT_MAX_BYTES;
    kMaxLength = exports2.kMaxLength;
  }
});

// node_modules/.deno/esbuild-plugins-node-modules-polyfill@1.7.1/node_modules/esbuild-plugins-node-modules-polyfill/globals/Buffer.js
var init_Buffer = __esm({
  "node_modules/.deno/esbuild-plugins-node-modules-polyfill@1.7.1/node_modules/esbuild-plugins-node-modules-polyfill/globals/Buffer.js"() {
    init_node_buffer();
  }
});

export {
  __require,
  __esm,
  __commonJS,
  __export,
  __toESM,
  __toCommonJS,
  __using,
  __callDispose,
  Buffer2 as Buffer,
  init_Buffer
};
/*! Bundled license information:

@jspm/core/nodelibs/browser/chunk-DtuTasat.js:
  (*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> *)
*/
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibm9kZS1tb2R1bGVzLXBvbHlmaWxsczpub2RlOmJ1ZmZlciIsICIuLi8uLi9ub2RlX21vZHVsZXMvLmRlbm8vZXNidWlsZC1wbHVnaW5zLW5vZGUtbW9kdWxlcy1wb2x5ZmlsbEAxLjcuMS9ub2RlX21vZHVsZXMvZXNidWlsZC1wbHVnaW5zLW5vZGUtbW9kdWxlcy1wb2x5ZmlsbC9nbG9iYWxzL0J1ZmZlci5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLy8gbm9kZV9tb2R1bGVzLy5kZW5vL0Bqc3BtK2NvcmVAMi4xLjAvbm9kZV9tb2R1bGVzL0Bqc3BtL2NvcmUvbm9kZWxpYnMvYnJvd3Nlci9jaHVuay1EdHVUYXNhdC5qc1xudmFyIGV4cG9ydHMkMiA9IHt9O1xudmFyIF9kZXdFeGVjJDIgPSBmYWxzZTtcbmZ1bmN0aW9uIGRldyQyKCkge1xuICBpZiAoX2Rld0V4ZWMkMikgcmV0dXJuIGV4cG9ydHMkMjtcbiAgX2Rld0V4ZWMkMiA9IHRydWU7XG4gIGV4cG9ydHMkMi5ieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aDtcbiAgZXhwb3J0cyQyLnRvQnl0ZUFycmF5ID0gdG9CeXRlQXJyYXk7XG4gIGV4cG9ydHMkMi5mcm9tQnl0ZUFycmF5ID0gZnJvbUJ5dGVBcnJheTtcbiAgdmFyIGxvb2t1cCA9IFtdO1xuICB2YXIgcmV2TG9va3VwID0gW107XG4gIHZhciBBcnIgPSB0eXBlb2YgVWludDhBcnJheSAhPT0gXCJ1bmRlZmluZWRcIiA/IFVpbnQ4QXJyYXkgOiBBcnJheTtcbiAgdmFyIGNvZGUgPSBcIkFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5Ky9cIjtcbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGNvZGUubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICBsb29rdXBbaV0gPSBjb2RlW2ldO1xuICAgIHJldkxvb2t1cFtjb2RlLmNoYXJDb2RlQXQoaSldID0gaTtcbiAgfVxuICByZXZMb29rdXBbXCItXCIuY2hhckNvZGVBdCgwKV0gPSA2MjtcbiAgcmV2TG9va3VwW1wiX1wiLmNoYXJDb2RlQXQoMCldID0gNjM7XG4gIGZ1bmN0aW9uIGdldExlbnMoYjY0KSB7XG4gICAgdmFyIGxlbjIgPSBiNjQubGVuZ3RoO1xuICAgIGlmIChsZW4yICUgNCA+IDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgc3RyaW5nLiBMZW5ndGggbXVzdCBiZSBhIG11bHRpcGxlIG9mIDRcIik7XG4gICAgfVxuICAgIHZhciB2YWxpZExlbiA9IGI2NC5pbmRleE9mKFwiPVwiKTtcbiAgICBpZiAodmFsaWRMZW4gPT09IC0xKSB2YWxpZExlbiA9IGxlbjI7XG4gICAgdmFyIHBsYWNlSG9sZGVyc0xlbiA9IHZhbGlkTGVuID09PSBsZW4yID8gMCA6IDQgLSB2YWxpZExlbiAlIDQ7XG4gICAgcmV0dXJuIFt2YWxpZExlbiwgcGxhY2VIb2xkZXJzTGVuXTtcbiAgfVxuICBmdW5jdGlvbiBieXRlTGVuZ3RoKGI2NCkge1xuICAgIHZhciBsZW5zID0gZ2V0TGVucyhiNjQpO1xuICAgIHZhciB2YWxpZExlbiA9IGxlbnNbMF07XG4gICAgdmFyIHBsYWNlSG9sZGVyc0xlbiA9IGxlbnNbMV07XG4gICAgcmV0dXJuICh2YWxpZExlbiArIHBsYWNlSG9sZGVyc0xlbikgKiAzIC8gNCAtIHBsYWNlSG9sZGVyc0xlbjtcbiAgfVxuICBmdW5jdGlvbiBfYnl0ZUxlbmd0aChiNjQsIHZhbGlkTGVuLCBwbGFjZUhvbGRlcnNMZW4pIHtcbiAgICByZXR1cm4gKHZhbGlkTGVuICsgcGxhY2VIb2xkZXJzTGVuKSAqIDMgLyA0IC0gcGxhY2VIb2xkZXJzTGVuO1xuICB9XG4gIGZ1bmN0aW9uIHRvQnl0ZUFycmF5KGI2NCkge1xuICAgIHZhciB0bXA7XG4gICAgdmFyIGxlbnMgPSBnZXRMZW5zKGI2NCk7XG4gICAgdmFyIHZhbGlkTGVuID0gbGVuc1swXTtcbiAgICB2YXIgcGxhY2VIb2xkZXJzTGVuID0gbGVuc1sxXTtcbiAgICB2YXIgYXJyID0gbmV3IEFycihfYnl0ZUxlbmd0aChiNjQsIHZhbGlkTGVuLCBwbGFjZUhvbGRlcnNMZW4pKTtcbiAgICB2YXIgY3VyQnl0ZSA9IDA7XG4gICAgdmFyIGxlbjIgPSBwbGFjZUhvbGRlcnNMZW4gPiAwID8gdmFsaWRMZW4gLSA0IDogdmFsaWRMZW47XG4gICAgdmFyIGkyO1xuICAgIGZvciAoaTIgPSAwOyBpMiA8IGxlbjI7IGkyICs9IDQpIHtcbiAgICAgIHRtcCA9IHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpMildIDw8IDE4IHwgcmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkyICsgMSldIDw8IDEyIHwgcmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkyICsgMildIDw8IDYgfCByZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaTIgKyAzKV07XG4gICAgICBhcnJbY3VyQnl0ZSsrXSA9IHRtcCA+PiAxNiAmIDI1NTtcbiAgICAgIGFycltjdXJCeXRlKytdID0gdG1wID4+IDggJiAyNTU7XG4gICAgICBhcnJbY3VyQnl0ZSsrXSA9IHRtcCAmIDI1NTtcbiAgICB9XG4gICAgaWYgKHBsYWNlSG9sZGVyc0xlbiA9PT0gMikge1xuICAgICAgdG1wID0gcmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkyKV0gPDwgMiB8IHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpMiArIDEpXSA+PiA0O1xuICAgICAgYXJyW2N1ckJ5dGUrK10gPSB0bXAgJiAyNTU7XG4gICAgfVxuICAgIGlmIChwbGFjZUhvbGRlcnNMZW4gPT09IDEpIHtcbiAgICAgIHRtcCA9IHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpMildIDw8IDEwIHwgcmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkyICsgMSldIDw8IDQgfCByZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaTIgKyAyKV0gPj4gMjtcbiAgICAgIGFycltjdXJCeXRlKytdID0gdG1wID4+IDggJiAyNTU7XG4gICAgICBhcnJbY3VyQnl0ZSsrXSA9IHRtcCAmIDI1NTtcbiAgICB9XG4gICAgcmV0dXJuIGFycjtcbiAgfVxuICBmdW5jdGlvbiB0cmlwbGV0VG9CYXNlNjQobnVtKSB7XG4gICAgcmV0dXJuIGxvb2t1cFtudW0gPj4gMTggJiA2M10gKyBsb29rdXBbbnVtID4+IDEyICYgNjNdICsgbG9va3VwW251bSA+PiA2ICYgNjNdICsgbG9va3VwW251bSAmIDYzXTtcbiAgfVxuICBmdW5jdGlvbiBlbmNvZGVDaHVuayh1aW50OCwgc3RhcnQsIGVuZCkge1xuICAgIHZhciB0bXA7XG4gICAgdmFyIG91dHB1dCA9IFtdO1xuICAgIGZvciAodmFyIGkyID0gc3RhcnQ7IGkyIDwgZW5kOyBpMiArPSAzKSB7XG4gICAgICB0bXAgPSAodWludDhbaTJdIDw8IDE2ICYgMTY3MTE2ODApICsgKHVpbnQ4W2kyICsgMV0gPDwgOCAmIDY1MjgwKSArICh1aW50OFtpMiArIDJdICYgMjU1KTtcbiAgICAgIG91dHB1dC5wdXNoKHRyaXBsZXRUb0Jhc2U2NCh0bXApKTtcbiAgICB9XG4gICAgcmV0dXJuIG91dHB1dC5qb2luKFwiXCIpO1xuICB9XG4gIGZ1bmN0aW9uIGZyb21CeXRlQXJyYXkodWludDgpIHtcbiAgICB2YXIgdG1wO1xuICAgIHZhciBsZW4yID0gdWludDgubGVuZ3RoO1xuICAgIHZhciBleHRyYUJ5dGVzID0gbGVuMiAlIDM7XG4gICAgdmFyIHBhcnRzID0gW107XG4gICAgdmFyIG1heENodW5rTGVuZ3RoID0gMTYzODM7XG4gICAgZm9yICh2YXIgaTIgPSAwLCBsZW4yMiA9IGxlbjIgLSBleHRyYUJ5dGVzOyBpMiA8IGxlbjIyOyBpMiArPSBtYXhDaHVua0xlbmd0aCkge1xuICAgICAgcGFydHMucHVzaChlbmNvZGVDaHVuayh1aW50OCwgaTIsIGkyICsgbWF4Q2h1bmtMZW5ndGggPiBsZW4yMiA/IGxlbjIyIDogaTIgKyBtYXhDaHVua0xlbmd0aCkpO1xuICAgIH1cbiAgICBpZiAoZXh0cmFCeXRlcyA9PT0gMSkge1xuICAgICAgdG1wID0gdWludDhbbGVuMiAtIDFdO1xuICAgICAgcGFydHMucHVzaChsb29rdXBbdG1wID4+IDJdICsgbG9va3VwW3RtcCA8PCA0ICYgNjNdICsgXCI9PVwiKTtcbiAgICB9IGVsc2UgaWYgKGV4dHJhQnl0ZXMgPT09IDIpIHtcbiAgICAgIHRtcCA9ICh1aW50OFtsZW4yIC0gMl0gPDwgOCkgKyB1aW50OFtsZW4yIC0gMV07XG4gICAgICBwYXJ0cy5wdXNoKGxvb2t1cFt0bXAgPj4gMTBdICsgbG9va3VwW3RtcCA+PiA0ICYgNjNdICsgbG9va3VwW3RtcCA8PCAyICYgNjNdICsgXCI9XCIpO1xuICAgIH1cbiAgICByZXR1cm4gcGFydHMuam9pbihcIlwiKTtcbiAgfVxuICByZXR1cm4gZXhwb3J0cyQyO1xufVxudmFyIGV4cG9ydHMkMSA9IHt9O1xudmFyIF9kZXdFeGVjJDEgPSBmYWxzZTtcbmZ1bmN0aW9uIGRldyQxKCkge1xuICBpZiAoX2Rld0V4ZWMkMSkgcmV0dXJuIGV4cG9ydHMkMTtcbiAgX2Rld0V4ZWMkMSA9IHRydWU7XG4gIGV4cG9ydHMkMS5yZWFkID0gZnVuY3Rpb24oYnVmZmVyLCBvZmZzZXQsIGlzTEUsIG1MZW4sIG5CeXRlcykge1xuICAgIHZhciBlLCBtO1xuICAgIHZhciBlTGVuID0gbkJ5dGVzICogOCAtIG1MZW4gLSAxO1xuICAgIHZhciBlTWF4ID0gKDEgPDwgZUxlbikgLSAxO1xuICAgIHZhciBlQmlhcyA9IGVNYXggPj4gMTtcbiAgICB2YXIgbkJpdHMgPSAtNztcbiAgICB2YXIgaSA9IGlzTEUgPyBuQnl0ZXMgLSAxIDogMDtcbiAgICB2YXIgZCA9IGlzTEUgPyAtMSA6IDE7XG4gICAgdmFyIHMgPSBidWZmZXJbb2Zmc2V0ICsgaV07XG4gICAgaSArPSBkO1xuICAgIGUgPSBzICYgKDEgPDwgLW5CaXRzKSAtIDE7XG4gICAgcyA+Pj0gLW5CaXRzO1xuICAgIG5CaXRzICs9IGVMZW47XG4gICAgZm9yICg7IG5CaXRzID4gMDsgZSA9IGUgKiAyNTYgKyBidWZmZXJbb2Zmc2V0ICsgaV0sIGkgKz0gZCwgbkJpdHMgLT0gOCkge1xuICAgIH1cbiAgICBtID0gZSAmICgxIDw8IC1uQml0cykgLSAxO1xuICAgIGUgPj49IC1uQml0cztcbiAgICBuQml0cyArPSBtTGVuO1xuICAgIGZvciAoOyBuQml0cyA+IDA7IG0gPSBtICogMjU2ICsgYnVmZmVyW29mZnNldCArIGldLCBpICs9IGQsIG5CaXRzIC09IDgpIHtcbiAgICB9XG4gICAgaWYgKGUgPT09IDApIHtcbiAgICAgIGUgPSAxIC0gZUJpYXM7XG4gICAgfSBlbHNlIGlmIChlID09PSBlTWF4KSB7XG4gICAgICByZXR1cm4gbSA/IE5hTiA6IChzID8gLTEgOiAxKSAqIEluZmluaXR5O1xuICAgIH0gZWxzZSB7XG4gICAgICBtID0gbSArIE1hdGgucG93KDIsIG1MZW4pO1xuICAgICAgZSA9IGUgLSBlQmlhcztcbiAgICB9XG4gICAgcmV0dXJuIChzID8gLTEgOiAxKSAqIG0gKiBNYXRoLnBvdygyLCBlIC0gbUxlbik7XG4gIH07XG4gIGV4cG9ydHMkMS53cml0ZSA9IGZ1bmN0aW9uKGJ1ZmZlciwgdmFsdWUsIG9mZnNldCwgaXNMRSwgbUxlbiwgbkJ5dGVzKSB7XG4gICAgdmFyIGUsIG0sIGM7XG4gICAgdmFyIGVMZW4gPSBuQnl0ZXMgKiA4IC0gbUxlbiAtIDE7XG4gICAgdmFyIGVNYXggPSAoMSA8PCBlTGVuKSAtIDE7XG4gICAgdmFyIGVCaWFzID0gZU1heCA+PiAxO1xuICAgIHZhciBydCA9IG1MZW4gPT09IDIzID8gTWF0aC5wb3coMiwgLTI0KSAtIE1hdGgucG93KDIsIC03NykgOiAwO1xuICAgIHZhciBpID0gaXNMRSA/IDAgOiBuQnl0ZXMgLSAxO1xuICAgIHZhciBkID0gaXNMRSA/IDEgOiAtMTtcbiAgICB2YXIgcyA9IHZhbHVlIDwgMCB8fCB2YWx1ZSA9PT0gMCAmJiAxIC8gdmFsdWUgPCAwID8gMSA6IDA7XG4gICAgdmFsdWUgPSBNYXRoLmFicyh2YWx1ZSk7XG4gICAgaWYgKGlzTmFOKHZhbHVlKSB8fCB2YWx1ZSA9PT0gSW5maW5pdHkpIHtcbiAgICAgIG0gPSBpc05hTih2YWx1ZSkgPyAxIDogMDtcbiAgICAgIGUgPSBlTWF4O1xuICAgIH0gZWxzZSB7XG4gICAgICBlID0gTWF0aC5mbG9vcihNYXRoLmxvZyh2YWx1ZSkgLyBNYXRoLkxOMik7XG4gICAgICBpZiAodmFsdWUgKiAoYyA9IE1hdGgucG93KDIsIC1lKSkgPCAxKSB7XG4gICAgICAgIGUtLTtcbiAgICAgICAgYyAqPSAyO1xuICAgICAgfVxuICAgICAgaWYgKGUgKyBlQmlhcyA+PSAxKSB7XG4gICAgICAgIHZhbHVlICs9IHJ0IC8gYztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhbHVlICs9IHJ0ICogTWF0aC5wb3coMiwgMSAtIGVCaWFzKTtcbiAgICAgIH1cbiAgICAgIGlmICh2YWx1ZSAqIGMgPj0gMikge1xuICAgICAgICBlKys7XG4gICAgICAgIGMgLz0gMjtcbiAgICAgIH1cbiAgICAgIGlmIChlICsgZUJpYXMgPj0gZU1heCkge1xuICAgICAgICBtID0gMDtcbiAgICAgICAgZSA9IGVNYXg7XG4gICAgICB9IGVsc2UgaWYgKGUgKyBlQmlhcyA+PSAxKSB7XG4gICAgICAgIG0gPSAodmFsdWUgKiBjIC0gMSkgKiBNYXRoLnBvdygyLCBtTGVuKTtcbiAgICAgICAgZSA9IGUgKyBlQmlhcztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG0gPSB2YWx1ZSAqIE1hdGgucG93KDIsIGVCaWFzIC0gMSkgKiBNYXRoLnBvdygyLCBtTGVuKTtcbiAgICAgICAgZSA9IDA7XG4gICAgICB9XG4gICAgfVxuICAgIGZvciAoOyBtTGVuID49IDg7IGJ1ZmZlcltvZmZzZXQgKyBpXSA9IG0gJiAyNTUsIGkgKz0gZCwgbSAvPSAyNTYsIG1MZW4gLT0gOCkge1xuICAgIH1cbiAgICBlID0gZSA8PCBtTGVuIHwgbTtcbiAgICBlTGVuICs9IG1MZW47XG4gICAgZm9yICg7IGVMZW4gPiAwOyBidWZmZXJbb2Zmc2V0ICsgaV0gPSBlICYgMjU1LCBpICs9IGQsIGUgLz0gMjU2LCBlTGVuIC09IDgpIHtcbiAgICB9XG4gICAgYnVmZmVyW29mZnNldCArIGkgLSBkXSB8PSBzICogMTI4O1xuICB9O1xuICByZXR1cm4gZXhwb3J0cyQxO1xufVxudmFyIGV4cG9ydHMgPSB7fTtcbnZhciBfZGV3RXhlYyA9IGZhbHNlO1xuZnVuY3Rpb24gZGV3KCkge1xuICBpZiAoX2Rld0V4ZWMpIHJldHVybiBleHBvcnRzO1xuICBfZGV3RXhlYyA9IHRydWU7XG4gIGNvbnN0IGJhc2U2NCA9IGRldyQyKCk7XG4gIGNvbnN0IGllZWU3NTQgPSBkZXckMSgpO1xuICBjb25zdCBjdXN0b21JbnNwZWN0U3ltYm9sID0gdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIHR5cGVvZiBTeW1ib2xbXCJmb3JcIl0gPT09IFwiZnVuY3Rpb25cIiA/IFN5bWJvbFtcImZvclwiXShcIm5vZGVqcy51dGlsLmluc3BlY3QuY3VzdG9tXCIpIDogbnVsbDtcbiAgZXhwb3J0cy5CdWZmZXIgPSBCdWZmZXIyO1xuICBleHBvcnRzLlNsb3dCdWZmZXIgPSBTbG93QnVmZmVyO1xuICBleHBvcnRzLklOU1BFQ1RfTUFYX0JZVEVTID0gNTA7XG4gIGNvbnN0IEtfTUFYX0xFTkdUSCA9IDIxNDc0ODM2NDc7XG4gIGV4cG9ydHMua01heExlbmd0aCA9IEtfTUFYX0xFTkdUSDtcbiAgQnVmZmVyMi5UWVBFRF9BUlJBWV9TVVBQT1JUID0gdHlwZWRBcnJheVN1cHBvcnQoKTtcbiAgaWYgKCFCdWZmZXIyLlRZUEVEX0FSUkFZX1NVUFBPUlQgJiYgdHlwZW9mIGNvbnNvbGUgIT09IFwidW5kZWZpbmVkXCIgJiYgdHlwZW9mIGNvbnNvbGUuZXJyb3IgPT09IFwiZnVuY3Rpb25cIikge1xuICAgIGNvbnNvbGUuZXJyb3IoXCJUaGlzIGJyb3dzZXIgbGFja3MgdHlwZWQgYXJyYXkgKFVpbnQ4QXJyYXkpIHN1cHBvcnQgd2hpY2ggaXMgcmVxdWlyZWQgYnkgYGJ1ZmZlcmAgdjUueC4gVXNlIGBidWZmZXJgIHY0LnggaWYgeW91IHJlcXVpcmUgb2xkIGJyb3dzZXIgc3VwcG9ydC5cIik7XG4gIH1cbiAgZnVuY3Rpb24gdHlwZWRBcnJheVN1cHBvcnQoKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGFyciA9IG5ldyBVaW50OEFycmF5KDEpO1xuICAgICAgY29uc3QgcHJvdG8gPSB7XG4gICAgICAgIGZvbzogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIDQyO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgT2JqZWN0LnNldFByb3RvdHlwZU9mKHByb3RvLCBVaW50OEFycmF5LnByb3RvdHlwZSk7XG4gICAgICBPYmplY3Quc2V0UHJvdG90eXBlT2YoYXJyLCBwcm90byk7XG4gICAgICByZXR1cm4gYXJyLmZvbygpID09PSA0MjtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShCdWZmZXIyLnByb3RvdHlwZSwgXCJwYXJlbnRcIiwge1xuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgIGlmICghQnVmZmVyMi5pc0J1ZmZlcih0aGlzKSkgcmV0dXJuIHZvaWQgMDtcbiAgICAgIHJldHVybiB0aGlzLmJ1ZmZlcjtcbiAgICB9XG4gIH0pO1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoQnVmZmVyMi5wcm90b3R5cGUsIFwib2Zmc2V0XCIsIHtcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoIUJ1ZmZlcjIuaXNCdWZmZXIodGhpcykpIHJldHVybiB2b2lkIDA7XG4gICAgICByZXR1cm4gdGhpcy5ieXRlT2Zmc2V0O1xuICAgIH1cbiAgfSk7XG4gIGZ1bmN0aW9uIGNyZWF0ZUJ1ZmZlcihsZW5ndGgpIHtcbiAgICBpZiAobGVuZ3RoID4gS19NQVhfTEVOR1RIKSB7XG4gICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignVGhlIHZhbHVlIFwiJyArIGxlbmd0aCArICdcIiBpcyBpbnZhbGlkIGZvciBvcHRpb24gXCJzaXplXCInKTtcbiAgICB9XG4gICAgY29uc3QgYnVmID0gbmV3IFVpbnQ4QXJyYXkobGVuZ3RoKTtcbiAgICBPYmplY3Quc2V0UHJvdG90eXBlT2YoYnVmLCBCdWZmZXIyLnByb3RvdHlwZSk7XG4gICAgcmV0dXJuIGJ1ZjtcbiAgfVxuICBmdW5jdGlvbiBCdWZmZXIyKGFyZywgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKSB7XG4gICAgaWYgKHR5cGVvZiBhcmcgPT09IFwibnVtYmVyXCIpIHtcbiAgICAgIGlmICh0eXBlb2YgZW5jb2RpbmdPck9mZnNldCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdUaGUgXCJzdHJpbmdcIiBhcmd1bWVudCBtdXN0IGJlIG9mIHR5cGUgc3RyaW5nLiBSZWNlaXZlZCB0eXBlIG51bWJlcicpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGFsbG9jVW5zYWZlKGFyZyk7XG4gICAgfVxuICAgIHJldHVybiBmcm9tKGFyZywgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKTtcbiAgfVxuICBCdWZmZXIyLnBvb2xTaXplID0gODE5MjtcbiAgZnVuY3Rpb24gZnJvbSh2YWx1ZSwgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKSB7XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgcmV0dXJuIGZyb21TdHJpbmcodmFsdWUsIGVuY29kaW5nT3JPZmZzZXQpO1xuICAgIH1cbiAgICBpZiAoQXJyYXlCdWZmZXIuaXNWaWV3KHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGZyb21BcnJheVZpZXcodmFsdWUpO1xuICAgIH1cbiAgICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlRoZSBmaXJzdCBhcmd1bWVudCBtdXN0IGJlIG9uZSBvZiB0eXBlIHN0cmluZywgQnVmZmVyLCBBcnJheUJ1ZmZlciwgQXJyYXksIG9yIEFycmF5LWxpa2UgT2JqZWN0LiBSZWNlaXZlZCB0eXBlIFwiICsgdHlwZW9mIHZhbHVlKTtcbiAgICB9XG4gICAgaWYgKGlzSW5zdGFuY2UodmFsdWUsIEFycmF5QnVmZmVyKSB8fCB2YWx1ZSAmJiBpc0luc3RhbmNlKHZhbHVlLmJ1ZmZlciwgQXJyYXlCdWZmZXIpKSB7XG4gICAgICByZXR1cm4gZnJvbUFycmF5QnVmZmVyKHZhbHVlLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIFNoYXJlZEFycmF5QnVmZmVyICE9PSBcInVuZGVmaW5lZFwiICYmIChpc0luc3RhbmNlKHZhbHVlLCBTaGFyZWRBcnJheUJ1ZmZlcikgfHwgdmFsdWUgJiYgaXNJbnN0YW5jZSh2YWx1ZS5idWZmZXIsIFNoYXJlZEFycmF5QnVmZmVyKSkpIHtcbiAgICAgIHJldHVybiBmcm9tQXJyYXlCdWZmZXIodmFsdWUsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aCk7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09IFwibnVtYmVyXCIpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1RoZSBcInZhbHVlXCIgYXJndW1lbnQgbXVzdCBub3QgYmUgb2YgdHlwZSBudW1iZXIuIFJlY2VpdmVkIHR5cGUgbnVtYmVyJyk7XG4gICAgfVxuICAgIGNvbnN0IHZhbHVlT2YgPSB2YWx1ZS52YWx1ZU9mICYmIHZhbHVlLnZhbHVlT2YoKTtcbiAgICBpZiAodmFsdWVPZiAhPSBudWxsICYmIHZhbHVlT2YgIT09IHZhbHVlKSB7XG4gICAgICByZXR1cm4gQnVmZmVyMi5mcm9tKHZhbHVlT2YsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aCk7XG4gICAgfVxuICAgIGNvbnN0IGIgPSBmcm9tT2JqZWN0KHZhbHVlKTtcbiAgICBpZiAoYikgcmV0dXJuIGI7XG4gICAgaWYgKHR5cGVvZiBTeW1ib2wgIT09IFwidW5kZWZpbmVkXCIgJiYgU3ltYm9sLnRvUHJpbWl0aXZlICE9IG51bGwgJiYgdHlwZW9mIHZhbHVlW1N5bWJvbC50b1ByaW1pdGl2ZV0gPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgcmV0dXJuIEJ1ZmZlcjIuZnJvbSh2YWx1ZVtTeW1ib2wudG9QcmltaXRpdmVdKFwic3RyaW5nXCIpLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpO1xuICAgIH1cbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiVGhlIGZpcnN0IGFyZ3VtZW50IG11c3QgYmUgb25lIG9mIHR5cGUgc3RyaW5nLCBCdWZmZXIsIEFycmF5QnVmZmVyLCBBcnJheSwgb3IgQXJyYXktbGlrZSBPYmplY3QuIFJlY2VpdmVkIHR5cGUgXCIgKyB0eXBlb2YgdmFsdWUpO1xuICB9XG4gIEJ1ZmZlcjIuZnJvbSA9IGZ1bmN0aW9uKHZhbHVlLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpIHtcbiAgICByZXR1cm4gZnJvbSh2YWx1ZSwgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKTtcbiAgfTtcbiAgT2JqZWN0LnNldFByb3RvdHlwZU9mKEJ1ZmZlcjIucHJvdG90eXBlLCBVaW50OEFycmF5LnByb3RvdHlwZSk7XG4gIE9iamVjdC5zZXRQcm90b3R5cGVPZihCdWZmZXIyLCBVaW50OEFycmF5KTtcbiAgZnVuY3Rpb24gYXNzZXJ0U2l6ZShzaXplKSB7XG4gICAgaWYgKHR5cGVvZiBzaXplICE9PSBcIm51bWJlclwiKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdcInNpemVcIiBhcmd1bWVudCBtdXN0IGJlIG9mIHR5cGUgbnVtYmVyJyk7XG4gICAgfSBlbHNlIGlmIChzaXplIDwgMCkge1xuICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1RoZSB2YWx1ZSBcIicgKyBzaXplICsgJ1wiIGlzIGludmFsaWQgZm9yIG9wdGlvbiBcInNpemVcIicpO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBhbGxvYyhzaXplLCBmaWxsLCBlbmNvZGluZykge1xuICAgIGFzc2VydFNpemUoc2l6ZSk7XG4gICAgaWYgKHNpemUgPD0gMCkge1xuICAgICAgcmV0dXJuIGNyZWF0ZUJ1ZmZlcihzaXplKTtcbiAgICB9XG4gICAgaWYgKGZpbGwgIT09IHZvaWQgMCkge1xuICAgICAgcmV0dXJuIHR5cGVvZiBlbmNvZGluZyA9PT0gXCJzdHJpbmdcIiA/IGNyZWF0ZUJ1ZmZlcihzaXplKS5maWxsKGZpbGwsIGVuY29kaW5nKSA6IGNyZWF0ZUJ1ZmZlcihzaXplKS5maWxsKGZpbGwpO1xuICAgIH1cbiAgICByZXR1cm4gY3JlYXRlQnVmZmVyKHNpemUpO1xuICB9XG4gIEJ1ZmZlcjIuYWxsb2MgPSBmdW5jdGlvbihzaXplLCBmaWxsLCBlbmNvZGluZykge1xuICAgIHJldHVybiBhbGxvYyhzaXplLCBmaWxsLCBlbmNvZGluZyk7XG4gIH07XG4gIGZ1bmN0aW9uIGFsbG9jVW5zYWZlKHNpemUpIHtcbiAgICBhc3NlcnRTaXplKHNpemUpO1xuICAgIHJldHVybiBjcmVhdGVCdWZmZXIoc2l6ZSA8IDAgPyAwIDogY2hlY2tlZChzaXplKSB8IDApO1xuICB9XG4gIEJ1ZmZlcjIuYWxsb2NVbnNhZmUgPSBmdW5jdGlvbihzaXplKSB7XG4gICAgcmV0dXJuIGFsbG9jVW5zYWZlKHNpemUpO1xuICB9O1xuICBCdWZmZXIyLmFsbG9jVW5zYWZlU2xvdyA9IGZ1bmN0aW9uKHNpemUpIHtcbiAgICByZXR1cm4gYWxsb2NVbnNhZmUoc2l6ZSk7XG4gIH07XG4gIGZ1bmN0aW9uIGZyb21TdHJpbmcoc3RyaW5nLCBlbmNvZGluZykge1xuICAgIGlmICh0eXBlb2YgZW5jb2RpbmcgIT09IFwic3RyaW5nXCIgfHwgZW5jb2RpbmcgPT09IFwiXCIpIHtcbiAgICAgIGVuY29kaW5nID0gXCJ1dGY4XCI7XG4gICAgfVxuICAgIGlmICghQnVmZmVyMi5pc0VuY29kaW5nKGVuY29kaW5nKSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlVua25vd24gZW5jb2Rpbmc6IFwiICsgZW5jb2RpbmcpO1xuICAgIH1cbiAgICBjb25zdCBsZW5ndGggPSBieXRlTGVuZ3RoKHN0cmluZywgZW5jb2RpbmcpIHwgMDtcbiAgICBsZXQgYnVmID0gY3JlYXRlQnVmZmVyKGxlbmd0aCk7XG4gICAgY29uc3QgYWN0dWFsID0gYnVmLndyaXRlKHN0cmluZywgZW5jb2RpbmcpO1xuICAgIGlmIChhY3R1YWwgIT09IGxlbmd0aCkge1xuICAgICAgYnVmID0gYnVmLnNsaWNlKDAsIGFjdHVhbCk7XG4gICAgfVxuICAgIHJldHVybiBidWY7XG4gIH1cbiAgZnVuY3Rpb24gZnJvbUFycmF5TGlrZShhcnJheSkge1xuICAgIGNvbnN0IGxlbmd0aCA9IGFycmF5Lmxlbmd0aCA8IDAgPyAwIDogY2hlY2tlZChhcnJheS5sZW5ndGgpIHwgMDtcbiAgICBjb25zdCBidWYgPSBjcmVhdGVCdWZmZXIobGVuZ3RoKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSArPSAxKSB7XG4gICAgICBidWZbaV0gPSBhcnJheVtpXSAmIDI1NTtcbiAgICB9XG4gICAgcmV0dXJuIGJ1ZjtcbiAgfVxuICBmdW5jdGlvbiBmcm9tQXJyYXlWaWV3KGFycmF5Vmlldykge1xuICAgIGlmIChpc0luc3RhbmNlKGFycmF5VmlldywgVWludDhBcnJheSkpIHtcbiAgICAgIGNvbnN0IGNvcHkgPSBuZXcgVWludDhBcnJheShhcnJheVZpZXcpO1xuICAgICAgcmV0dXJuIGZyb21BcnJheUJ1ZmZlcihjb3B5LmJ1ZmZlciwgY29weS5ieXRlT2Zmc2V0LCBjb3B5LmJ5dGVMZW5ndGgpO1xuICAgIH1cbiAgICByZXR1cm4gZnJvbUFycmF5TGlrZShhcnJheVZpZXcpO1xuICB9XG4gIGZ1bmN0aW9uIGZyb21BcnJheUJ1ZmZlcihhcnJheSwgYnl0ZU9mZnNldCwgbGVuZ3RoKSB7XG4gICAgaWYgKGJ5dGVPZmZzZXQgPCAwIHx8IGFycmF5LmJ5dGVMZW5ndGggPCBieXRlT2Zmc2V0KSB7XG4gICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignXCJvZmZzZXRcIiBpcyBvdXRzaWRlIG9mIGJ1ZmZlciBib3VuZHMnKTtcbiAgICB9XG4gICAgaWYgKGFycmF5LmJ5dGVMZW5ndGggPCBieXRlT2Zmc2V0ICsgKGxlbmd0aCB8fCAwKSkge1xuICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1wibGVuZ3RoXCIgaXMgb3V0c2lkZSBvZiBidWZmZXIgYm91bmRzJyk7XG4gICAgfVxuICAgIGxldCBidWY7XG4gICAgaWYgKGJ5dGVPZmZzZXQgPT09IHZvaWQgMCAmJiBsZW5ndGggPT09IHZvaWQgMCkge1xuICAgICAgYnVmID0gbmV3IFVpbnQ4QXJyYXkoYXJyYXkpO1xuICAgIH0gZWxzZSBpZiAobGVuZ3RoID09PSB2b2lkIDApIHtcbiAgICAgIGJ1ZiA9IG5ldyBVaW50OEFycmF5KGFycmF5LCBieXRlT2Zmc2V0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgYnVmID0gbmV3IFVpbnQ4QXJyYXkoYXJyYXksIGJ5dGVPZmZzZXQsIGxlbmd0aCk7XG4gICAgfVxuICAgIE9iamVjdC5zZXRQcm90b3R5cGVPZihidWYsIEJ1ZmZlcjIucHJvdG90eXBlKTtcbiAgICByZXR1cm4gYnVmO1xuICB9XG4gIGZ1bmN0aW9uIGZyb21PYmplY3Qob2JqKSB7XG4gICAgaWYgKEJ1ZmZlcjIuaXNCdWZmZXIob2JqKSkge1xuICAgICAgY29uc3QgbGVuID0gY2hlY2tlZChvYmoubGVuZ3RoKSB8IDA7XG4gICAgICBjb25zdCBidWYgPSBjcmVhdGVCdWZmZXIobGVuKTtcbiAgICAgIGlmIChidWYubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiBidWY7XG4gICAgICB9XG4gICAgICBvYmouY29weShidWYsIDAsIDAsIGxlbik7XG4gICAgICByZXR1cm4gYnVmO1xuICAgIH1cbiAgICBpZiAob2JqLmxlbmd0aCAhPT0gdm9pZCAwKSB7XG4gICAgICBpZiAodHlwZW9mIG9iai5sZW5ndGggIT09IFwibnVtYmVyXCIgfHwgbnVtYmVySXNOYU4ob2JqLmxlbmd0aCkpIHtcbiAgICAgICAgcmV0dXJuIGNyZWF0ZUJ1ZmZlcigwKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmcm9tQXJyYXlMaWtlKG9iaik7XG4gICAgfVxuICAgIGlmIChvYmoudHlwZSA9PT0gXCJCdWZmZXJcIiAmJiBBcnJheS5pc0FycmF5KG9iai5kYXRhKSkge1xuICAgICAgcmV0dXJuIGZyb21BcnJheUxpa2Uob2JqLmRhdGEpO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBjaGVja2VkKGxlbmd0aCkge1xuICAgIGlmIChsZW5ndGggPj0gS19NQVhfTEVOR1RIKSB7XG4gICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcihcIkF0dGVtcHQgdG8gYWxsb2NhdGUgQnVmZmVyIGxhcmdlciB0aGFuIG1heGltdW0gc2l6ZTogMHhcIiArIEtfTUFYX0xFTkdUSC50b1N0cmluZygxNikgKyBcIiBieXRlc1wiKTtcbiAgICB9XG4gICAgcmV0dXJuIGxlbmd0aCB8IDA7XG4gIH1cbiAgZnVuY3Rpb24gU2xvd0J1ZmZlcihsZW5ndGgpIHtcbiAgICBpZiAoK2xlbmd0aCAhPSBsZW5ndGgpIHtcbiAgICAgIGxlbmd0aCA9IDA7XG4gICAgfVxuICAgIHJldHVybiBCdWZmZXIyLmFsbG9jKCtsZW5ndGgpO1xuICB9XG4gIEJ1ZmZlcjIuaXNCdWZmZXIgPSBmdW5jdGlvbiBpc0J1ZmZlcihiKSB7XG4gICAgcmV0dXJuIGIgIT0gbnVsbCAmJiBiLl9pc0J1ZmZlciA9PT0gdHJ1ZSAmJiBiICE9PSBCdWZmZXIyLnByb3RvdHlwZTtcbiAgfTtcbiAgQnVmZmVyMi5jb21wYXJlID0gZnVuY3Rpb24gY29tcGFyZShhLCBiKSB7XG4gICAgaWYgKGlzSW5zdGFuY2UoYSwgVWludDhBcnJheSkpIGEgPSBCdWZmZXIyLmZyb20oYSwgYS5vZmZzZXQsIGEuYnl0ZUxlbmd0aCk7XG4gICAgaWYgKGlzSW5zdGFuY2UoYiwgVWludDhBcnJheSkpIGIgPSBCdWZmZXIyLmZyb20oYiwgYi5vZmZzZXQsIGIuYnl0ZUxlbmd0aCk7XG4gICAgaWYgKCFCdWZmZXIyLmlzQnVmZmVyKGEpIHx8ICFCdWZmZXIyLmlzQnVmZmVyKGIpKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdUaGUgXCJidWYxXCIsIFwiYnVmMlwiIGFyZ3VtZW50cyBtdXN0IGJlIG9uZSBvZiB0eXBlIEJ1ZmZlciBvciBVaW50OEFycmF5Jyk7XG4gICAgfVxuICAgIGlmIChhID09PSBiKSByZXR1cm4gMDtcbiAgICBsZXQgeCA9IGEubGVuZ3RoO1xuICAgIGxldCB5ID0gYi5sZW5ndGg7XG4gICAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IE1hdGgubWluKHgsIHkpOyBpIDwgbGVuOyArK2kpIHtcbiAgICAgIGlmIChhW2ldICE9PSBiW2ldKSB7XG4gICAgICAgIHggPSBhW2ldO1xuICAgICAgICB5ID0gYltpXTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh4IDwgeSkgcmV0dXJuIC0xO1xuICAgIGlmICh5IDwgeCkgcmV0dXJuIDE7XG4gICAgcmV0dXJuIDA7XG4gIH07XG4gIEJ1ZmZlcjIuaXNFbmNvZGluZyA9IGZ1bmN0aW9uIGlzRW5jb2RpbmcoZW5jb2RpbmcpIHtcbiAgICBzd2l0Y2ggKFN0cmluZyhlbmNvZGluZykudG9Mb3dlckNhc2UoKSkge1xuICAgICAgY2FzZSBcImhleFwiOlxuICAgICAgY2FzZSBcInV0ZjhcIjpcbiAgICAgIGNhc2UgXCJ1dGYtOFwiOlxuICAgICAgY2FzZSBcImFzY2lpXCI6XG4gICAgICBjYXNlIFwibGF0aW4xXCI6XG4gICAgICBjYXNlIFwiYmluYXJ5XCI6XG4gICAgICBjYXNlIFwiYmFzZTY0XCI6XG4gICAgICBjYXNlIFwidWNzMlwiOlxuICAgICAgY2FzZSBcInVjcy0yXCI6XG4gICAgICBjYXNlIFwidXRmMTZsZVwiOlxuICAgICAgY2FzZSBcInV0Zi0xNmxlXCI6XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfTtcbiAgQnVmZmVyMi5jb25jYXQgPSBmdW5jdGlvbiBjb25jYXQobGlzdCwgbGVuZ3RoKSB7XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KGxpc3QpKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdcImxpc3RcIiBhcmd1bWVudCBtdXN0IGJlIGFuIEFycmF5IG9mIEJ1ZmZlcnMnKTtcbiAgICB9XG4gICAgaWYgKGxpc3QubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gQnVmZmVyMi5hbGxvYygwKTtcbiAgICB9XG4gICAgbGV0IGk7XG4gICAgaWYgKGxlbmd0aCA9PT0gdm9pZCAwKSB7XG4gICAgICBsZW5ndGggPSAwO1xuICAgICAgZm9yIChpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgbGVuZ3RoICs9IGxpc3RbaV0ubGVuZ3RoO1xuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCBidWZmZXIgPSBCdWZmZXIyLmFsbG9jVW5zYWZlKGxlbmd0aCk7XG4gICAgbGV0IHBvcyA9IDA7XG4gICAgZm9yIChpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyArK2kpIHtcbiAgICAgIGxldCBidWYgPSBsaXN0W2ldO1xuICAgICAgaWYgKGlzSW5zdGFuY2UoYnVmLCBVaW50OEFycmF5KSkge1xuICAgICAgICBpZiAocG9zICsgYnVmLmxlbmd0aCA+IGJ1ZmZlci5sZW5ndGgpIHtcbiAgICAgICAgICBpZiAoIUJ1ZmZlcjIuaXNCdWZmZXIoYnVmKSkgYnVmID0gQnVmZmVyMi5mcm9tKGJ1Zik7XG4gICAgICAgICAgYnVmLmNvcHkoYnVmZmVyLCBwb3MpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIFVpbnQ4QXJyYXkucHJvdG90eXBlLnNldC5jYWxsKGJ1ZmZlciwgYnVmLCBwb3MpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKCFCdWZmZXIyLmlzQnVmZmVyKGJ1ZikpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJsaXN0XCIgYXJndW1lbnQgbXVzdCBiZSBhbiBBcnJheSBvZiBCdWZmZXJzJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBidWYuY29weShidWZmZXIsIHBvcyk7XG4gICAgICB9XG4gICAgICBwb3MgKz0gYnVmLmxlbmd0aDtcbiAgICB9XG4gICAgcmV0dXJuIGJ1ZmZlcjtcbiAgfTtcbiAgZnVuY3Rpb24gYnl0ZUxlbmd0aChzdHJpbmcsIGVuY29kaW5nKSB7XG4gICAgaWYgKEJ1ZmZlcjIuaXNCdWZmZXIoc3RyaW5nKSkge1xuICAgICAgcmV0dXJuIHN0cmluZy5sZW5ndGg7XG4gICAgfVxuICAgIGlmIChBcnJheUJ1ZmZlci5pc1ZpZXcoc3RyaW5nKSB8fCBpc0luc3RhbmNlKHN0cmluZywgQXJyYXlCdWZmZXIpKSB7XG4gICAgICByZXR1cm4gc3RyaW5nLmJ5dGVMZW5ndGg7XG4gICAgfVxuICAgIGlmICh0eXBlb2Ygc3RyaW5nICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdUaGUgXCJzdHJpbmdcIiBhcmd1bWVudCBtdXN0IGJlIG9uZSBvZiB0eXBlIHN0cmluZywgQnVmZmVyLCBvciBBcnJheUJ1ZmZlci4gUmVjZWl2ZWQgdHlwZSAnICsgdHlwZW9mIHN0cmluZyk7XG4gICAgfVxuICAgIGNvbnN0IGxlbiA9IHN0cmluZy5sZW5ndGg7XG4gICAgY29uc3QgbXVzdE1hdGNoID0gYXJndW1lbnRzLmxlbmd0aCA+IDIgJiYgYXJndW1lbnRzWzJdID09PSB0cnVlO1xuICAgIGlmICghbXVzdE1hdGNoICYmIGxlbiA9PT0gMCkgcmV0dXJuIDA7XG4gICAgbGV0IGxvd2VyZWRDYXNlID0gZmFsc2U7XG4gICAgZm9yICg7IDsgKSB7XG4gICAgICBzd2l0Y2ggKGVuY29kaW5nKSB7XG4gICAgICAgIGNhc2UgXCJhc2NpaVwiOlxuICAgICAgICBjYXNlIFwibGF0aW4xXCI6XG4gICAgICAgIGNhc2UgXCJiaW5hcnlcIjpcbiAgICAgICAgICByZXR1cm4gbGVuO1xuICAgICAgICBjYXNlIFwidXRmOFwiOlxuICAgICAgICBjYXNlIFwidXRmLThcIjpcbiAgICAgICAgICByZXR1cm4gdXRmOFRvQnl0ZXMoc3RyaW5nKS5sZW5ndGg7XG4gICAgICAgIGNhc2UgXCJ1Y3MyXCI6XG4gICAgICAgIGNhc2UgXCJ1Y3MtMlwiOlxuICAgICAgICBjYXNlIFwidXRmMTZsZVwiOlxuICAgICAgICBjYXNlIFwidXRmLTE2bGVcIjpcbiAgICAgICAgICByZXR1cm4gbGVuICogMjtcbiAgICAgICAgY2FzZSBcImhleFwiOlxuICAgICAgICAgIHJldHVybiBsZW4gPj4+IDE7XG4gICAgICAgIGNhc2UgXCJiYXNlNjRcIjpcbiAgICAgICAgICByZXR1cm4gYmFzZTY0VG9CeXRlcyhzdHJpbmcpLmxlbmd0aDtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBpZiAobG93ZXJlZENhc2UpIHtcbiAgICAgICAgICAgIHJldHVybiBtdXN0TWF0Y2ggPyAtMSA6IHV0ZjhUb0J5dGVzKHN0cmluZykubGVuZ3RoO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbmNvZGluZyA9IChcIlwiICsgZW5jb2RpbmcpLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgbG93ZXJlZENhc2UgPSB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBCdWZmZXIyLmJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoO1xuICBmdW5jdGlvbiBzbG93VG9TdHJpbmcoZW5jb2RpbmcsIHN0YXJ0LCBlbmQpIHtcbiAgICBsZXQgbG93ZXJlZENhc2UgPSBmYWxzZTtcbiAgICBpZiAoc3RhcnQgPT09IHZvaWQgMCB8fCBzdGFydCA8IDApIHtcbiAgICAgIHN0YXJ0ID0gMDtcbiAgICB9XG4gICAgaWYgKHN0YXJ0ID4gdGhpcy5sZW5ndGgpIHtcbiAgICAgIHJldHVybiBcIlwiO1xuICAgIH1cbiAgICBpZiAoZW5kID09PSB2b2lkIDAgfHwgZW5kID4gdGhpcy5sZW5ndGgpIHtcbiAgICAgIGVuZCA9IHRoaXMubGVuZ3RoO1xuICAgIH1cbiAgICBpZiAoZW5kIDw9IDApIHtcbiAgICAgIHJldHVybiBcIlwiO1xuICAgIH1cbiAgICBlbmQgPj4+PSAwO1xuICAgIHN0YXJ0ID4+Pj0gMDtcbiAgICBpZiAoZW5kIDw9IHN0YXJ0KSB7XG4gICAgICByZXR1cm4gXCJcIjtcbiAgICB9XG4gICAgaWYgKCFlbmNvZGluZykgZW5jb2RpbmcgPSBcInV0ZjhcIjtcbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgc3dpdGNoIChlbmNvZGluZykge1xuICAgICAgICBjYXNlIFwiaGV4XCI6XG4gICAgICAgICAgcmV0dXJuIGhleFNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpO1xuICAgICAgICBjYXNlIFwidXRmOFwiOlxuICAgICAgICBjYXNlIFwidXRmLThcIjpcbiAgICAgICAgICByZXR1cm4gdXRmOFNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpO1xuICAgICAgICBjYXNlIFwiYXNjaWlcIjpcbiAgICAgICAgICByZXR1cm4gYXNjaWlTbGljZSh0aGlzLCBzdGFydCwgZW5kKTtcbiAgICAgICAgY2FzZSBcImxhdGluMVwiOlxuICAgICAgICBjYXNlIFwiYmluYXJ5XCI6XG4gICAgICAgICAgcmV0dXJuIGxhdGluMVNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpO1xuICAgICAgICBjYXNlIFwiYmFzZTY0XCI6XG4gICAgICAgICAgcmV0dXJuIGJhc2U2NFNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpO1xuICAgICAgICBjYXNlIFwidWNzMlwiOlxuICAgICAgICBjYXNlIFwidWNzLTJcIjpcbiAgICAgICAgY2FzZSBcInV0ZjE2bGVcIjpcbiAgICAgICAgY2FzZSBcInV0Zi0xNmxlXCI6XG4gICAgICAgICAgcmV0dXJuIHV0ZjE2bGVTbGljZSh0aGlzLCBzdGFydCwgZW5kKTtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBpZiAobG93ZXJlZENhc2UpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJVbmtub3duIGVuY29kaW5nOiBcIiArIGVuY29kaW5nKTtcbiAgICAgICAgICBlbmNvZGluZyA9IChlbmNvZGluZyArIFwiXCIpLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgbG93ZXJlZENhc2UgPSB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBCdWZmZXIyLnByb3RvdHlwZS5faXNCdWZmZXIgPSB0cnVlO1xuICBmdW5jdGlvbiBzd2FwKGIsIG4sIG0pIHtcbiAgICBjb25zdCBpID0gYltuXTtcbiAgICBiW25dID0gYlttXTtcbiAgICBiW21dID0gaTtcbiAgfVxuICBCdWZmZXIyLnByb3RvdHlwZS5zd2FwMTYgPSBmdW5jdGlvbiBzd2FwMTYoKSB7XG4gICAgY29uc3QgbGVuID0gdGhpcy5sZW5ndGg7XG4gICAgaWYgKGxlbiAlIDIgIT09IDApIHtcbiAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKFwiQnVmZmVyIHNpemUgbXVzdCBiZSBhIG11bHRpcGxlIG9mIDE2LWJpdHNcIik7XG4gICAgfVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuOyBpICs9IDIpIHtcbiAgICAgIHN3YXAodGhpcywgaSwgaSArIDEpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfTtcbiAgQnVmZmVyMi5wcm90b3R5cGUuc3dhcDMyID0gZnVuY3Rpb24gc3dhcDMyKCkge1xuICAgIGNvbnN0IGxlbiA9IHRoaXMubGVuZ3RoO1xuICAgIGlmIChsZW4gJSA0ICE9PSAwKSB7XG4gICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcihcIkJ1ZmZlciBzaXplIG11c3QgYmUgYSBtdWx0aXBsZSBvZiAzMi1iaXRzXCIpO1xuICAgIH1cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSArPSA0KSB7XG4gICAgICBzd2FwKHRoaXMsIGksIGkgKyAzKTtcbiAgICAgIHN3YXAodGhpcywgaSArIDEsIGkgKyAyKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG4gIEJ1ZmZlcjIucHJvdG90eXBlLnN3YXA2NCA9IGZ1bmN0aW9uIHN3YXA2NCgpIHtcbiAgICBjb25zdCBsZW4gPSB0aGlzLmxlbmd0aDtcbiAgICBpZiAobGVuICUgOCAhPT0gMCkge1xuICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoXCJCdWZmZXIgc2l6ZSBtdXN0IGJlIGEgbXVsdGlwbGUgb2YgNjQtYml0c1wiKTtcbiAgICB9XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW47IGkgKz0gOCkge1xuICAgICAgc3dhcCh0aGlzLCBpLCBpICsgNyk7XG4gICAgICBzd2FwKHRoaXMsIGkgKyAxLCBpICsgNik7XG4gICAgICBzd2FwKHRoaXMsIGkgKyAyLCBpICsgNSk7XG4gICAgICBzd2FwKHRoaXMsIGkgKyAzLCBpICsgNCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9O1xuICBCdWZmZXIyLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uIHRvU3RyaW5nKCkge1xuICAgIGNvbnN0IGxlbmd0aCA9IHRoaXMubGVuZ3RoO1xuICAgIGlmIChsZW5ndGggPT09IDApIHJldHVybiBcIlwiO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSByZXR1cm4gdXRmOFNsaWNlKHRoaXMsIDAsIGxlbmd0aCk7XG4gICAgcmV0dXJuIHNsb3dUb1N0cmluZy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9O1xuICBCdWZmZXIyLnByb3RvdHlwZS50b0xvY2FsZVN0cmluZyA9IEJ1ZmZlcjIucHJvdG90eXBlLnRvU3RyaW5nO1xuICBCdWZmZXIyLnByb3RvdHlwZS5lcXVhbHMgPSBmdW5jdGlvbiBlcXVhbHMoYikge1xuICAgIGlmICghQnVmZmVyMi5pc0J1ZmZlcihiKSkgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkFyZ3VtZW50IG11c3QgYmUgYSBCdWZmZXJcIik7XG4gICAgaWYgKHRoaXMgPT09IGIpIHJldHVybiB0cnVlO1xuICAgIHJldHVybiBCdWZmZXIyLmNvbXBhcmUodGhpcywgYikgPT09IDA7XG4gIH07XG4gIEJ1ZmZlcjIucHJvdG90eXBlLmluc3BlY3QgPSBmdW5jdGlvbiBpbnNwZWN0KCkge1xuICAgIGxldCBzdHIgPSBcIlwiO1xuICAgIGNvbnN0IG1heCA9IGV4cG9ydHMuSU5TUEVDVF9NQVhfQllURVM7XG4gICAgc3RyID0gdGhpcy50b1N0cmluZyhcImhleFwiLCAwLCBtYXgpLnJlcGxhY2UoLyguezJ9KS9nLCBcIiQxIFwiKS50cmltKCk7XG4gICAgaWYgKHRoaXMubGVuZ3RoID4gbWF4KSBzdHIgKz0gXCIgLi4uIFwiO1xuICAgIHJldHVybiBcIjxCdWZmZXIgXCIgKyBzdHIgKyBcIj5cIjtcbiAgfTtcbiAgaWYgKGN1c3RvbUluc3BlY3RTeW1ib2wpIHtcbiAgICBCdWZmZXIyLnByb3RvdHlwZVtjdXN0b21JbnNwZWN0U3ltYm9sXSA9IEJ1ZmZlcjIucHJvdG90eXBlLmluc3BlY3Q7XG4gIH1cbiAgQnVmZmVyMi5wcm90b3R5cGUuY29tcGFyZSA9IGZ1bmN0aW9uIGNvbXBhcmUodGFyZ2V0LCBzdGFydCwgZW5kLCB0aGlzU3RhcnQsIHRoaXNFbmQpIHtcbiAgICBpZiAoaXNJbnN0YW5jZSh0YXJnZXQsIFVpbnQ4QXJyYXkpKSB7XG4gICAgICB0YXJnZXQgPSBCdWZmZXIyLmZyb20odGFyZ2V0LCB0YXJnZXQub2Zmc2V0LCB0YXJnZXQuYnl0ZUxlbmd0aCk7XG4gICAgfVxuICAgIGlmICghQnVmZmVyMi5pc0J1ZmZlcih0YXJnZXQpKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdUaGUgXCJ0YXJnZXRcIiBhcmd1bWVudCBtdXN0IGJlIG9uZSBvZiB0eXBlIEJ1ZmZlciBvciBVaW50OEFycmF5LiBSZWNlaXZlZCB0eXBlICcgKyB0eXBlb2YgdGFyZ2V0KTtcbiAgICB9XG4gICAgaWYgKHN0YXJ0ID09PSB2b2lkIDApIHtcbiAgICAgIHN0YXJ0ID0gMDtcbiAgICB9XG4gICAgaWYgKGVuZCA9PT0gdm9pZCAwKSB7XG4gICAgICBlbmQgPSB0YXJnZXQgPyB0YXJnZXQubGVuZ3RoIDogMDtcbiAgICB9XG4gICAgaWYgKHRoaXNTdGFydCA9PT0gdm9pZCAwKSB7XG4gICAgICB0aGlzU3RhcnQgPSAwO1xuICAgIH1cbiAgICBpZiAodGhpc0VuZCA9PT0gdm9pZCAwKSB7XG4gICAgICB0aGlzRW5kID0gdGhpcy5sZW5ndGg7XG4gICAgfVxuICAgIGlmIChzdGFydCA8IDAgfHwgZW5kID4gdGFyZ2V0Lmxlbmd0aCB8fCB0aGlzU3RhcnQgPCAwIHx8IHRoaXNFbmQgPiB0aGlzLmxlbmd0aCkge1xuICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoXCJvdXQgb2YgcmFuZ2UgaW5kZXhcIik7XG4gICAgfVxuICAgIGlmICh0aGlzU3RhcnQgPj0gdGhpc0VuZCAmJiBzdGFydCA+PSBlbmQpIHtcbiAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICBpZiAodGhpc1N0YXJ0ID49IHRoaXNFbmQpIHtcbiAgICAgIHJldHVybiAtMTtcbiAgICB9XG4gICAgaWYgKHN0YXJ0ID49IGVuZCkge1xuICAgICAgcmV0dXJuIDE7XG4gICAgfVxuICAgIHN0YXJ0ID4+Pj0gMDtcbiAgICBlbmQgPj4+PSAwO1xuICAgIHRoaXNTdGFydCA+Pj49IDA7XG4gICAgdGhpc0VuZCA+Pj49IDA7XG4gICAgaWYgKHRoaXMgPT09IHRhcmdldCkgcmV0dXJuIDA7XG4gICAgbGV0IHggPSB0aGlzRW5kIC0gdGhpc1N0YXJ0O1xuICAgIGxldCB5ID0gZW5kIC0gc3RhcnQ7XG4gICAgY29uc3QgbGVuID0gTWF0aC5taW4oeCwgeSk7XG4gICAgY29uc3QgdGhpc0NvcHkgPSB0aGlzLnNsaWNlKHRoaXNTdGFydCwgdGhpc0VuZCk7XG4gICAgY29uc3QgdGFyZ2V0Q29weSA9IHRhcmdldC5zbGljZShzdGFydCwgZW5kKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgKytpKSB7XG4gICAgICBpZiAodGhpc0NvcHlbaV0gIT09IHRhcmdldENvcHlbaV0pIHtcbiAgICAgICAgeCA9IHRoaXNDb3B5W2ldO1xuICAgICAgICB5ID0gdGFyZ2V0Q29weVtpXTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh4IDwgeSkgcmV0dXJuIC0xO1xuICAgIGlmICh5IDwgeCkgcmV0dXJuIDE7XG4gICAgcmV0dXJuIDA7XG4gIH07XG4gIGZ1bmN0aW9uIGJpZGlyZWN0aW9uYWxJbmRleE9mKGJ1ZmZlciwgdmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZywgZGlyKSB7XG4gICAgaWYgKGJ1ZmZlci5sZW5ndGggPT09IDApIHJldHVybiAtMTtcbiAgICBpZiAodHlwZW9mIGJ5dGVPZmZzZXQgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIGVuY29kaW5nID0gYnl0ZU9mZnNldDtcbiAgICAgIGJ5dGVPZmZzZXQgPSAwO1xuICAgIH0gZWxzZSBpZiAoYnl0ZU9mZnNldCA+IDIxNDc0ODM2NDcpIHtcbiAgICAgIGJ5dGVPZmZzZXQgPSAyMTQ3NDgzNjQ3O1xuICAgIH0gZWxzZSBpZiAoYnl0ZU9mZnNldCA8IC0yMTQ3NDgzNjQ4KSB7XG4gICAgICBieXRlT2Zmc2V0ID0gLTIxNDc0ODM2NDg7XG4gICAgfVxuICAgIGJ5dGVPZmZzZXQgPSArYnl0ZU9mZnNldDtcbiAgICBpZiAobnVtYmVySXNOYU4oYnl0ZU9mZnNldCkpIHtcbiAgICAgIGJ5dGVPZmZzZXQgPSBkaXIgPyAwIDogYnVmZmVyLmxlbmd0aCAtIDE7XG4gICAgfVxuICAgIGlmIChieXRlT2Zmc2V0IDwgMCkgYnl0ZU9mZnNldCA9IGJ1ZmZlci5sZW5ndGggKyBieXRlT2Zmc2V0O1xuICAgIGlmIChieXRlT2Zmc2V0ID49IGJ1ZmZlci5sZW5ndGgpIHtcbiAgICAgIGlmIChkaXIpIHJldHVybiAtMTtcbiAgICAgIGVsc2UgYnl0ZU9mZnNldCA9IGJ1ZmZlci5sZW5ndGggLSAxO1xuICAgIH0gZWxzZSBpZiAoYnl0ZU9mZnNldCA8IDApIHtcbiAgICAgIGlmIChkaXIpIGJ5dGVPZmZzZXQgPSAwO1xuICAgICAgZWxzZSByZXR1cm4gLTE7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgdmFsID09PSBcInN0cmluZ1wiKSB7XG4gICAgICB2YWwgPSBCdWZmZXIyLmZyb20odmFsLCBlbmNvZGluZyk7XG4gICAgfVxuICAgIGlmIChCdWZmZXIyLmlzQnVmZmVyKHZhbCkpIHtcbiAgICAgIGlmICh2YWwubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiAtMTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBhcnJheUluZGV4T2YoYnVmZmVyLCB2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nLCBkaXIpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIHZhbCA9PT0gXCJudW1iZXJcIikge1xuICAgICAgdmFsID0gdmFsICYgMjU1O1xuICAgICAgaWYgKHR5cGVvZiBVaW50OEFycmF5LnByb3RvdHlwZS5pbmRleE9mID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgaWYgKGRpcikge1xuICAgICAgICAgIHJldHVybiBVaW50OEFycmF5LnByb3RvdHlwZS5pbmRleE9mLmNhbGwoYnVmZmVyLCB2YWwsIGJ5dGVPZmZzZXQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBVaW50OEFycmF5LnByb3RvdHlwZS5sYXN0SW5kZXhPZi5jYWxsKGJ1ZmZlciwgdmFsLCBieXRlT2Zmc2V0KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGFycmF5SW5kZXhPZihidWZmZXIsIFt2YWxdLCBieXRlT2Zmc2V0LCBlbmNvZGluZywgZGlyKTtcbiAgICB9XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcInZhbCBtdXN0IGJlIHN0cmluZywgbnVtYmVyIG9yIEJ1ZmZlclwiKTtcbiAgfVxuICBmdW5jdGlvbiBhcnJheUluZGV4T2YoYXJyLCB2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nLCBkaXIpIHtcbiAgICBsZXQgaW5kZXhTaXplID0gMTtcbiAgICBsZXQgYXJyTGVuZ3RoID0gYXJyLmxlbmd0aDtcbiAgICBsZXQgdmFsTGVuZ3RoID0gdmFsLmxlbmd0aDtcbiAgICBpZiAoZW5jb2RpbmcgIT09IHZvaWQgMCkge1xuICAgICAgZW5jb2RpbmcgPSBTdHJpbmcoZW5jb2RpbmcpLnRvTG93ZXJDYXNlKCk7XG4gICAgICBpZiAoZW5jb2RpbmcgPT09IFwidWNzMlwiIHx8IGVuY29kaW5nID09PSBcInVjcy0yXCIgfHwgZW5jb2RpbmcgPT09IFwidXRmMTZsZVwiIHx8IGVuY29kaW5nID09PSBcInV0Zi0xNmxlXCIpIHtcbiAgICAgICAgaWYgKGFyci5sZW5ndGggPCAyIHx8IHZhbC5sZW5ndGggPCAyKSB7XG4gICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICB9XG4gICAgICAgIGluZGV4U2l6ZSA9IDI7XG4gICAgICAgIGFyckxlbmd0aCAvPSAyO1xuICAgICAgICB2YWxMZW5ndGggLz0gMjtcbiAgICAgICAgYnl0ZU9mZnNldCAvPSAyO1xuICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiByZWFkKGJ1ZiwgaTIpIHtcbiAgICAgIGlmIChpbmRleFNpemUgPT09IDEpIHtcbiAgICAgICAgcmV0dXJuIGJ1ZltpMl07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gYnVmLnJlYWRVSW50MTZCRShpMiAqIGluZGV4U2l6ZSk7XG4gICAgICB9XG4gICAgfVxuICAgIGxldCBpO1xuICAgIGlmIChkaXIpIHtcbiAgICAgIGxldCBmb3VuZEluZGV4ID0gLTE7XG4gICAgICBmb3IgKGkgPSBieXRlT2Zmc2V0OyBpIDwgYXJyTGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKHJlYWQoYXJyLCBpKSA9PT0gcmVhZCh2YWwsIGZvdW5kSW5kZXggPT09IC0xID8gMCA6IGkgLSBmb3VuZEluZGV4KSkge1xuICAgICAgICAgIGlmIChmb3VuZEluZGV4ID09PSAtMSkgZm91bmRJbmRleCA9IGk7XG4gICAgICAgICAgaWYgKGkgLSBmb3VuZEluZGV4ICsgMSA9PT0gdmFsTGVuZ3RoKSByZXR1cm4gZm91bmRJbmRleCAqIGluZGV4U2l6ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAoZm91bmRJbmRleCAhPT0gLTEpIGkgLT0gaSAtIGZvdW5kSW5kZXg7XG4gICAgICAgICAgZm91bmRJbmRleCA9IC0xO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChieXRlT2Zmc2V0ICsgdmFsTGVuZ3RoID4gYXJyTGVuZ3RoKSBieXRlT2Zmc2V0ID0gYXJyTGVuZ3RoIC0gdmFsTGVuZ3RoO1xuICAgICAgZm9yIChpID0gYnl0ZU9mZnNldDsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgbGV0IGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCB2YWxMZW5ndGg7IGorKykge1xuICAgICAgICAgIGlmIChyZWFkKGFyciwgaSArIGopICE9PSByZWFkKHZhbCwgaikpIHtcbiAgICAgICAgICAgIGZvdW5kID0gZmFsc2U7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGZvdW5kKSByZXR1cm4gaTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIC0xO1xuICB9XG4gIEJ1ZmZlcjIucHJvdG90eXBlLmluY2x1ZGVzID0gZnVuY3Rpb24gaW5jbHVkZXModmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZykge1xuICAgIHJldHVybiB0aGlzLmluZGV4T2YodmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZykgIT09IC0xO1xuICB9O1xuICBCdWZmZXIyLnByb3RvdHlwZS5pbmRleE9mID0gZnVuY3Rpb24gaW5kZXhPZih2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nKSB7XG4gICAgcmV0dXJuIGJpZGlyZWN0aW9uYWxJbmRleE9mKHRoaXMsIHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcsIHRydWUpO1xuICB9O1xuICBCdWZmZXIyLnByb3RvdHlwZS5sYXN0SW5kZXhPZiA9IGZ1bmN0aW9uIGxhc3RJbmRleE9mKHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcpIHtcbiAgICByZXR1cm4gYmlkaXJlY3Rpb25hbEluZGV4T2YodGhpcywgdmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZywgZmFsc2UpO1xuICB9O1xuICBmdW5jdGlvbiBoZXhXcml0ZShidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgICBvZmZzZXQgPSBOdW1iZXIob2Zmc2V0KSB8fCAwO1xuICAgIGNvbnN0IHJlbWFpbmluZyA9IGJ1Zi5sZW5ndGggLSBvZmZzZXQ7XG4gICAgaWYgKCFsZW5ndGgpIHtcbiAgICAgIGxlbmd0aCA9IHJlbWFpbmluZztcbiAgICB9IGVsc2Uge1xuICAgICAgbGVuZ3RoID0gTnVtYmVyKGxlbmd0aCk7XG4gICAgICBpZiAobGVuZ3RoID4gcmVtYWluaW5nKSB7XG4gICAgICAgIGxlbmd0aCA9IHJlbWFpbmluZztcbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3Qgc3RyTGVuID0gc3RyaW5nLmxlbmd0aDtcbiAgICBpZiAobGVuZ3RoID4gc3RyTGVuIC8gMikge1xuICAgICAgbGVuZ3RoID0gc3RyTGVuIC8gMjtcbiAgICB9XG4gICAgbGV0IGk7XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbmd0aDsgKytpKSB7XG4gICAgICBjb25zdCBwYXJzZWQgPSBwYXJzZUludChzdHJpbmcuc3Vic3RyKGkgKiAyLCAyKSwgMTYpO1xuICAgICAgaWYgKG51bWJlcklzTmFOKHBhcnNlZCkpIHJldHVybiBpO1xuICAgICAgYnVmW29mZnNldCArIGldID0gcGFyc2VkO1xuICAgIH1cbiAgICByZXR1cm4gaTtcbiAgfVxuICBmdW5jdGlvbiB1dGY4V3JpdGUoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gICAgcmV0dXJuIGJsaXRCdWZmZXIodXRmOFRvQnl0ZXMoc3RyaW5nLCBidWYubGVuZ3RoIC0gb2Zmc2V0KSwgYnVmLCBvZmZzZXQsIGxlbmd0aCk7XG4gIH1cbiAgZnVuY3Rpb24gYXNjaWlXcml0ZShidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgICByZXR1cm4gYmxpdEJ1ZmZlcihhc2NpaVRvQnl0ZXMoc3RyaW5nKSwgYnVmLCBvZmZzZXQsIGxlbmd0aCk7XG4gIH1cbiAgZnVuY3Rpb24gYmFzZTY0V3JpdGUoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gICAgcmV0dXJuIGJsaXRCdWZmZXIoYmFzZTY0VG9CeXRlcyhzdHJpbmcpLCBidWYsIG9mZnNldCwgbGVuZ3RoKTtcbiAgfVxuICBmdW5jdGlvbiB1Y3MyV3JpdGUoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gICAgcmV0dXJuIGJsaXRCdWZmZXIodXRmMTZsZVRvQnl0ZXMoc3RyaW5nLCBidWYubGVuZ3RoIC0gb2Zmc2V0KSwgYnVmLCBvZmZzZXQsIGxlbmd0aCk7XG4gIH1cbiAgQnVmZmVyMi5wcm90b3R5cGUud3JpdGUgPSBmdW5jdGlvbiB3cml0ZShzdHJpbmcsIG9mZnNldCwgbGVuZ3RoLCBlbmNvZGluZykge1xuICAgIGlmIChvZmZzZXQgPT09IHZvaWQgMCkge1xuICAgICAgZW5jb2RpbmcgPSBcInV0ZjhcIjtcbiAgICAgIGxlbmd0aCA9IHRoaXMubGVuZ3RoO1xuICAgICAgb2Zmc2V0ID0gMDtcbiAgICB9IGVsc2UgaWYgKGxlbmd0aCA9PT0gdm9pZCAwICYmIHR5cGVvZiBvZmZzZXQgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIGVuY29kaW5nID0gb2Zmc2V0O1xuICAgICAgbGVuZ3RoID0gdGhpcy5sZW5ndGg7XG4gICAgICBvZmZzZXQgPSAwO1xuICAgIH0gZWxzZSBpZiAoaXNGaW5pdGUob2Zmc2V0KSkge1xuICAgICAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwO1xuICAgICAgaWYgKGlzRmluaXRlKGxlbmd0aCkpIHtcbiAgICAgICAgbGVuZ3RoID0gbGVuZ3RoID4+PiAwO1xuICAgICAgICBpZiAoZW5jb2RpbmcgPT09IHZvaWQgMCkgZW5jb2RpbmcgPSBcInV0ZjhcIjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVuY29kaW5nID0gbGVuZ3RoO1xuICAgICAgICBsZW5ndGggPSB2b2lkIDA7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkJ1ZmZlci53cml0ZShzdHJpbmcsIGVuY29kaW5nLCBvZmZzZXRbLCBsZW5ndGhdKSBpcyBubyBsb25nZXIgc3VwcG9ydGVkXCIpO1xuICAgIH1cbiAgICBjb25zdCByZW1haW5pbmcgPSB0aGlzLmxlbmd0aCAtIG9mZnNldDtcbiAgICBpZiAobGVuZ3RoID09PSB2b2lkIDAgfHwgbGVuZ3RoID4gcmVtYWluaW5nKSBsZW5ndGggPSByZW1haW5pbmc7XG4gICAgaWYgKHN0cmluZy5sZW5ndGggPiAwICYmIChsZW5ndGggPCAwIHx8IG9mZnNldCA8IDApIHx8IG9mZnNldCA+IHRoaXMubGVuZ3RoKSB7XG4gICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcihcIkF0dGVtcHQgdG8gd3JpdGUgb3V0c2lkZSBidWZmZXIgYm91bmRzXCIpO1xuICAgIH1cbiAgICBpZiAoIWVuY29kaW5nKSBlbmNvZGluZyA9IFwidXRmOFwiO1xuICAgIGxldCBsb3dlcmVkQ2FzZSA9IGZhbHNlO1xuICAgIGZvciAoOyA7ICkge1xuICAgICAgc3dpdGNoIChlbmNvZGluZykge1xuICAgICAgICBjYXNlIFwiaGV4XCI6XG4gICAgICAgICAgcmV0dXJuIGhleFdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpO1xuICAgICAgICBjYXNlIFwidXRmOFwiOlxuICAgICAgICBjYXNlIFwidXRmLThcIjpcbiAgICAgICAgICByZXR1cm4gdXRmOFdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpO1xuICAgICAgICBjYXNlIFwiYXNjaWlcIjpcbiAgICAgICAgY2FzZSBcImxhdGluMVwiOlxuICAgICAgICBjYXNlIFwiYmluYXJ5XCI6XG4gICAgICAgICAgcmV0dXJuIGFzY2lpV3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCk7XG4gICAgICAgIGNhc2UgXCJiYXNlNjRcIjpcbiAgICAgICAgICByZXR1cm4gYmFzZTY0V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCk7XG4gICAgICAgIGNhc2UgXCJ1Y3MyXCI6XG4gICAgICAgIGNhc2UgXCJ1Y3MtMlwiOlxuICAgICAgICBjYXNlIFwidXRmMTZsZVwiOlxuICAgICAgICBjYXNlIFwidXRmLTE2bGVcIjpcbiAgICAgICAgICByZXR1cm4gdWNzMldyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGlmIChsb3dlcmVkQ2FzZSkgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlVua25vd24gZW5jb2Rpbmc6IFwiICsgZW5jb2RpbmcpO1xuICAgICAgICAgIGVuY29kaW5nID0gKFwiXCIgKyBlbmNvZGluZykudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICBsb3dlcmVkQ2FzZSA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuICB9O1xuICBCdWZmZXIyLnByb3RvdHlwZS50b0pTT04gPSBmdW5jdGlvbiB0b0pTT04oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IFwiQnVmZmVyXCIsXG4gICAgICBkYXRhOiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbCh0aGlzLl9hcnIgfHwgdGhpcywgMClcbiAgICB9O1xuICB9O1xuICBmdW5jdGlvbiBiYXNlNjRTbGljZShidWYsIHN0YXJ0LCBlbmQpIHtcbiAgICBpZiAoc3RhcnQgPT09IDAgJiYgZW5kID09PSBidWYubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gYmFzZTY0LmZyb21CeXRlQXJyYXkoYnVmKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGJhc2U2NC5mcm9tQnl0ZUFycmF5KGJ1Zi5zbGljZShzdGFydCwgZW5kKSk7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIHV0ZjhTbGljZShidWYsIHN0YXJ0LCBlbmQpIHtcbiAgICBlbmQgPSBNYXRoLm1pbihidWYubGVuZ3RoLCBlbmQpO1xuICAgIGNvbnN0IHJlcyA9IFtdO1xuICAgIGxldCBpID0gc3RhcnQ7XG4gICAgd2hpbGUgKGkgPCBlbmQpIHtcbiAgICAgIGNvbnN0IGZpcnN0Qnl0ZSA9IGJ1ZltpXTtcbiAgICAgIGxldCBjb2RlUG9pbnQgPSBudWxsO1xuICAgICAgbGV0IGJ5dGVzUGVyU2VxdWVuY2UgPSBmaXJzdEJ5dGUgPiAyMzkgPyA0IDogZmlyc3RCeXRlID4gMjIzID8gMyA6IGZpcnN0Qnl0ZSA+IDE5MSA/IDIgOiAxO1xuICAgICAgaWYgKGkgKyBieXRlc1BlclNlcXVlbmNlIDw9IGVuZCkge1xuICAgICAgICBsZXQgc2Vjb25kQnl0ZSwgdGhpcmRCeXRlLCBmb3VydGhCeXRlLCB0ZW1wQ29kZVBvaW50O1xuICAgICAgICBzd2l0Y2ggKGJ5dGVzUGVyU2VxdWVuY2UpIHtcbiAgICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICBpZiAoZmlyc3RCeXRlIDwgMTI4KSB7XG4gICAgICAgICAgICAgIGNvZGVQb2ludCA9IGZpcnN0Qnl0ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgIHNlY29uZEJ5dGUgPSBidWZbaSArIDFdO1xuICAgICAgICAgICAgaWYgKChzZWNvbmRCeXRlICYgMTkyKSA9PT0gMTI4KSB7XG4gICAgICAgICAgICAgIHRlbXBDb2RlUG9pbnQgPSAoZmlyc3RCeXRlICYgMzEpIDw8IDYgfCBzZWNvbmRCeXRlICYgNjM7XG4gICAgICAgICAgICAgIGlmICh0ZW1wQ29kZVBvaW50ID4gMTI3KSB7XG4gICAgICAgICAgICAgICAgY29kZVBvaW50ID0gdGVtcENvZGVQb2ludDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAzOlxuICAgICAgICAgICAgc2Vjb25kQnl0ZSA9IGJ1ZltpICsgMV07XG4gICAgICAgICAgICB0aGlyZEJ5dGUgPSBidWZbaSArIDJdO1xuICAgICAgICAgICAgaWYgKChzZWNvbmRCeXRlICYgMTkyKSA9PT0gMTI4ICYmICh0aGlyZEJ5dGUgJiAxOTIpID09PSAxMjgpIHtcbiAgICAgICAgICAgICAgdGVtcENvZGVQb2ludCA9IChmaXJzdEJ5dGUgJiAxNSkgPDwgMTIgfCAoc2Vjb25kQnl0ZSAmIDYzKSA8PCA2IHwgdGhpcmRCeXRlICYgNjM7XG4gICAgICAgICAgICAgIGlmICh0ZW1wQ29kZVBvaW50ID4gMjA0NyAmJiAodGVtcENvZGVQb2ludCA8IDU1Mjk2IHx8IHRlbXBDb2RlUG9pbnQgPiA1NzM0MykpIHtcbiAgICAgICAgICAgICAgICBjb2RlUG9pbnQgPSB0ZW1wQ29kZVBvaW50O1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIDQ6XG4gICAgICAgICAgICBzZWNvbmRCeXRlID0gYnVmW2kgKyAxXTtcbiAgICAgICAgICAgIHRoaXJkQnl0ZSA9IGJ1ZltpICsgMl07XG4gICAgICAgICAgICBmb3VydGhCeXRlID0gYnVmW2kgKyAzXTtcbiAgICAgICAgICAgIGlmICgoc2Vjb25kQnl0ZSAmIDE5MikgPT09IDEyOCAmJiAodGhpcmRCeXRlICYgMTkyKSA9PT0gMTI4ICYmIChmb3VydGhCeXRlICYgMTkyKSA9PT0gMTI4KSB7XG4gICAgICAgICAgICAgIHRlbXBDb2RlUG9pbnQgPSAoZmlyc3RCeXRlICYgMTUpIDw8IDE4IHwgKHNlY29uZEJ5dGUgJiA2MykgPDwgMTIgfCAodGhpcmRCeXRlICYgNjMpIDw8IDYgfCBmb3VydGhCeXRlICYgNjM7XG4gICAgICAgICAgICAgIGlmICh0ZW1wQ29kZVBvaW50ID4gNjU1MzUgJiYgdGVtcENvZGVQb2ludCA8IDExMTQxMTIpIHtcbiAgICAgICAgICAgICAgICBjb2RlUG9pbnQgPSB0ZW1wQ29kZVBvaW50O1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChjb2RlUG9pbnQgPT09IG51bGwpIHtcbiAgICAgICAgY29kZVBvaW50ID0gNjU1MzM7XG4gICAgICAgIGJ5dGVzUGVyU2VxdWVuY2UgPSAxO1xuICAgICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPiA2NTUzNSkge1xuICAgICAgICBjb2RlUG9pbnQgLT0gNjU1MzY7XG4gICAgICAgIHJlcy5wdXNoKGNvZGVQb2ludCA+Pj4gMTAgJiAxMDIzIHwgNTUyOTYpO1xuICAgICAgICBjb2RlUG9pbnQgPSA1NjMyMCB8IGNvZGVQb2ludCAmIDEwMjM7XG4gICAgICB9XG4gICAgICByZXMucHVzaChjb2RlUG9pbnQpO1xuICAgICAgaSArPSBieXRlc1BlclNlcXVlbmNlO1xuICAgIH1cbiAgICByZXR1cm4gZGVjb2RlQ29kZVBvaW50c0FycmF5KHJlcyk7XG4gIH1cbiAgY29uc3QgTUFYX0FSR1VNRU5UU19MRU5HVEggPSA0MDk2O1xuICBmdW5jdGlvbiBkZWNvZGVDb2RlUG9pbnRzQXJyYXkoY29kZVBvaW50cykge1xuICAgIGNvbnN0IGxlbiA9IGNvZGVQb2ludHMubGVuZ3RoO1xuICAgIGlmIChsZW4gPD0gTUFYX0FSR1VNRU5UU19MRU5HVEgpIHtcbiAgICAgIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KFN0cmluZywgY29kZVBvaW50cyk7XG4gICAgfVxuICAgIGxldCByZXMgPSBcIlwiO1xuICAgIGxldCBpID0gMDtcbiAgICB3aGlsZSAoaSA8IGxlbikge1xuICAgICAgcmVzICs9IFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkoU3RyaW5nLCBjb2RlUG9pbnRzLnNsaWNlKGksIGkgKz0gTUFYX0FSR1VNRU5UU19MRU5HVEgpKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlcztcbiAgfVxuICBmdW5jdGlvbiBhc2NpaVNsaWNlKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICAgIGxldCByZXQgPSBcIlwiO1xuICAgIGVuZCA9IE1hdGgubWluKGJ1Zi5sZW5ndGgsIGVuZCk7XG4gICAgZm9yIChsZXQgaSA9IHN0YXJ0OyBpIDwgZW5kOyArK2kpIHtcbiAgICAgIHJldCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ1ZltpXSAmIDEyNyk7XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG4gIH1cbiAgZnVuY3Rpb24gbGF0aW4xU2xpY2UoYnVmLCBzdGFydCwgZW5kKSB7XG4gICAgbGV0IHJldCA9IFwiXCI7XG4gICAgZW5kID0gTWF0aC5taW4oYnVmLmxlbmd0aCwgZW5kKTtcbiAgICBmb3IgKGxldCBpID0gc3RhcnQ7IGkgPCBlbmQ7ICsraSkge1xuICAgICAgcmV0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnVmW2ldKTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbiAgfVxuICBmdW5jdGlvbiBoZXhTbGljZShidWYsIHN0YXJ0LCBlbmQpIHtcbiAgICBjb25zdCBsZW4gPSBidWYubGVuZ3RoO1xuICAgIGlmICghc3RhcnQgfHwgc3RhcnQgPCAwKSBzdGFydCA9IDA7XG4gICAgaWYgKCFlbmQgfHwgZW5kIDwgMCB8fCBlbmQgPiBsZW4pIGVuZCA9IGxlbjtcbiAgICBsZXQgb3V0ID0gXCJcIjtcbiAgICBmb3IgKGxldCBpID0gc3RhcnQ7IGkgPCBlbmQ7ICsraSkge1xuICAgICAgb3V0ICs9IGhleFNsaWNlTG9va3VwVGFibGVbYnVmW2ldXTtcbiAgICB9XG4gICAgcmV0dXJuIG91dDtcbiAgfVxuICBmdW5jdGlvbiB1dGYxNmxlU2xpY2UoYnVmLCBzdGFydCwgZW5kKSB7XG4gICAgY29uc3QgYnl0ZXMgPSBidWYuc2xpY2Uoc3RhcnQsIGVuZCk7XG4gICAgbGV0IHJlcyA9IFwiXCI7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBieXRlcy5sZW5ndGggLSAxOyBpICs9IDIpIHtcbiAgICAgIHJlcyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ5dGVzW2ldICsgYnl0ZXNbaSArIDFdICogMjU2KTtcbiAgICB9XG4gICAgcmV0dXJuIHJlcztcbiAgfVxuICBCdWZmZXIyLnByb3RvdHlwZS5zbGljZSA9IGZ1bmN0aW9uIHNsaWNlKHN0YXJ0LCBlbmQpIHtcbiAgICBjb25zdCBsZW4gPSB0aGlzLmxlbmd0aDtcbiAgICBzdGFydCA9IH5+c3RhcnQ7XG4gICAgZW5kID0gZW5kID09PSB2b2lkIDAgPyBsZW4gOiB+fmVuZDtcbiAgICBpZiAoc3RhcnQgPCAwKSB7XG4gICAgICBzdGFydCArPSBsZW47XG4gICAgICBpZiAoc3RhcnQgPCAwKSBzdGFydCA9IDA7XG4gICAgfSBlbHNlIGlmIChzdGFydCA+IGxlbikge1xuICAgICAgc3RhcnQgPSBsZW47XG4gICAgfVxuICAgIGlmIChlbmQgPCAwKSB7XG4gICAgICBlbmQgKz0gbGVuO1xuICAgICAgaWYgKGVuZCA8IDApIGVuZCA9IDA7XG4gICAgfSBlbHNlIGlmIChlbmQgPiBsZW4pIHtcbiAgICAgIGVuZCA9IGxlbjtcbiAgICB9XG4gICAgaWYgKGVuZCA8IHN0YXJ0KSBlbmQgPSBzdGFydDtcbiAgICBjb25zdCBuZXdCdWYgPSB0aGlzLnN1YmFycmF5KHN0YXJ0LCBlbmQpO1xuICAgIE9iamVjdC5zZXRQcm90b3R5cGVPZihuZXdCdWYsIEJ1ZmZlcjIucHJvdG90eXBlKTtcbiAgICByZXR1cm4gbmV3QnVmO1xuICB9O1xuICBmdW5jdGlvbiBjaGVja09mZnNldChvZmZzZXQsIGV4dCwgbGVuZ3RoKSB7XG4gICAgaWYgKG9mZnNldCAlIDEgIT09IDAgfHwgb2Zmc2V0IDwgMCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoXCJvZmZzZXQgaXMgbm90IHVpbnRcIik7XG4gICAgaWYgKG9mZnNldCArIGV4dCA+IGxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoXCJUcnlpbmcgdG8gYWNjZXNzIGJleW9uZCBidWZmZXIgbGVuZ3RoXCIpO1xuICB9XG4gIEJ1ZmZlcjIucHJvdG90eXBlLnJlYWRVaW50TEUgPSBCdWZmZXIyLnByb3RvdHlwZS5yZWFkVUludExFID0gZnVuY3Rpb24gcmVhZFVJbnRMRShvZmZzZXQsIGJ5dGVMZW5ndGgyLCBub0Fzc2VydCkge1xuICAgIG9mZnNldCA9IG9mZnNldCA+Pj4gMDtcbiAgICBieXRlTGVuZ3RoMiA9IGJ5dGVMZW5ndGgyID4+PiAwO1xuICAgIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aDIsIHRoaXMubGVuZ3RoKTtcbiAgICBsZXQgdmFsID0gdGhpc1tvZmZzZXRdO1xuICAgIGxldCBtdWwgPSAxO1xuICAgIGxldCBpID0gMDtcbiAgICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aDIgJiYgKG11bCAqPSAyNTYpKSB7XG4gICAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyBpXSAqIG11bDtcbiAgICB9XG4gICAgcmV0dXJuIHZhbDtcbiAgfTtcbiAgQnVmZmVyMi5wcm90b3R5cGUucmVhZFVpbnRCRSA9IEJ1ZmZlcjIucHJvdG90eXBlLnJlYWRVSW50QkUgPSBmdW5jdGlvbiByZWFkVUludEJFKG9mZnNldCwgYnl0ZUxlbmd0aDIsIG5vQXNzZXJ0KSB7XG4gICAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwO1xuICAgIGJ5dGVMZW5ndGgyID0gYnl0ZUxlbmd0aDIgPj4+IDA7XG4gICAgaWYgKCFub0Fzc2VydCkge1xuICAgICAgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoMiwgdGhpcy5sZW5ndGgpO1xuICAgIH1cbiAgICBsZXQgdmFsID0gdGhpc1tvZmZzZXQgKyAtLWJ5dGVMZW5ndGgyXTtcbiAgICBsZXQgbXVsID0gMTtcbiAgICB3aGlsZSAoYnl0ZUxlbmd0aDIgPiAwICYmIChtdWwgKj0gMjU2KSkge1xuICAgICAgdmFsICs9IHRoaXNbb2Zmc2V0ICsgLS1ieXRlTGVuZ3RoMl0gKiBtdWw7XG4gICAgfVxuICAgIHJldHVybiB2YWw7XG4gIH07XG4gIEJ1ZmZlcjIucHJvdG90eXBlLnJlYWRVaW50OCA9IEJ1ZmZlcjIucHJvdG90eXBlLnJlYWRVSW50OCA9IGZ1bmN0aW9uIHJlYWRVSW50OChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gICAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwO1xuICAgIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMSwgdGhpcy5sZW5ndGgpO1xuICAgIHJldHVybiB0aGlzW29mZnNldF07XG4gIH07XG4gIEJ1ZmZlcjIucHJvdG90eXBlLnJlYWRVaW50MTZMRSA9IEJ1ZmZlcjIucHJvdG90eXBlLnJlYWRVSW50MTZMRSA9IGZ1bmN0aW9uIHJlYWRVSW50MTZMRShvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gICAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwO1xuICAgIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpO1xuICAgIHJldHVybiB0aGlzW29mZnNldF0gfCB0aGlzW29mZnNldCArIDFdIDw8IDg7XG4gIH07XG4gIEJ1ZmZlcjIucHJvdG90eXBlLnJlYWRVaW50MTZCRSA9IEJ1ZmZlcjIucHJvdG90eXBlLnJlYWRVSW50MTZCRSA9IGZ1bmN0aW9uIHJlYWRVSW50MTZCRShvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gICAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwO1xuICAgIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpO1xuICAgIHJldHVybiB0aGlzW29mZnNldF0gPDwgOCB8IHRoaXNbb2Zmc2V0ICsgMV07XG4gIH07XG4gIEJ1ZmZlcjIucHJvdG90eXBlLnJlYWRVaW50MzJMRSA9IEJ1ZmZlcjIucHJvdG90eXBlLnJlYWRVSW50MzJMRSA9IGZ1bmN0aW9uIHJlYWRVSW50MzJMRShvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gICAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwO1xuICAgIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpO1xuICAgIHJldHVybiAodGhpc1tvZmZzZXRdIHwgdGhpc1tvZmZzZXQgKyAxXSA8PCA4IHwgdGhpc1tvZmZzZXQgKyAyXSA8PCAxNikgKyB0aGlzW29mZnNldCArIDNdICogMTY3NzcyMTY7XG4gIH07XG4gIEJ1ZmZlcjIucHJvdG90eXBlLnJlYWRVaW50MzJCRSA9IEJ1ZmZlcjIucHJvdG90eXBlLnJlYWRVSW50MzJCRSA9IGZ1bmN0aW9uIHJlYWRVSW50MzJCRShvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gICAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwO1xuICAgIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpO1xuICAgIHJldHVybiB0aGlzW29mZnNldF0gKiAxNjc3NzIxNiArICh0aGlzW29mZnNldCArIDFdIDw8IDE2IHwgdGhpc1tvZmZzZXQgKyAyXSA8PCA4IHwgdGhpc1tvZmZzZXQgKyAzXSk7XG4gIH07XG4gIEJ1ZmZlcjIucHJvdG90eXBlLnJlYWRCaWdVSW50NjRMRSA9IGRlZmluZUJpZ0ludE1ldGhvZChmdW5jdGlvbiByZWFkQmlnVUludDY0TEUob2Zmc2V0KSB7XG4gICAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwO1xuICAgIHZhbGlkYXRlTnVtYmVyKG9mZnNldCwgXCJvZmZzZXRcIik7XG4gICAgY29uc3QgZmlyc3QgPSB0aGlzW29mZnNldF07XG4gICAgY29uc3QgbGFzdCA9IHRoaXNbb2Zmc2V0ICsgN107XG4gICAgaWYgKGZpcnN0ID09PSB2b2lkIDAgfHwgbGFzdCA9PT0gdm9pZCAwKSB7XG4gICAgICBib3VuZHNFcnJvcihvZmZzZXQsIHRoaXMubGVuZ3RoIC0gOCk7XG4gICAgfVxuICAgIGNvbnN0IGxvID0gZmlyc3QgKyB0aGlzWysrb2Zmc2V0XSAqIDIgKiogOCArIHRoaXNbKytvZmZzZXRdICogMiAqKiAxNiArIHRoaXNbKytvZmZzZXRdICogMiAqKiAyNDtcbiAgICBjb25zdCBoaSA9IHRoaXNbKytvZmZzZXRdICsgdGhpc1srK29mZnNldF0gKiAyICoqIDggKyB0aGlzWysrb2Zmc2V0XSAqIDIgKiogMTYgKyBsYXN0ICogMiAqKiAyNDtcbiAgICByZXR1cm4gQmlnSW50KGxvKSArIChCaWdJbnQoaGkpIDw8IEJpZ0ludCgzMikpO1xuICB9KTtcbiAgQnVmZmVyMi5wcm90b3R5cGUucmVhZEJpZ1VJbnQ2NEJFID0gZGVmaW5lQmlnSW50TWV0aG9kKGZ1bmN0aW9uIHJlYWRCaWdVSW50NjRCRShvZmZzZXQpIHtcbiAgICBvZmZzZXQgPSBvZmZzZXQgPj4+IDA7XG4gICAgdmFsaWRhdGVOdW1iZXIob2Zmc2V0LCBcIm9mZnNldFwiKTtcbiAgICBjb25zdCBmaXJzdCA9IHRoaXNbb2Zmc2V0XTtcbiAgICBjb25zdCBsYXN0ID0gdGhpc1tvZmZzZXQgKyA3XTtcbiAgICBpZiAoZmlyc3QgPT09IHZvaWQgMCB8fCBsYXN0ID09PSB2b2lkIDApIHtcbiAgICAgIGJvdW5kc0Vycm9yKG9mZnNldCwgdGhpcy5sZW5ndGggLSA4KTtcbiAgICB9XG4gICAgY29uc3QgaGkgPSBmaXJzdCAqIDIgKiogMjQgKyB0aGlzWysrb2Zmc2V0XSAqIDIgKiogMTYgKyB0aGlzWysrb2Zmc2V0XSAqIDIgKiogOCArIHRoaXNbKytvZmZzZXRdO1xuICAgIGNvbnN0IGxvID0gdGhpc1srK29mZnNldF0gKiAyICoqIDI0ICsgdGhpc1srK29mZnNldF0gKiAyICoqIDE2ICsgdGhpc1srK29mZnNldF0gKiAyICoqIDggKyBsYXN0O1xuICAgIHJldHVybiAoQmlnSW50KGhpKSA8PCBCaWdJbnQoMzIpKSArIEJpZ0ludChsbyk7XG4gIH0pO1xuICBCdWZmZXIyLnByb3RvdHlwZS5yZWFkSW50TEUgPSBmdW5jdGlvbiByZWFkSW50TEUob2Zmc2V0LCBieXRlTGVuZ3RoMiwgbm9Bc3NlcnQpIHtcbiAgICBvZmZzZXQgPSBvZmZzZXQgPj4+IDA7XG4gICAgYnl0ZUxlbmd0aDIgPSBieXRlTGVuZ3RoMiA+Pj4gMDtcbiAgICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIGJ5dGVMZW5ndGgyLCB0aGlzLmxlbmd0aCk7XG4gICAgbGV0IHZhbCA9IHRoaXNbb2Zmc2V0XTtcbiAgICBsZXQgbXVsID0gMTtcbiAgICBsZXQgaSA9IDA7XG4gICAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGgyICYmIChtdWwgKj0gMjU2KSkge1xuICAgICAgdmFsICs9IHRoaXNbb2Zmc2V0ICsgaV0gKiBtdWw7XG4gICAgfVxuICAgIG11bCAqPSAxMjg7XG4gICAgaWYgKHZhbCA+PSBtdWwpIHZhbCAtPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aDIpO1xuICAgIHJldHVybiB2YWw7XG4gIH07XG4gIEJ1ZmZlcjIucHJvdG90eXBlLnJlYWRJbnRCRSA9IGZ1bmN0aW9uIHJlYWRJbnRCRShvZmZzZXQsIGJ5dGVMZW5ndGgyLCBub0Fzc2VydCkge1xuICAgIG9mZnNldCA9IG9mZnNldCA+Pj4gMDtcbiAgICBieXRlTGVuZ3RoMiA9IGJ5dGVMZW5ndGgyID4+PiAwO1xuICAgIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aDIsIHRoaXMubGVuZ3RoKTtcbiAgICBsZXQgaSA9IGJ5dGVMZW5ndGgyO1xuICAgIGxldCBtdWwgPSAxO1xuICAgIGxldCB2YWwgPSB0aGlzW29mZnNldCArIC0taV07XG4gICAgd2hpbGUgKGkgPiAwICYmIChtdWwgKj0gMjU2KSkge1xuICAgICAgdmFsICs9IHRoaXNbb2Zmc2V0ICsgLS1pXSAqIG11bDtcbiAgICB9XG4gICAgbXVsICo9IDEyODtcbiAgICBpZiAodmFsID49IG11bCkgdmFsIC09IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoMik7XG4gICAgcmV0dXJuIHZhbDtcbiAgfTtcbiAgQnVmZmVyMi5wcm90b3R5cGUucmVhZEludDggPSBmdW5jdGlvbiByZWFkSW50OChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gICAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwO1xuICAgIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMSwgdGhpcy5sZW5ndGgpO1xuICAgIGlmICghKHRoaXNbb2Zmc2V0XSAmIDEyOCkpIHJldHVybiB0aGlzW29mZnNldF07XG4gICAgcmV0dXJuICgyNTUgLSB0aGlzW29mZnNldF0gKyAxKSAqIC0xO1xuICB9O1xuICBCdWZmZXIyLnByb3RvdHlwZS5yZWFkSW50MTZMRSA9IGZ1bmN0aW9uIHJlYWRJbnQxNkxFKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgICBvZmZzZXQgPSBvZmZzZXQgPj4+IDA7XG4gICAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aCk7XG4gICAgY29uc3QgdmFsID0gdGhpc1tvZmZzZXRdIHwgdGhpc1tvZmZzZXQgKyAxXSA8PCA4O1xuICAgIHJldHVybiB2YWwgJiAzMjc2OCA/IHZhbCB8IDQyOTQ5MDE3NjAgOiB2YWw7XG4gIH07XG4gIEJ1ZmZlcjIucHJvdG90eXBlLnJlYWRJbnQxNkJFID0gZnVuY3Rpb24gcmVhZEludDE2QkUob2Zmc2V0LCBub0Fzc2VydCkge1xuICAgIG9mZnNldCA9IG9mZnNldCA+Pj4gMDtcbiAgICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKTtcbiAgICBjb25zdCB2YWwgPSB0aGlzW29mZnNldCArIDFdIHwgdGhpc1tvZmZzZXRdIDw8IDg7XG4gICAgcmV0dXJuIHZhbCAmIDMyNzY4ID8gdmFsIHwgNDI5NDkwMTc2MCA6IHZhbDtcbiAgfTtcbiAgQnVmZmVyMi5wcm90b3R5cGUucmVhZEludDMyTEUgPSBmdW5jdGlvbiByZWFkSW50MzJMRShvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gICAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwO1xuICAgIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpO1xuICAgIHJldHVybiB0aGlzW29mZnNldF0gfCB0aGlzW29mZnNldCArIDFdIDw8IDggfCB0aGlzW29mZnNldCArIDJdIDw8IDE2IHwgdGhpc1tvZmZzZXQgKyAzXSA8PCAyNDtcbiAgfTtcbiAgQnVmZmVyMi5wcm90b3R5cGUucmVhZEludDMyQkUgPSBmdW5jdGlvbiByZWFkSW50MzJCRShvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gICAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwO1xuICAgIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpO1xuICAgIHJldHVybiB0aGlzW29mZnNldF0gPDwgMjQgfCB0aGlzW29mZnNldCArIDFdIDw8IDE2IHwgdGhpc1tvZmZzZXQgKyAyXSA8PCA4IHwgdGhpc1tvZmZzZXQgKyAzXTtcbiAgfTtcbiAgQnVmZmVyMi5wcm90b3R5cGUucmVhZEJpZ0ludDY0TEUgPSBkZWZpbmVCaWdJbnRNZXRob2QoZnVuY3Rpb24gcmVhZEJpZ0ludDY0TEUob2Zmc2V0KSB7XG4gICAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwO1xuICAgIHZhbGlkYXRlTnVtYmVyKG9mZnNldCwgXCJvZmZzZXRcIik7XG4gICAgY29uc3QgZmlyc3QgPSB0aGlzW29mZnNldF07XG4gICAgY29uc3QgbGFzdCA9IHRoaXNbb2Zmc2V0ICsgN107XG4gICAgaWYgKGZpcnN0ID09PSB2b2lkIDAgfHwgbGFzdCA9PT0gdm9pZCAwKSB7XG4gICAgICBib3VuZHNFcnJvcihvZmZzZXQsIHRoaXMubGVuZ3RoIC0gOCk7XG4gICAgfVxuICAgIGNvbnN0IHZhbCA9IHRoaXNbb2Zmc2V0ICsgNF0gKyB0aGlzW29mZnNldCArIDVdICogMiAqKiA4ICsgdGhpc1tvZmZzZXQgKyA2XSAqIDIgKiogMTYgKyAobGFzdCA8PCAyNCk7XG4gICAgcmV0dXJuIChCaWdJbnQodmFsKSA8PCBCaWdJbnQoMzIpKSArIEJpZ0ludChmaXJzdCArIHRoaXNbKytvZmZzZXRdICogMiAqKiA4ICsgdGhpc1srK29mZnNldF0gKiAyICoqIDE2ICsgdGhpc1srK29mZnNldF0gKiAyICoqIDI0KTtcbiAgfSk7XG4gIEJ1ZmZlcjIucHJvdG90eXBlLnJlYWRCaWdJbnQ2NEJFID0gZGVmaW5lQmlnSW50TWV0aG9kKGZ1bmN0aW9uIHJlYWRCaWdJbnQ2NEJFKG9mZnNldCkge1xuICAgIG9mZnNldCA9IG9mZnNldCA+Pj4gMDtcbiAgICB2YWxpZGF0ZU51bWJlcihvZmZzZXQsIFwib2Zmc2V0XCIpO1xuICAgIGNvbnN0IGZpcnN0ID0gdGhpc1tvZmZzZXRdO1xuICAgIGNvbnN0IGxhc3QgPSB0aGlzW29mZnNldCArIDddO1xuICAgIGlmIChmaXJzdCA9PT0gdm9pZCAwIHx8IGxhc3QgPT09IHZvaWQgMCkge1xuICAgICAgYm91bmRzRXJyb3Iob2Zmc2V0LCB0aGlzLmxlbmd0aCAtIDgpO1xuICAgIH1cbiAgICBjb25zdCB2YWwgPSAoZmlyc3QgPDwgMjQpICsgLy8gT3ZlcmZsb3dcbiAgICB0aGlzWysrb2Zmc2V0XSAqIDIgKiogMTYgKyB0aGlzWysrb2Zmc2V0XSAqIDIgKiogOCArIHRoaXNbKytvZmZzZXRdO1xuICAgIHJldHVybiAoQmlnSW50KHZhbCkgPDwgQmlnSW50KDMyKSkgKyBCaWdJbnQodGhpc1srK29mZnNldF0gKiAyICoqIDI0ICsgdGhpc1srK29mZnNldF0gKiAyICoqIDE2ICsgdGhpc1srK29mZnNldF0gKiAyICoqIDggKyBsYXN0KTtcbiAgfSk7XG4gIEJ1ZmZlcjIucHJvdG90eXBlLnJlYWRGbG9hdExFID0gZnVuY3Rpb24gcmVhZEZsb2F0TEUob2Zmc2V0LCBub0Fzc2VydCkge1xuICAgIG9mZnNldCA9IG9mZnNldCA+Pj4gMDtcbiAgICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKTtcbiAgICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgdHJ1ZSwgMjMsIDQpO1xuICB9O1xuICBCdWZmZXIyLnByb3RvdHlwZS5yZWFkRmxvYXRCRSA9IGZ1bmN0aW9uIHJlYWRGbG9hdEJFKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgICBvZmZzZXQgPSBvZmZzZXQgPj4+IDA7XG4gICAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aCk7XG4gICAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIGZhbHNlLCAyMywgNCk7XG4gIH07XG4gIEJ1ZmZlcjIucHJvdG90eXBlLnJlYWREb3VibGVMRSA9IGZ1bmN0aW9uIHJlYWREb3VibGVMRShvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gICAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwO1xuICAgIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgOCwgdGhpcy5sZW5ndGgpO1xuICAgIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCB0cnVlLCA1MiwgOCk7XG4gIH07XG4gIEJ1ZmZlcjIucHJvdG90eXBlLnJlYWREb3VibGVCRSA9IGZ1bmN0aW9uIHJlYWREb3VibGVCRShvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gICAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwO1xuICAgIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgOCwgdGhpcy5sZW5ndGgpO1xuICAgIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCBmYWxzZSwgNTIsIDgpO1xuICB9O1xuICBmdW5jdGlvbiBjaGVja0ludChidWYsIHZhbHVlLCBvZmZzZXQsIGV4dCwgbWF4LCBtaW4pIHtcbiAgICBpZiAoIUJ1ZmZlcjIuaXNCdWZmZXIoYnVmKSkgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJidWZmZXJcIiBhcmd1bWVudCBtdXN0IGJlIGEgQnVmZmVyIGluc3RhbmNlJyk7XG4gICAgaWYgKHZhbHVlID4gbWF4IHx8IHZhbHVlIDwgbWluKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignXCJ2YWx1ZVwiIGFyZ3VtZW50IGlzIG91dCBvZiBib3VuZHMnKTtcbiAgICBpZiAob2Zmc2V0ICsgZXh0ID4gYnVmLmxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoXCJJbmRleCBvdXQgb2YgcmFuZ2VcIik7XG4gIH1cbiAgQnVmZmVyMi5wcm90b3R5cGUud3JpdGVVaW50TEUgPSBCdWZmZXIyLnByb3RvdHlwZS53cml0ZVVJbnRMRSA9IGZ1bmN0aW9uIHdyaXRlVUludExFKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgyLCBub0Fzc2VydCkge1xuICAgIHZhbHVlID0gK3ZhbHVlO1xuICAgIG9mZnNldCA9IG9mZnNldCA+Pj4gMDtcbiAgICBieXRlTGVuZ3RoMiA9IGJ5dGVMZW5ndGgyID4+PiAwO1xuICAgIGlmICghbm9Bc3NlcnQpIHtcbiAgICAgIGNvbnN0IG1heEJ5dGVzID0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGgyKSAtIDE7XG4gICAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoMiwgbWF4Qnl0ZXMsIDApO1xuICAgIH1cbiAgICBsZXQgbXVsID0gMTtcbiAgICBsZXQgaSA9IDA7XG4gICAgdGhpc1tvZmZzZXRdID0gdmFsdWUgJiAyNTU7XG4gICAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGgyICYmIChtdWwgKj0gMjU2KSkge1xuICAgICAgdGhpc1tvZmZzZXQgKyBpXSA9IHZhbHVlIC8gbXVsICYgMjU1O1xuICAgIH1cbiAgICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aDI7XG4gIH07XG4gIEJ1ZmZlcjIucHJvdG90eXBlLndyaXRlVWludEJFID0gQnVmZmVyMi5wcm90b3R5cGUud3JpdGVVSW50QkUgPSBmdW5jdGlvbiB3cml0ZVVJbnRCRSh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoMiwgbm9Bc3NlcnQpIHtcbiAgICB2YWx1ZSA9ICt2YWx1ZTtcbiAgICBvZmZzZXQgPSBvZmZzZXQgPj4+IDA7XG4gICAgYnl0ZUxlbmd0aDIgPSBieXRlTGVuZ3RoMiA+Pj4gMDtcbiAgICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgICBjb25zdCBtYXhCeXRlcyA9IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoMikgLSAxO1xuICAgICAgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aDIsIG1heEJ5dGVzLCAwKTtcbiAgICB9XG4gICAgbGV0IGkgPSBieXRlTGVuZ3RoMiAtIDE7XG4gICAgbGV0IG11bCA9IDE7XG4gICAgdGhpc1tvZmZzZXQgKyBpXSA9IHZhbHVlICYgMjU1O1xuICAgIHdoaWxlICgtLWkgPj0gMCAmJiAobXVsICo9IDI1NikpIHtcbiAgICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSB2YWx1ZSAvIG11bCAmIDI1NTtcbiAgICB9XG4gICAgcmV0dXJuIG9mZnNldCArIGJ5dGVMZW5ndGgyO1xuICB9O1xuICBCdWZmZXIyLnByb3RvdHlwZS53cml0ZVVpbnQ4ID0gQnVmZmVyMi5wcm90b3R5cGUud3JpdGVVSW50OCA9IGZ1bmN0aW9uIHdyaXRlVUludDgodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgICB2YWx1ZSA9ICt2YWx1ZTtcbiAgICBvZmZzZXQgPSBvZmZzZXQgPj4+IDA7XG4gICAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMSwgMjU1LCAwKTtcbiAgICB0aGlzW29mZnNldF0gPSB2YWx1ZSAmIDI1NTtcbiAgICByZXR1cm4gb2Zmc2V0ICsgMTtcbiAgfTtcbiAgQnVmZmVyMi5wcm90b3R5cGUud3JpdGVVaW50MTZMRSA9IEJ1ZmZlcjIucHJvdG90eXBlLndyaXRlVUludDE2TEUgPSBmdW5jdGlvbiB3cml0ZVVJbnQxNkxFKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gICAgdmFsdWUgPSArdmFsdWU7XG4gICAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwO1xuICAgIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDY1NTM1LCAwKTtcbiAgICB0aGlzW29mZnNldF0gPSB2YWx1ZSAmIDI1NTtcbiAgICB0aGlzW29mZnNldCArIDFdID0gdmFsdWUgPj4+IDg7XG4gICAgcmV0dXJuIG9mZnNldCArIDI7XG4gIH07XG4gIEJ1ZmZlcjIucHJvdG90eXBlLndyaXRlVWludDE2QkUgPSBCdWZmZXIyLnByb3RvdHlwZS53cml0ZVVJbnQxNkJFID0gZnVuY3Rpb24gd3JpdGVVSW50MTZCRSh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICAgIHZhbHVlID0gK3ZhbHVlO1xuICAgIG9mZnNldCA9IG9mZnNldCA+Pj4gMDtcbiAgICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCA2NTUzNSwgMCk7XG4gICAgdGhpc1tvZmZzZXRdID0gdmFsdWUgPj4+IDg7XG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9IHZhbHVlICYgMjU1O1xuICAgIHJldHVybiBvZmZzZXQgKyAyO1xuICB9O1xuICBCdWZmZXIyLnByb3RvdHlwZS53cml0ZVVpbnQzMkxFID0gQnVmZmVyMi5wcm90b3R5cGUud3JpdGVVSW50MzJMRSA9IGZ1bmN0aW9uIHdyaXRlVUludDMyTEUodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgICB2YWx1ZSA9ICt2YWx1ZTtcbiAgICBvZmZzZXQgPSBvZmZzZXQgPj4+IDA7XG4gICAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgNDI5NDk2NzI5NSwgMCk7XG4gICAgdGhpc1tvZmZzZXQgKyAzXSA9IHZhbHVlID4+PiAyNDtcbiAgICB0aGlzW29mZnNldCArIDJdID0gdmFsdWUgPj4+IDE2O1xuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSB2YWx1ZSA+Pj4gODtcbiAgICB0aGlzW29mZnNldF0gPSB2YWx1ZSAmIDI1NTtcbiAgICByZXR1cm4gb2Zmc2V0ICsgNDtcbiAgfTtcbiAgQnVmZmVyMi5wcm90b3R5cGUud3JpdGVVaW50MzJCRSA9IEJ1ZmZlcjIucHJvdG90eXBlLndyaXRlVUludDMyQkUgPSBmdW5jdGlvbiB3cml0ZVVJbnQzMkJFKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gICAgdmFsdWUgPSArdmFsdWU7XG4gICAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwO1xuICAgIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDQyOTQ5NjcyOTUsIDApO1xuICAgIHRoaXNbb2Zmc2V0XSA9IHZhbHVlID4+PiAyNDtcbiAgICB0aGlzW29mZnNldCArIDFdID0gdmFsdWUgPj4+IDE2O1xuICAgIHRoaXNbb2Zmc2V0ICsgMl0gPSB2YWx1ZSA+Pj4gODtcbiAgICB0aGlzW29mZnNldCArIDNdID0gdmFsdWUgJiAyNTU7XG4gICAgcmV0dXJuIG9mZnNldCArIDQ7XG4gIH07XG4gIGZ1bmN0aW9uIHdydEJpZ1VJbnQ2NExFKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbWluLCBtYXgpIHtcbiAgICBjaGVja0ludEJJKHZhbHVlLCBtaW4sIG1heCwgYnVmLCBvZmZzZXQsIDcpO1xuICAgIGxldCBsbyA9IE51bWJlcih2YWx1ZSAmIEJpZ0ludCg0Mjk0OTY3Mjk1KSk7XG4gICAgYnVmW29mZnNldCsrXSA9IGxvO1xuICAgIGxvID0gbG8gPj4gODtcbiAgICBidWZbb2Zmc2V0KytdID0gbG87XG4gICAgbG8gPSBsbyA+PiA4O1xuICAgIGJ1ZltvZmZzZXQrK10gPSBsbztcbiAgICBsbyA9IGxvID4+IDg7XG4gICAgYnVmW29mZnNldCsrXSA9IGxvO1xuICAgIGxldCBoaSA9IE51bWJlcih2YWx1ZSA+PiBCaWdJbnQoMzIpICYgQmlnSW50KDQyOTQ5NjcyOTUpKTtcbiAgICBidWZbb2Zmc2V0KytdID0gaGk7XG4gICAgaGkgPSBoaSA+PiA4O1xuICAgIGJ1ZltvZmZzZXQrK10gPSBoaTtcbiAgICBoaSA9IGhpID4+IDg7XG4gICAgYnVmW29mZnNldCsrXSA9IGhpO1xuICAgIGhpID0gaGkgPj4gODtcbiAgICBidWZbb2Zmc2V0KytdID0gaGk7XG4gICAgcmV0dXJuIG9mZnNldDtcbiAgfVxuICBmdW5jdGlvbiB3cnRCaWdVSW50NjRCRShidWYsIHZhbHVlLCBvZmZzZXQsIG1pbiwgbWF4KSB7XG4gICAgY2hlY2tJbnRCSSh2YWx1ZSwgbWluLCBtYXgsIGJ1Ziwgb2Zmc2V0LCA3KTtcbiAgICBsZXQgbG8gPSBOdW1iZXIodmFsdWUgJiBCaWdJbnQoNDI5NDk2NzI5NSkpO1xuICAgIGJ1ZltvZmZzZXQgKyA3XSA9IGxvO1xuICAgIGxvID0gbG8gPj4gODtcbiAgICBidWZbb2Zmc2V0ICsgNl0gPSBsbztcbiAgICBsbyA9IGxvID4+IDg7XG4gICAgYnVmW29mZnNldCArIDVdID0gbG87XG4gICAgbG8gPSBsbyA+PiA4O1xuICAgIGJ1ZltvZmZzZXQgKyA0XSA9IGxvO1xuICAgIGxldCBoaSA9IE51bWJlcih2YWx1ZSA+PiBCaWdJbnQoMzIpICYgQmlnSW50KDQyOTQ5NjcyOTUpKTtcbiAgICBidWZbb2Zmc2V0ICsgM10gPSBoaTtcbiAgICBoaSA9IGhpID4+IDg7XG4gICAgYnVmW29mZnNldCArIDJdID0gaGk7XG4gICAgaGkgPSBoaSA+PiA4O1xuICAgIGJ1ZltvZmZzZXQgKyAxXSA9IGhpO1xuICAgIGhpID0gaGkgPj4gODtcbiAgICBidWZbb2Zmc2V0XSA9IGhpO1xuICAgIHJldHVybiBvZmZzZXQgKyA4O1xuICB9XG4gIEJ1ZmZlcjIucHJvdG90eXBlLndyaXRlQmlnVUludDY0TEUgPSBkZWZpbmVCaWdJbnRNZXRob2QoZnVuY3Rpb24gd3JpdGVCaWdVSW50NjRMRSh2YWx1ZSwgb2Zmc2V0ID0gMCkge1xuICAgIHJldHVybiB3cnRCaWdVSW50NjRMRSh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBCaWdJbnQoMCksIEJpZ0ludChcIjB4ZmZmZmZmZmZmZmZmZmZmZlwiKSk7XG4gIH0pO1xuICBCdWZmZXIyLnByb3RvdHlwZS53cml0ZUJpZ1VJbnQ2NEJFID0gZGVmaW5lQmlnSW50TWV0aG9kKGZ1bmN0aW9uIHdyaXRlQmlnVUludDY0QkUodmFsdWUsIG9mZnNldCA9IDApIHtcbiAgICByZXR1cm4gd3J0QmlnVUludDY0QkUodGhpcywgdmFsdWUsIG9mZnNldCwgQmlnSW50KDApLCBCaWdJbnQoXCIweGZmZmZmZmZmZmZmZmZmZmZcIikpO1xuICB9KTtcbiAgQnVmZmVyMi5wcm90b3R5cGUud3JpdGVJbnRMRSA9IGZ1bmN0aW9uIHdyaXRlSW50TEUodmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aDIsIG5vQXNzZXJ0KSB7XG4gICAgdmFsdWUgPSArdmFsdWU7XG4gICAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwO1xuICAgIGlmICghbm9Bc3NlcnQpIHtcbiAgICAgIGNvbnN0IGxpbWl0ID0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGgyIC0gMSk7XG4gICAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoMiwgbGltaXQgLSAxLCAtbGltaXQpO1xuICAgIH1cbiAgICBsZXQgaSA9IDA7XG4gICAgbGV0IG11bCA9IDE7XG4gICAgbGV0IHN1YiA9IDA7XG4gICAgdGhpc1tvZmZzZXRdID0gdmFsdWUgJiAyNTU7XG4gICAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGgyICYmIChtdWwgKj0gMjU2KSkge1xuICAgICAgaWYgKHZhbHVlIDwgMCAmJiBzdWIgPT09IDAgJiYgdGhpc1tvZmZzZXQgKyBpIC0gMV0gIT09IDApIHtcbiAgICAgICAgc3ViID0gMTtcbiAgICAgIH1cbiAgICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAodmFsdWUgLyBtdWwgPj4gMCkgLSBzdWIgJiAyNTU7XG4gICAgfVxuICAgIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoMjtcbiAgfTtcbiAgQnVmZmVyMi5wcm90b3R5cGUud3JpdGVJbnRCRSA9IGZ1bmN0aW9uIHdyaXRlSW50QkUodmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aDIsIG5vQXNzZXJ0KSB7XG4gICAgdmFsdWUgPSArdmFsdWU7XG4gICAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwO1xuICAgIGlmICghbm9Bc3NlcnQpIHtcbiAgICAgIGNvbnN0IGxpbWl0ID0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGgyIC0gMSk7XG4gICAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoMiwgbGltaXQgLSAxLCAtbGltaXQpO1xuICAgIH1cbiAgICBsZXQgaSA9IGJ5dGVMZW5ndGgyIC0gMTtcbiAgICBsZXQgbXVsID0gMTtcbiAgICBsZXQgc3ViID0gMDtcbiAgICB0aGlzW29mZnNldCArIGldID0gdmFsdWUgJiAyNTU7XG4gICAgd2hpbGUgKC0taSA+PSAwICYmIChtdWwgKj0gMjU2KSkge1xuICAgICAgaWYgKHZhbHVlIDwgMCAmJiBzdWIgPT09IDAgJiYgdGhpc1tvZmZzZXQgKyBpICsgMV0gIT09IDApIHtcbiAgICAgICAgc3ViID0gMTtcbiAgICAgIH1cbiAgICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAodmFsdWUgLyBtdWwgPj4gMCkgLSBzdWIgJiAyNTU7XG4gICAgfVxuICAgIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoMjtcbiAgfTtcbiAgQnVmZmVyMi5wcm90b3R5cGUud3JpdGVJbnQ4ID0gZnVuY3Rpb24gd3JpdGVJbnQ4KHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gICAgdmFsdWUgPSArdmFsdWU7XG4gICAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwO1xuICAgIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDEsIDEyNywgLTEyOCk7XG4gICAgaWYgKHZhbHVlIDwgMCkgdmFsdWUgPSAyNTUgKyB2YWx1ZSArIDE7XG4gICAgdGhpc1tvZmZzZXRdID0gdmFsdWUgJiAyNTU7XG4gICAgcmV0dXJuIG9mZnNldCArIDE7XG4gIH07XG4gIEJ1ZmZlcjIucHJvdG90eXBlLndyaXRlSW50MTZMRSA9IGZ1bmN0aW9uIHdyaXRlSW50MTZMRSh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICAgIHZhbHVlID0gK3ZhbHVlO1xuICAgIG9mZnNldCA9IG9mZnNldCA+Pj4gMDtcbiAgICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAzMjc2NywgLTMyNzY4KTtcbiAgICB0aGlzW29mZnNldF0gPSB2YWx1ZSAmIDI1NTtcbiAgICB0aGlzW29mZnNldCArIDFdID0gdmFsdWUgPj4+IDg7XG4gICAgcmV0dXJuIG9mZnNldCArIDI7XG4gIH07XG4gIEJ1ZmZlcjIucHJvdG90eXBlLndyaXRlSW50MTZCRSA9IGZ1bmN0aW9uIHdyaXRlSW50MTZCRSh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICAgIHZhbHVlID0gK3ZhbHVlO1xuICAgIG9mZnNldCA9IG9mZnNldCA+Pj4gMDtcbiAgICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAzMjc2NywgLTMyNzY4KTtcbiAgICB0aGlzW29mZnNldF0gPSB2YWx1ZSA+Pj4gODtcbiAgICB0aGlzW29mZnNldCArIDFdID0gdmFsdWUgJiAyNTU7XG4gICAgcmV0dXJuIG9mZnNldCArIDI7XG4gIH07XG4gIEJ1ZmZlcjIucHJvdG90eXBlLndyaXRlSW50MzJMRSA9IGZ1bmN0aW9uIHdyaXRlSW50MzJMRSh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICAgIHZhbHVlID0gK3ZhbHVlO1xuICAgIG9mZnNldCA9IG9mZnNldCA+Pj4gMDtcbiAgICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCA0LCAyMTQ3NDgzNjQ3LCAtMjE0NzQ4MzY0OCk7XG4gICAgdGhpc1tvZmZzZXRdID0gdmFsdWUgJiAyNTU7XG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9IHZhbHVlID4+PiA4O1xuICAgIHRoaXNbb2Zmc2V0ICsgMl0gPSB2YWx1ZSA+Pj4gMTY7XG4gICAgdGhpc1tvZmZzZXQgKyAzXSA9IHZhbHVlID4+PiAyNDtcbiAgICByZXR1cm4gb2Zmc2V0ICsgNDtcbiAgfTtcbiAgQnVmZmVyMi5wcm90b3R5cGUud3JpdGVJbnQzMkJFID0gZnVuY3Rpb24gd3JpdGVJbnQzMkJFKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gICAgdmFsdWUgPSArdmFsdWU7XG4gICAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwO1xuICAgIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDIxNDc0ODM2NDcsIC0yMTQ3NDgzNjQ4KTtcbiAgICBpZiAodmFsdWUgPCAwKSB2YWx1ZSA9IDQyOTQ5NjcyOTUgKyB2YWx1ZSArIDE7XG4gICAgdGhpc1tvZmZzZXRdID0gdmFsdWUgPj4+IDI0O1xuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSB2YWx1ZSA+Pj4gMTY7XG4gICAgdGhpc1tvZmZzZXQgKyAyXSA9IHZhbHVlID4+PiA4O1xuICAgIHRoaXNbb2Zmc2V0ICsgM10gPSB2YWx1ZSAmIDI1NTtcbiAgICByZXR1cm4gb2Zmc2V0ICsgNDtcbiAgfTtcbiAgQnVmZmVyMi5wcm90b3R5cGUud3JpdGVCaWdJbnQ2NExFID0gZGVmaW5lQmlnSW50TWV0aG9kKGZ1bmN0aW9uIHdyaXRlQmlnSW50NjRMRSh2YWx1ZSwgb2Zmc2V0ID0gMCkge1xuICAgIHJldHVybiB3cnRCaWdVSW50NjRMRSh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAtQmlnSW50KFwiMHg4MDAwMDAwMDAwMDAwMDAwXCIpLCBCaWdJbnQoXCIweDdmZmZmZmZmZmZmZmZmZmZcIikpO1xuICB9KTtcbiAgQnVmZmVyMi5wcm90b3R5cGUud3JpdGVCaWdJbnQ2NEJFID0gZGVmaW5lQmlnSW50TWV0aG9kKGZ1bmN0aW9uIHdyaXRlQmlnSW50NjRCRSh2YWx1ZSwgb2Zmc2V0ID0gMCkge1xuICAgIHJldHVybiB3cnRCaWdVSW50NjRCRSh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAtQmlnSW50KFwiMHg4MDAwMDAwMDAwMDAwMDAwXCIpLCBCaWdJbnQoXCIweDdmZmZmZmZmZmZmZmZmZmZcIikpO1xuICB9KTtcbiAgZnVuY3Rpb24gY2hlY2tJRUVFNzU0KGJ1ZiwgdmFsdWUsIG9mZnNldCwgZXh0LCBtYXgsIG1pbikge1xuICAgIGlmIChvZmZzZXQgKyBleHQgPiBidWYubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcihcIkluZGV4IG91dCBvZiByYW5nZVwiKTtcbiAgICBpZiAob2Zmc2V0IDwgMCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoXCJJbmRleCBvdXQgb2YgcmFuZ2VcIik7XG4gIH1cbiAgZnVuY3Rpb24gd3JpdGVGbG9hdChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgICB2YWx1ZSA9ICt2YWx1ZTtcbiAgICBvZmZzZXQgPSBvZmZzZXQgPj4+IDA7XG4gICAgaWYgKCFub0Fzc2VydCkge1xuICAgICAgY2hlY2tJRUVFNzU0KGJ1ZiwgdmFsdWUsIG9mZnNldCwgNCk7XG4gICAgfVxuICAgIGllZWU3NTQud3JpdGUoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIDIzLCA0KTtcbiAgICByZXR1cm4gb2Zmc2V0ICsgNDtcbiAgfVxuICBCdWZmZXIyLnByb3RvdHlwZS53cml0ZUZsb2F0TEUgPSBmdW5jdGlvbiB3cml0ZUZsb2F0TEUodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgICByZXR1cm4gd3JpdGVGbG9hdCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydCk7XG4gIH07XG4gIEJ1ZmZlcjIucHJvdG90eXBlLndyaXRlRmxvYXRCRSA9IGZ1bmN0aW9uIHdyaXRlRmxvYXRCRSh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICAgIHJldHVybiB3cml0ZUZsb2F0KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydCk7XG4gIH07XG4gIGZ1bmN0aW9uIHdyaXRlRG91YmxlKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICAgIHZhbHVlID0gK3ZhbHVlO1xuICAgIG9mZnNldCA9IG9mZnNldCA+Pj4gMDtcbiAgICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgICBjaGVja0lFRUU3NTQoYnVmLCB2YWx1ZSwgb2Zmc2V0LCA4KTtcbiAgICB9XG4gICAgaWVlZTc1NC53cml0ZShidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgNTIsIDgpO1xuICAgIHJldHVybiBvZmZzZXQgKyA4O1xuICB9XG4gIEJ1ZmZlcjIucHJvdG90eXBlLndyaXRlRG91YmxlTEUgPSBmdW5jdGlvbiB3cml0ZURvdWJsZUxFKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gICAgcmV0dXJuIHdyaXRlRG91YmxlKHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KTtcbiAgfTtcbiAgQnVmZmVyMi5wcm90b3R5cGUud3JpdGVEb3VibGVCRSA9IGZ1bmN0aW9uIHdyaXRlRG91YmxlQkUodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgICByZXR1cm4gd3JpdGVEb3VibGUodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KTtcbiAgfTtcbiAgQnVmZmVyMi5wcm90b3R5cGUuY29weSA9IGZ1bmN0aW9uIGNvcHkodGFyZ2V0LCB0YXJnZXRTdGFydCwgc3RhcnQsIGVuZCkge1xuICAgIGlmICghQnVmZmVyMi5pc0J1ZmZlcih0YXJnZXQpKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYXJndW1lbnQgc2hvdWxkIGJlIGEgQnVmZmVyXCIpO1xuICAgIGlmICghc3RhcnQpIHN0YXJ0ID0gMDtcbiAgICBpZiAoIWVuZCAmJiBlbmQgIT09IDApIGVuZCA9IHRoaXMubGVuZ3RoO1xuICAgIGlmICh0YXJnZXRTdGFydCA+PSB0YXJnZXQubGVuZ3RoKSB0YXJnZXRTdGFydCA9IHRhcmdldC5sZW5ndGg7XG4gICAgaWYgKCF0YXJnZXRTdGFydCkgdGFyZ2V0U3RhcnQgPSAwO1xuICAgIGlmIChlbmQgPiAwICYmIGVuZCA8IHN0YXJ0KSBlbmQgPSBzdGFydDtcbiAgICBpZiAoZW5kID09PSBzdGFydCkgcmV0dXJuIDA7XG4gICAgaWYgKHRhcmdldC5sZW5ndGggPT09IDAgfHwgdGhpcy5sZW5ndGggPT09IDApIHJldHVybiAwO1xuICAgIGlmICh0YXJnZXRTdGFydCA8IDApIHtcbiAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKFwidGFyZ2V0U3RhcnQgb3V0IG9mIGJvdW5kc1wiKTtcbiAgICB9XG4gICAgaWYgKHN0YXJ0IDwgMCB8fCBzdGFydCA+PSB0aGlzLmxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoXCJJbmRleCBvdXQgb2YgcmFuZ2VcIik7XG4gICAgaWYgKGVuZCA8IDApIHRocm93IG5ldyBSYW5nZUVycm9yKFwic291cmNlRW5kIG91dCBvZiBib3VuZHNcIik7XG4gICAgaWYgKGVuZCA+IHRoaXMubGVuZ3RoKSBlbmQgPSB0aGlzLmxlbmd0aDtcbiAgICBpZiAodGFyZ2V0Lmxlbmd0aCAtIHRhcmdldFN0YXJ0IDwgZW5kIC0gc3RhcnQpIHtcbiAgICAgIGVuZCA9IHRhcmdldC5sZW5ndGggLSB0YXJnZXRTdGFydCArIHN0YXJ0O1xuICAgIH1cbiAgICBjb25zdCBsZW4gPSBlbmQgLSBzdGFydDtcbiAgICBpZiAodGhpcyA9PT0gdGFyZ2V0ICYmIHR5cGVvZiBVaW50OEFycmF5LnByb3RvdHlwZS5jb3B5V2l0aGluID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgIHRoaXMuY29weVdpdGhpbih0YXJnZXRTdGFydCwgc3RhcnQsIGVuZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIFVpbnQ4QXJyYXkucHJvdG90eXBlLnNldC5jYWxsKHRhcmdldCwgdGhpcy5zdWJhcnJheShzdGFydCwgZW5kKSwgdGFyZ2V0U3RhcnQpO1xuICAgIH1cbiAgICByZXR1cm4gbGVuO1xuICB9O1xuICBCdWZmZXIyLnByb3RvdHlwZS5maWxsID0gZnVuY3Rpb24gZmlsbCh2YWwsIHN0YXJ0LCBlbmQsIGVuY29kaW5nKSB7XG4gICAgaWYgKHR5cGVvZiB2YWwgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIGlmICh0eXBlb2Ygc3RhcnQgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgZW5jb2RpbmcgPSBzdGFydDtcbiAgICAgICAgc3RhcnQgPSAwO1xuICAgICAgICBlbmQgPSB0aGlzLmxlbmd0aDtcbiAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGVuZCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICBlbmNvZGluZyA9IGVuZDtcbiAgICAgICAgZW5kID0gdGhpcy5sZW5ndGg7XG4gICAgICB9XG4gICAgICBpZiAoZW5jb2RpbmcgIT09IHZvaWQgMCAmJiB0eXBlb2YgZW5jb2RpbmcgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImVuY29kaW5nIG11c3QgYmUgYSBzdHJpbmdcIik7XG4gICAgICB9XG4gICAgICBpZiAodHlwZW9mIGVuY29kaW5nID09PSBcInN0cmluZ1wiICYmICFCdWZmZXIyLmlzRW5jb2RpbmcoZW5jb2RpbmcpKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJVbmtub3duIGVuY29kaW5nOiBcIiArIGVuY29kaW5nKTtcbiAgICAgIH1cbiAgICAgIGlmICh2YWwubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIGNvbnN0IGNvZGUgPSB2YWwuY2hhckNvZGVBdCgwKTtcbiAgICAgICAgaWYgKGVuY29kaW5nID09PSBcInV0ZjhcIiAmJiBjb2RlIDwgMTI4IHx8IGVuY29kaW5nID09PSBcImxhdGluMVwiKSB7XG4gICAgICAgICAgdmFsID0gY29kZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodHlwZW9mIHZhbCA9PT0gXCJudW1iZXJcIikge1xuICAgICAgdmFsID0gdmFsICYgMjU1O1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIHZhbCA9PT0gXCJib29sZWFuXCIpIHtcbiAgICAgIHZhbCA9IE51bWJlcih2YWwpO1xuICAgIH1cbiAgICBpZiAoc3RhcnQgPCAwIHx8IHRoaXMubGVuZ3RoIDwgc3RhcnQgfHwgdGhpcy5sZW5ndGggPCBlbmQpIHtcbiAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKFwiT3V0IG9mIHJhbmdlIGluZGV4XCIpO1xuICAgIH1cbiAgICBpZiAoZW5kIDw9IHN0YXJ0KSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgc3RhcnQgPSBzdGFydCA+Pj4gMDtcbiAgICBlbmQgPSBlbmQgPT09IHZvaWQgMCA/IHRoaXMubGVuZ3RoIDogZW5kID4+PiAwO1xuICAgIGlmICghdmFsKSB2YWwgPSAwO1xuICAgIGxldCBpO1xuICAgIGlmICh0eXBlb2YgdmFsID09PSBcIm51bWJlclwiKSB7XG4gICAgICBmb3IgKGkgPSBzdGFydDsgaSA8IGVuZDsgKytpKSB7XG4gICAgICAgIHRoaXNbaV0gPSB2YWw7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGJ5dGVzID0gQnVmZmVyMi5pc0J1ZmZlcih2YWwpID8gdmFsIDogQnVmZmVyMi5mcm9tKHZhbCwgZW5jb2RpbmcpO1xuICAgICAgY29uc3QgbGVuID0gYnl0ZXMubGVuZ3RoO1xuICAgICAgaWYgKGxlbiA9PT0gMCkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdUaGUgdmFsdWUgXCInICsgdmFsICsgJ1wiIGlzIGludmFsaWQgZm9yIGFyZ3VtZW50IFwidmFsdWVcIicpO1xuICAgICAgfVxuICAgICAgZm9yIChpID0gMDsgaSA8IGVuZCAtIHN0YXJ0OyArK2kpIHtcbiAgICAgICAgdGhpc1tpICsgc3RhcnRdID0gYnl0ZXNbaSAlIGxlbl07XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9O1xuICBjb25zdCBlcnJvcnMgPSB7fTtcbiAgZnVuY3Rpb24gRShzeW0sIGdldE1lc3NhZ2UsIEJhc2UpIHtcbiAgICBlcnJvcnNbc3ltXSA9IGNsYXNzIE5vZGVFcnJvciBleHRlbmRzIEJhc2Uge1xuICAgICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcIm1lc3NhZ2VcIiwge1xuICAgICAgICAgIHZhbHVlOiBnZXRNZXNzYWdlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyksXG4gICAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLm5hbWUgPSBgJHt0aGlzLm5hbWV9IFske3N5bX1dYDtcbiAgICAgICAgdGhpcy5zdGFjaztcbiAgICAgICAgZGVsZXRlIHRoaXMubmFtZTtcbiAgICAgIH1cbiAgICAgIGdldCBjb2RlKCkge1xuICAgICAgICByZXR1cm4gc3ltO1xuICAgICAgfVxuICAgICAgc2V0IGNvZGUodmFsdWUpIHtcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIFwiY29kZVwiLCB7XG4gICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgICAgdmFsdWUsXG4gICAgICAgICAgd3JpdGFibGU6IHRydWVcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICB0b1N0cmluZygpIHtcbiAgICAgICAgcmV0dXJuIGAke3RoaXMubmFtZX0gWyR7c3ltfV06ICR7dGhpcy5tZXNzYWdlfWA7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuICBFKFwiRVJSX0JVRkZFUl9PVVRfT0ZfQk9VTkRTXCIsIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICBpZiAobmFtZSkge1xuICAgICAgcmV0dXJuIGAke25hbWV9IGlzIG91dHNpZGUgb2YgYnVmZmVyIGJvdW5kc2A7XG4gICAgfVxuICAgIHJldHVybiBcIkF0dGVtcHQgdG8gYWNjZXNzIG1lbW9yeSBvdXRzaWRlIGJ1ZmZlciBib3VuZHNcIjtcbiAgfSwgUmFuZ2VFcnJvcik7XG4gIEUoXCJFUlJfSU5WQUxJRF9BUkdfVFlQRVwiLCBmdW5jdGlvbihuYW1lLCBhY3R1YWwpIHtcbiAgICByZXR1cm4gYFRoZSBcIiR7bmFtZX1cIiBhcmd1bWVudCBtdXN0IGJlIG9mIHR5cGUgbnVtYmVyLiBSZWNlaXZlZCB0eXBlICR7dHlwZW9mIGFjdHVhbH1gO1xuICB9LCBUeXBlRXJyb3IpO1xuICBFKFwiRVJSX09VVF9PRl9SQU5HRVwiLCBmdW5jdGlvbihzdHIsIHJhbmdlLCBpbnB1dCkge1xuICAgIGxldCBtc2cgPSBgVGhlIHZhbHVlIG9mIFwiJHtzdHJ9XCIgaXMgb3V0IG9mIHJhbmdlLmA7XG4gICAgbGV0IHJlY2VpdmVkID0gaW5wdXQ7XG4gICAgaWYgKE51bWJlci5pc0ludGVnZXIoaW5wdXQpICYmIE1hdGguYWJzKGlucHV0KSA+IDIgKiogMzIpIHtcbiAgICAgIHJlY2VpdmVkID0gYWRkTnVtZXJpY2FsU2VwYXJhdG9yKFN0cmluZyhpbnB1dCkpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGlucHV0ID09PSBcImJpZ2ludFwiKSB7XG4gICAgICByZWNlaXZlZCA9IFN0cmluZyhpbnB1dCk7XG4gICAgICBpZiAoaW5wdXQgPiBCaWdJbnQoMikgKiogQmlnSW50KDMyKSB8fCBpbnB1dCA8IC0oQmlnSW50KDIpICoqIEJpZ0ludCgzMikpKSB7XG4gICAgICAgIHJlY2VpdmVkID0gYWRkTnVtZXJpY2FsU2VwYXJhdG9yKHJlY2VpdmVkKTtcbiAgICAgIH1cbiAgICAgIHJlY2VpdmVkICs9IFwiblwiO1xuICAgIH1cbiAgICBtc2cgKz0gYCBJdCBtdXN0IGJlICR7cmFuZ2V9LiBSZWNlaXZlZCAke3JlY2VpdmVkfWA7XG4gICAgcmV0dXJuIG1zZztcbiAgfSwgUmFuZ2VFcnJvcik7XG4gIGZ1bmN0aW9uIGFkZE51bWVyaWNhbFNlcGFyYXRvcih2YWwpIHtcbiAgICBsZXQgcmVzID0gXCJcIjtcbiAgICBsZXQgaSA9IHZhbC5sZW5ndGg7XG4gICAgY29uc3Qgc3RhcnQgPSB2YWxbMF0gPT09IFwiLVwiID8gMSA6IDA7XG4gICAgZm9yICg7IGkgPj0gc3RhcnQgKyA0OyBpIC09IDMpIHtcbiAgICAgIHJlcyA9IGBfJHt2YWwuc2xpY2UoaSAtIDMsIGkpfSR7cmVzfWA7XG4gICAgfVxuICAgIHJldHVybiBgJHt2YWwuc2xpY2UoMCwgaSl9JHtyZXN9YDtcbiAgfVxuICBmdW5jdGlvbiBjaGVja0JvdW5kcyhidWYsIG9mZnNldCwgYnl0ZUxlbmd0aDIpIHtcbiAgICB2YWxpZGF0ZU51bWJlcihvZmZzZXQsIFwib2Zmc2V0XCIpO1xuICAgIGlmIChidWZbb2Zmc2V0XSA9PT0gdm9pZCAwIHx8IGJ1ZltvZmZzZXQgKyBieXRlTGVuZ3RoMl0gPT09IHZvaWQgMCkge1xuICAgICAgYm91bmRzRXJyb3Iob2Zmc2V0LCBidWYubGVuZ3RoIC0gKGJ5dGVMZW5ndGgyICsgMSkpO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBjaGVja0ludEJJKHZhbHVlLCBtaW4sIG1heCwgYnVmLCBvZmZzZXQsIGJ5dGVMZW5ndGgyKSB7XG4gICAgaWYgKHZhbHVlID4gbWF4IHx8IHZhbHVlIDwgbWluKSB7XG4gICAgICBjb25zdCBuID0gdHlwZW9mIG1pbiA9PT0gXCJiaWdpbnRcIiA/IFwiblwiIDogXCJcIjtcbiAgICAgIGxldCByYW5nZTtcbiAgICAgIHtcbiAgICAgICAgaWYgKG1pbiA9PT0gMCB8fCBtaW4gPT09IEJpZ0ludCgwKSkge1xuICAgICAgICAgIHJhbmdlID0gYD49IDAke259IGFuZCA8IDIke259ICoqICR7KGJ5dGVMZW5ndGgyICsgMSkgKiA4fSR7bn1gO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJhbmdlID0gYD49IC0oMiR7bn0gKiogJHsoYnl0ZUxlbmd0aDIgKyAxKSAqIDggLSAxfSR7bn0pIGFuZCA8IDIgKiogJHsoYnl0ZUxlbmd0aDIgKyAxKSAqIDggLSAxfSR7bn1gO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0aHJvdyBuZXcgZXJyb3JzLkVSUl9PVVRfT0ZfUkFOR0UoXCJ2YWx1ZVwiLCByYW5nZSwgdmFsdWUpO1xuICAgIH1cbiAgICBjaGVja0JvdW5kcyhidWYsIG9mZnNldCwgYnl0ZUxlbmd0aDIpO1xuICB9XG4gIGZ1bmN0aW9uIHZhbGlkYXRlTnVtYmVyKHZhbHVlLCBuYW1lKSB7XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gXCJudW1iZXJcIikge1xuICAgICAgdGhyb3cgbmV3IGVycm9ycy5FUlJfSU5WQUxJRF9BUkdfVFlQRShuYW1lLCBcIm51bWJlclwiLCB2YWx1ZSk7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIGJvdW5kc0Vycm9yKHZhbHVlLCBsZW5ndGgsIHR5cGUpIHtcbiAgICBpZiAoTWF0aC5mbG9vcih2YWx1ZSkgIT09IHZhbHVlKSB7XG4gICAgICB2YWxpZGF0ZU51bWJlcih2YWx1ZSwgdHlwZSk7XG4gICAgICB0aHJvdyBuZXcgZXJyb3JzLkVSUl9PVVRfT0ZfUkFOR0UoXCJvZmZzZXRcIiwgXCJhbiBpbnRlZ2VyXCIsIHZhbHVlKTtcbiAgICB9XG4gICAgaWYgKGxlbmd0aCA8IDApIHtcbiAgICAgIHRocm93IG5ldyBlcnJvcnMuRVJSX0JVRkZFUl9PVVRfT0ZfQk9VTkRTKCk7XG4gICAgfVxuICAgIHRocm93IG5ldyBlcnJvcnMuRVJSX09VVF9PRl9SQU5HRShcIm9mZnNldFwiLCBgPj0gJHswfSBhbmQgPD0gJHtsZW5ndGh9YCwgdmFsdWUpO1xuICB9XG4gIGNvbnN0IElOVkFMSURfQkFTRTY0X1JFID0gL1teKy8wLTlBLVphLXotX10vZztcbiAgZnVuY3Rpb24gYmFzZTY0Y2xlYW4oc3RyKSB7XG4gICAgc3RyID0gc3RyLnNwbGl0KFwiPVwiKVswXTtcbiAgICBzdHIgPSBzdHIudHJpbSgpLnJlcGxhY2UoSU5WQUxJRF9CQVNFNjRfUkUsIFwiXCIpO1xuICAgIGlmIChzdHIubGVuZ3RoIDwgMikgcmV0dXJuIFwiXCI7XG4gICAgd2hpbGUgKHN0ci5sZW5ndGggJSA0ICE9PSAwKSB7XG4gICAgICBzdHIgPSBzdHIgKyBcIj1cIjtcbiAgICB9XG4gICAgcmV0dXJuIHN0cjtcbiAgfVxuICBmdW5jdGlvbiB1dGY4VG9CeXRlcyhzdHJpbmcsIHVuaXRzKSB7XG4gICAgdW5pdHMgPSB1bml0cyB8fCBJbmZpbml0eTtcbiAgICBsZXQgY29kZVBvaW50O1xuICAgIGNvbnN0IGxlbmd0aCA9IHN0cmluZy5sZW5ndGg7XG4gICAgbGV0IGxlYWRTdXJyb2dhdGUgPSBudWxsO1xuICAgIGNvbnN0IGJ5dGVzID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7ICsraSkge1xuICAgICAgY29kZVBvaW50ID0gc3RyaW5nLmNoYXJDb2RlQXQoaSk7XG4gICAgICBpZiAoY29kZVBvaW50ID4gNTUyOTUgJiYgY29kZVBvaW50IDwgNTczNDQpIHtcbiAgICAgICAgaWYgKCFsZWFkU3Vycm9nYXRlKSB7XG4gICAgICAgICAgaWYgKGNvZGVQb2ludCA+IDU2MzE5KSB7XG4gICAgICAgICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMjM5LCAxOTEsIDE4OSk7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGkgKyAxID09PSBsZW5ndGgpIHtcbiAgICAgICAgICAgIGlmICgodW5pdHMgLT0gMykgPiAtMSkgYnl0ZXMucHVzaCgyMzksIDE5MSwgMTg5KTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBsZWFkU3Vycm9nYXRlID0gY29kZVBvaW50O1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb2RlUG9pbnQgPCA1NjMyMCkge1xuICAgICAgICAgIGlmICgodW5pdHMgLT0gMykgPiAtMSkgYnl0ZXMucHVzaCgyMzksIDE5MSwgMTg5KTtcbiAgICAgICAgICBsZWFkU3Vycm9nYXRlID0gY29kZVBvaW50O1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGNvZGVQb2ludCA9IChsZWFkU3Vycm9nYXRlIC0gNTUyOTYgPDwgMTAgfCBjb2RlUG9pbnQgLSA1NjMyMCkgKyA2NTUzNjtcbiAgICAgIH0gZWxzZSBpZiAobGVhZFN1cnJvZ2F0ZSkge1xuICAgICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMjM5LCAxOTEsIDE4OSk7XG4gICAgICB9XG4gICAgICBsZWFkU3Vycm9nYXRlID0gbnVsbDtcbiAgICAgIGlmIChjb2RlUG9pbnQgPCAxMjgpIHtcbiAgICAgICAgaWYgKCh1bml0cyAtPSAxKSA8IDApIGJyZWFrO1xuICAgICAgICBieXRlcy5wdXNoKGNvZGVQb2ludCk7XG4gICAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA8IDIwNDgpIHtcbiAgICAgICAgaWYgKCh1bml0cyAtPSAyKSA8IDApIGJyZWFrO1xuICAgICAgICBieXRlcy5wdXNoKGNvZGVQb2ludCA+PiA2IHwgMTkyLCBjb2RlUG9pbnQgJiA2MyB8IDEyOCk7XG4gICAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA8IDY1NTM2KSB7XG4gICAgICAgIGlmICgodW5pdHMgLT0gMykgPCAwKSBicmVhaztcbiAgICAgICAgYnl0ZXMucHVzaChjb2RlUG9pbnQgPj4gMTIgfCAyMjQsIGNvZGVQb2ludCA+PiA2ICYgNjMgfCAxMjgsIGNvZGVQb2ludCAmIDYzIHwgMTI4KTtcbiAgICAgIH0gZWxzZSBpZiAoY29kZVBvaW50IDwgMTExNDExMikge1xuICAgICAgICBpZiAoKHVuaXRzIC09IDQpIDwgMCkgYnJlYWs7XG4gICAgICAgIGJ5dGVzLnB1c2goY29kZVBvaW50ID4+IDE4IHwgMjQwLCBjb2RlUG9pbnQgPj4gMTIgJiA2MyB8IDEyOCwgY29kZVBvaW50ID4+IDYgJiA2MyB8IDEyOCwgY29kZVBvaW50ICYgNjMgfCAxMjgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBjb2RlIHBvaW50XCIpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYnl0ZXM7XG4gIH1cbiAgZnVuY3Rpb24gYXNjaWlUb0J5dGVzKHN0cikge1xuICAgIGNvbnN0IGJ5dGVBcnJheSA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgKytpKSB7XG4gICAgICBieXRlQXJyYXkucHVzaChzdHIuY2hhckNvZGVBdChpKSAmIDI1NSk7XG4gICAgfVxuICAgIHJldHVybiBieXRlQXJyYXk7XG4gIH1cbiAgZnVuY3Rpb24gdXRmMTZsZVRvQnl0ZXMoc3RyLCB1bml0cykge1xuICAgIGxldCBjLCBoaSwgbG87XG4gICAgY29uc3QgYnl0ZUFycmF5ID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyArK2kpIHtcbiAgICAgIGlmICgodW5pdHMgLT0gMikgPCAwKSBicmVhaztcbiAgICAgIGMgPSBzdHIuY2hhckNvZGVBdChpKTtcbiAgICAgIGhpID0gYyA+PiA4O1xuICAgICAgbG8gPSBjICUgMjU2O1xuICAgICAgYnl0ZUFycmF5LnB1c2gobG8pO1xuICAgICAgYnl0ZUFycmF5LnB1c2goaGkpO1xuICAgIH1cbiAgICByZXR1cm4gYnl0ZUFycmF5O1xuICB9XG4gIGZ1bmN0aW9uIGJhc2U2NFRvQnl0ZXMoc3RyKSB7XG4gICAgcmV0dXJuIGJhc2U2NC50b0J5dGVBcnJheShiYXNlNjRjbGVhbihzdHIpKTtcbiAgfVxuICBmdW5jdGlvbiBibGl0QnVmZmVyKHNyYywgZHN0LCBvZmZzZXQsIGxlbmd0aCkge1xuICAgIGxldCBpO1xuICAgIGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7ICsraSkge1xuICAgICAgaWYgKGkgKyBvZmZzZXQgPj0gZHN0Lmxlbmd0aCB8fCBpID49IHNyYy5sZW5ndGgpIGJyZWFrO1xuICAgICAgZHN0W2kgKyBvZmZzZXRdID0gc3JjW2ldO1xuICAgIH1cbiAgICByZXR1cm4gaTtcbiAgfVxuICBmdW5jdGlvbiBpc0luc3RhbmNlKG9iaiwgdHlwZSkge1xuICAgIHJldHVybiBvYmogaW5zdGFuY2VvZiB0eXBlIHx8IG9iaiAhPSBudWxsICYmIG9iai5jb25zdHJ1Y3RvciAhPSBudWxsICYmIG9iai5jb25zdHJ1Y3Rvci5uYW1lICE9IG51bGwgJiYgb2JqLmNvbnN0cnVjdG9yLm5hbWUgPT09IHR5cGUubmFtZTtcbiAgfVxuICBmdW5jdGlvbiBudW1iZXJJc05hTihvYmopIHtcbiAgICByZXR1cm4gb2JqICE9PSBvYmo7XG4gIH1cbiAgY29uc3QgaGV4U2xpY2VMb29rdXBUYWJsZSA9IChmdW5jdGlvbigpIHtcbiAgICBjb25zdCBhbHBoYWJldCA9IFwiMDEyMzQ1Njc4OWFiY2RlZlwiO1xuICAgIGNvbnN0IHRhYmxlID0gbmV3IEFycmF5KDI1Nik7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCAxNjsgKytpKSB7XG4gICAgICBjb25zdCBpMTYgPSBpICogMTY7XG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IDE2OyArK2opIHtcbiAgICAgICAgdGFibGVbaTE2ICsgal0gPSBhbHBoYWJldFtpXSArIGFscGhhYmV0W2pdO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGFibGU7XG4gIH0pKCk7XG4gIGZ1bmN0aW9uIGRlZmluZUJpZ0ludE1ldGhvZChmbikge1xuICAgIHJldHVybiB0eXBlb2YgQmlnSW50ID09PSBcInVuZGVmaW5lZFwiID8gQnVmZmVyQmlnSW50Tm90RGVmaW5lZCA6IGZuO1xuICB9XG4gIGZ1bmN0aW9uIEJ1ZmZlckJpZ0ludE5vdERlZmluZWQoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiQmlnSW50IG5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgcmV0dXJuIGV4cG9ydHM7XG59XG5cbi8vIG5vZGVfbW9kdWxlcy8uZGVuby9AanNwbStjb3JlQDIuMS4wL25vZGVfbW9kdWxlcy9AanNwbS9jb3JlL25vZGVsaWJzL2Jyb3dzZXIvYnVmZmVyLmpzXG52YXIgZXhwb3J0czIgPSBkZXcoKTtcbmV4cG9ydHMyW1wiQnVmZmVyXCJdO1xuZXhwb3J0czJbXCJTbG93QnVmZmVyXCJdO1xuZXhwb3J0czJbXCJJTlNQRUNUX01BWF9CWVRFU1wiXTtcbmV4cG9ydHMyW1wia01heExlbmd0aFwiXTtcbnZhciBCdWZmZXIgPSBleHBvcnRzMi5CdWZmZXI7XG52YXIgSU5TUEVDVF9NQVhfQllURVMgPSBleHBvcnRzMi5JTlNQRUNUX01BWF9CWVRFUztcbnZhciBrTWF4TGVuZ3RoID0gZXhwb3J0czIua01heExlbmd0aDtcbmV4cG9ydCB7XG4gIEJ1ZmZlcixcbiAgSU5TUEVDVF9NQVhfQllURVMsXG4gIGV4cG9ydHMyIGFzIGRlZmF1bHQsXG4gIGtNYXhMZW5ndGhcbn07XG4vKiEgQnVuZGxlZCBsaWNlbnNlIGluZm9ybWF0aW9uOlxuXG5AanNwbS9jb3JlL25vZGVsaWJzL2Jyb3dzZXIvY2h1bmstRHR1VGFzYXQuanM6XG4gICgqISBpZWVlNzU0LiBCU0QtMy1DbGF1c2UgTGljZW5zZS4gRmVyb3NzIEFib3VraGFkaWplaCA8aHR0cHM6Ly9mZXJvc3Mub3JnL29wZW5zb3VyY2U+ICopXG4qL1xuIiwgImV4cG9ydCB7IEJ1ZmZlciB9IGZyb20gJ25vZGU6YnVmZmVyJztcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBR0EsU0FBUyxRQUFRO0FBQ2YsTUFBSSxXQUFZLFFBQU87QUFDdkIsZUFBYTtBQUNiLFlBQVUsYUFBYTtBQUN2QixZQUFVLGNBQWM7QUFDeEIsWUFBVSxnQkFBZ0I7QUFDMUIsTUFBSSxTQUFTLENBQUM7QUFDZCxNQUFJLFlBQVksQ0FBQztBQUNqQixNQUFJLE1BQU0sT0FBTyxlQUFlLGNBQWMsYUFBYTtBQUMzRCxNQUFJLE9BQU87QUFDWCxXQUFTLElBQUksR0FBRyxNQUFNLEtBQUssUUFBUSxJQUFJLEtBQUssRUFBRSxHQUFHO0FBQy9DLFdBQU8sQ0FBQyxJQUFJLEtBQUssQ0FBQztBQUNsQixjQUFVLEtBQUssV0FBVyxDQUFDLENBQUMsSUFBSTtBQUFBLEVBQ2xDO0FBQ0EsWUFBVSxJQUFJLFdBQVcsQ0FBQyxDQUFDLElBQUk7QUFDL0IsWUFBVSxJQUFJLFdBQVcsQ0FBQyxDQUFDLElBQUk7QUFDL0IsV0FBUyxRQUFRLEtBQUs7QUFDcEIsUUFBSSxPQUFPLElBQUk7QUFDZixRQUFJLE9BQU8sSUFBSSxHQUFHO0FBQ2hCLFlBQU0sSUFBSSxNQUFNLGdEQUFnRDtBQUFBLElBQ2xFO0FBQ0EsUUFBSSxXQUFXLElBQUksUUFBUSxHQUFHO0FBQzlCLFFBQUksYUFBYSxHQUFJLFlBQVc7QUFDaEMsUUFBSSxrQkFBa0IsYUFBYSxPQUFPLElBQUksSUFBSSxXQUFXO0FBQzdELFdBQU8sQ0FBQyxVQUFVLGVBQWU7QUFBQSxFQUNuQztBQUNBLFdBQVMsV0FBVyxLQUFLO0FBQ3ZCLFFBQUksT0FBTyxRQUFRLEdBQUc7QUFDdEIsUUFBSSxXQUFXLEtBQUssQ0FBQztBQUNy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LFNBQVM7QUFBQSxJQUN0QixLQUFLLEVBQUUsTUFBTSxJQUFJLEtBQUssS0FBSyxLQUFLLEVBQUUsTUFBTSxJQUFJLEtBQUssSUFBSSxLQUFLLEVBQUUsTUFBTTtBQUNsRSxZQUFRLE9BQU8sR0FBRyxLQUFLLE9BQU8sRUFBRSxLQUFLLE9BQU8sS0FBSyxFQUFFLE1BQU0sSUFBSSxLQUFLLEtBQUssS0FBSyxFQUFFLE1BQU0sSUFBSSxLQUFLLEtBQUssS0FBSyxFQUFFLE1BQU0sSUFBSSxLQUFLLElBQUksSUFBSTtBQUFBLEVBQ2xJLENBQUM7QUFDRCxFQUFBQSxTQUFRLFVBQVUsY0FBYyxTQUFTLFlBQVksUUFBUSxVQUFVO0FBQ3JFLGFBQVMsV0FBVztBQUNwQixRQUFJLENBQUMsU0FBVSxhQUFZLFFBQVEsR0FBRyxLQUFLLE1BQU07QUFDakQsV0FBTyxRQUFRLEtBQUssTUFBTSxRQUFRLE1BQU0sSUFBSSxDQUFDO0FBQUEsRUFDL0M7QUFDQSxFQUFBQSxTQUFRLFVBQVUsY0FBYyxTQUFTLFlBQVksUUFBUSxVQUFVO0FBQ3JFLGFBQVMsV0FBVztBQUNwQixRQUFJLENBQUMsU0FBVSxhQUFZLFFBQVEsR0FBRyxLQUFLLE1BQU07QUFDakQsV0FBTyxRQUFRLEtBQUssTUFBTSxRQUFRLE9BQU8sSUFBSSxDQUFDO0FBQUEsRUFDaEQ7QUFDQSxFQUFBQSxTQUFRLFVBQVUsZUFBZSxTQUFTLGFBQWEsUUFBUSxVQUFVO0FBQ3ZFLGFBQVMsV0FBVztBQUNwQixRQUFJLENBQUMsU0FBVSxhQUFZLFFBQVEsR0FBRyxLQUFLLE1BQU07QUFDakQsV0FBTyxRQUFRLEtBQUssTUFBTSxRQUFRLE1BQU0sSUFBSSxDQUFDO0FBQUEsRUFDL0M7QUFDQSxFQUFBQSxTQUFRLFVBQVUsZUFBZSxTQUFTLGFBQWEsUUFBUSxVQUFVO0FBQ3ZFLGFBQVMsV0FBVztBQUNwQixRQUFJLENBQUMsU0FBVSxhQUFZLFFBQVEsR0FBRyxLQUFLLE1BQU07QUFDakQsV0FBTyxRQUFRLEtBQUssTUFBTSxRQUFRLE9BQU8sSUFBSSxDQUFDO0FB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QVksWUFBWSxHQUFHLENBQUM7QUFBQSxFQUM1QztBQUNBLFdBQVMsV0FBVyxLQUFLLEtBQUssUUFBUSxRQUFRO0FBQzVDLFFBQUk7QUFDSixTQUFLLElBQUksR0FBRyxJQUFJLFFBQVEsRUFBRSxHQUFHO0FBQzNCLFVBQUksSUFBSSxVQUFVLElBQUksVUFBVSxLQUFLLElBQUksT0FBUTtBQUNqRCxVQUFJLElBQUksTUFBTSxJQUFJLElBQUksQ0FBQztBQUFBLElBQ3pCO0FBQ0EsV0FBTztBQUFBLEVBQ1Q7QUFDQSxXQUFTLFdBQVcsS0FBSyxNQUFNO0FBQzdCLFdBQU8sZUFBZSxRQUFRLE9BQU8sUUFBUSxJQUFJLGVBQWUsUUFBUSxJQUFJLFlBQVksUUFBUSxRQUFRLElBQUksWUFBWSxTQUFTLEtBQUs7QUFBQSxFQUN4STtBQUNBLFdBQVMsWUFBWSxLQUFLO0FBQ3hCLFdBQU8sUUFBUTtBQUFBLEVBQ2pCO0FBQ0EsUUFBTSxzQkFBdUIsV0FBVztBQUN0QyxVQUFNLFdBQVc7QUFDakIsVUFBTSxRQUFRLElBQUksTUFBTSxHQUFHO0FBQzNCLGFBQVMsSUFBSSxHQUFHLElBQUksSUFBSSxFQUFFLEdBQUc7QUFDM0IsWUFBTSxNQUFNLElBQUk7QUFDaEIsZUFBUyxJQUFJLEdBQUcsSUFBSSxJQUFJLEVBQUUsR0FBRztBQUMzQixjQUFNLE1BQU0sQ0FBQyxJQUFJLFNBQVMsQ0FBQyxJQUFJLFNBQVMsQ0FBQztBQUFBLE1BQzNDO0FBQUEsSUFDRjtBQUNBLFdBQU87QUFBQSxFQUNULEVBQUc7QUFDSCxXQUFTLG1CQUFtQixJQUFJO0FBQzlCLFdBQU8sT0FBTyxXQUFXLGNBQWMseUJBQXlCO0FBQUEsRUFDbEU7QUFDQSxXQUFTLHlCQUF5QjtBQUNoQyxVQUFNLElBQUksTUFBTSxzQkFBc0I7QUFBQSxFQUN4QztBQUNBLFNBQU87QUFDVDtBQWxyREEsSUFDSSxXQUNBLFlBOEZBLFdBQ0EsWUFtRkEsU0FDQSxVQWdnREEsVUFLQUMsU0FDQSxtQkFDQTtBQTVyREo7QUFBQTtBQUFBO0FBQ0EsSUFBSSxZQUFZLENBQUM7QUFDakIsSUFBSSxhQUFhO0FBOEZqQixJQUFJLFlBQVksQ0FBQztBQUNqQixJQUFJLGFBQWE7QUFtRmpCLElBQUksVUFBVSxDQUFDO0FBQ2YsSUFBSSxXQUFXO0FBZ2dEZixJQUFJLFdBQVcsSUFBSTtBQUNuQixhQUFTLFFBQVE7QUFDakIsYUFBUyxZQUFZO0FBQ3JCLGFBQVMsbUJBQW1CO0FBQzVCLGFBQVMsWUFBWTtBQUNyQixJQUFJQSxVQUFTLFNBQVM7QUFDdEIsSUFBSSxvQkFBb0IsU0FBUztBQUNqQyxJQUFJLGFBQWEsU0FBUztBQUFBO0FBQUE7OztBQzVyRDFCO0FBQUE7QUFBQTtBQUFBO0FBQUE7IiwKICAibmFtZXMiOiBbIkJ1ZmZlcjIiLCAiQnVmZmVyIl0KfQo=
