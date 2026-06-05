/**
 * Response encoders for adaptive low-bandwidth mode.
 *
 * Supports:
 * - json: standard JSON (normal mode)
 * - compact-json: whitespace-stripped JSON (reduced mode)
 * - minimal-binary: custom tiny binary for essential fields (minimal mode)
 */

/** @typedef {'json' | 'compact-json' | 'minimal-binary' | 'none'} Encoding */

/**
 * Encode a value to the requested format.
 *
 * @param {unknown} value
 * @param {Encoding} encoding
 * @returns {string | Buffer}
 */
export function encode(value, encoding) {
  switch (encoding) {
    case 'compact-json':
      return JSON.stringify(value);
    case 'minimal-binary':
      return encodeMinimalBinary(value);
    case 'none':
      return Buffer.alloc(0);
    case 'json':
    default:
      return JSON.stringify(value, null, 2);
  }
}

/**
 * Decode a value from the requested format.
 *
 * @param {string | Buffer} data
 * @param {Encoding} encoding
 * @returns {unknown}
 */
export function decode(data, encoding) {
  switch (encoding) {
    case 'compact-json':
    case 'json':
      return JSON.parse(String(data));
    case 'minimal-binary':
      return decodeMinimalBinary(Buffer.isBuffer(data) ? data : Buffer.from(data));
    case 'none':
      return null;
    default:
      return JSON.parse(String(data));
  }
}

/**
 * Encode a simple object to a minimal binary representation.
 *
 * Format (v1):
 *   [1 byte: version=0x01]
 *   [1 byte: field count]
 *   For each field:
 *     [1 byte: key length]
 *     [N bytes: key UTF-8]
 *     [1 byte: type tag]
 *     [N bytes: value]
 *
 * Type tags:
 *   0x00 = null
 *   0x01 = true
 *   0x02 = false
 *   0x03 = uint8
 *   0x04 = uint16 (big-endian)
 *   0x05 = uint32 (big-endian)
 *   0x06 = int32 (big-endian)
 *   0x07 = float64 (big-endian)
 *   0x08 = string (uint16 length prefix + UTF-8)
 *
 * Only flat objects with primitive values are supported.
 *
 * @param {unknown} value
 * @returns {Buffer}
 */
export function encodeMinimalBinary(value) {
  if (value === null || value === undefined) {
    return Buffer.from([0x01, 0x00]);
  }
  if (typeof value !== 'object' || Array.isArray(value)) {
    // Fallback to compact JSON for non-object types
    const json = JSON.stringify(value);
    const buf = Buffer.from(json, 'utf8');
    const header = Buffer.from([0x01, 0xff, (buf.length >> 8) & 0xff, buf.length & 0xff]);
    return Buffer.concat([header, buf]);
  }

  const entries = Object.entries(value);
  const chunks = [Buffer.from([0x01, entries.length & 0xff])];

  for (const [key, val] of entries) {
    const keyBuf = Buffer.from(key, 'utf8');
    if (keyBuf.length > 255) {
      throw new Error(`Key too long for minimal binary: ${key}`);
    }
    chunks.push(Buffer.from([keyBuf.length & 0xff]), keyBuf);
    chunks.push(encodeValue(val));
  }

  return Buffer.concat(chunks);
}

function encodeValue(val) {
  if (val === null || val === undefined) {
    return Buffer.from([0x00]);
  }
  if (val === true) {
    return Buffer.from([0x01]);
  }
  if (val === false) {
    return Buffer.from([0x02]);
  }
  if (typeof val === 'string') {
    const strBuf = Buffer.from(val, 'utf8');
    if (strBuf.length > 65535) {
      throw new Error('String too long for minimal binary');
    }
    return Buffer.concat([
      Buffer.from([0x08, (strBuf.length >> 8) & 0xff, strBuf.length & 0xff]),
      strBuf,
    ]);
  }
  if (typeof val === 'number') {
    if (!Number.isFinite(val)) {
      // Encode as string fallback
      const strBuf = Buffer.from(String(val), 'utf8');
      return Buffer.concat([
        Buffer.from([0x08, (strBuf.length >> 8) & 0xff, strBuf.length & 0xff]),
        strBuf,
      ]);
    }
    if (Number.isInteger(val) && val >= 0 && val <= 255) {
      return Buffer.from([0x03, val & 0xff]);
    }
    if (Number.isInteger(val) && val >= 0 && val <= 65535) {
      return Buffer.from([0x04, (val >> 8) & 0xff, val & 0xff]);
    }
    if (Number.isInteger(val) && val >= 0 && val <= 4294967295) {
      return Buffer.from([
        0x05,
        (val >>> 24) & 0xff,
        (val >>> 16) & 0xff,
        (val >>> 8) & 0xff,
        val & 0xff,
      ]);
    }
    if (Number.isInteger(val) && val >= -2147483648 && val <= 2147483647) {
      const u = val >>> 0;
      return Buffer.from([
        0x06,
        (u >>> 24) & 0xff,
        (u >>> 16) & 0xff,
        (u >>> 8) & 0xff,
        u & 0xff,
      ]);
    }
    const buf = Buffer.allocUnsafe(9);
    buf[0] = 0x07;
    buf.writeDoubleBE(val, 1);
    return buf;
  }
  // Unknown type: encode as string via JSON
  const strBuf = Buffer.from(JSON.stringify(val), 'utf8');
  return Buffer.concat([
    Buffer.from([0x08, (strBuf.length >> 8) & 0xff, strBuf.length & 0xff]),
    strBuf,
  ]);
}

/**
 * Decode a minimal binary buffer.
 *
 * @param {Buffer} buf
 * @returns {unknown}
 */
export function decodeMinimalBinary(buf) {
  if (buf.length < 2) {
    throw new Error('Invalid minimal binary: too short');
  }
  const version = buf[0];
  if (version !== 0x01) {
    throw new Error(`Unsupported minimal binary version: ${version}`);
  }

  const fieldCount = buf[1];
  if (fieldCount === 0x00) {
    return null;
  }
  if (fieldCount === 0xff) {
    // Fallback JSON payload
    const len = (buf[2] << 8) | buf[3];
    return JSON.parse(buf.subarray(4, 4 + len).toString('utf8'));
  }

  let offset = 2;
  const result = {};

  for (let i = 0; i < fieldCount; i++) {
    if (offset >= buf.length) {
      throw new Error('Invalid minimal binary: truncated key length');
    }
    const keyLen = buf[offset++];
    if (offset + keyLen > buf.length) {
      throw new Error('Invalid minimal binary: truncated key');
    }
    const key = buf.subarray(offset, offset + keyLen).toString('utf8');
    offset += keyLen;

    if (offset >= buf.length) {
      throw new Error('Invalid minimal binary: truncated type tag');
    }
    const tag = buf[offset++];
    const { value, bytesRead } = decodeValue(buf, offset, tag);
    result[key] = value;
    offset += bytesRead;
  }

  return result;
}

function decodeValue(buf, offset, tag) {
  switch (tag) {
    case 0x00:
      return { value: null, bytesRead: 0 };
    case 0x01:
      return { value: true, bytesRead: 0 };
    case 0x02:
      return { value: false, bytesRead: 0 };
    case 0x03:
      if (offset >= buf.length) throw new Error('Truncated uint8');
      return { value: buf[offset], bytesRead: 1 };
    case 0x04:
      if (offset + 1 >= buf.length) throw new Error('Truncated uint16');
      return { value: (buf[offset] << 8) | buf[offset + 1], bytesRead: 2 };
    case 0x05:
      if (offset + 3 >= buf.length) throw new Error('Truncated uint32');
      return {
        value:
          (buf[offset] << 24) |
          (buf[offset + 1] << 16) |
          (buf[offset + 2] << 8) |
          buf[offset + 3],
        bytesRead: 4,
      };
    case 0x06:
      if (offset + 3 >= buf.length) throw new Error('Truncated int32');
      return {
        value: buf.readInt32BE(offset),
        bytesRead: 4,
      };
    case 0x07:
      if (offset + 7 >= buf.length) throw new Error('Truncated float64');
      return { value: buf.readDoubleBE(offset), bytesRead: 8 };
    case 0x08: {
      if (offset + 1 >= buf.length) throw new Error('Truncated string length');
      const strLen = (buf[offset] << 8) | buf[offset + 1];
      if (offset + 2 + strLen > buf.length) throw new Error('Truncated string');
      return {
        value: buf.subarray(offset + 2, offset + 2 + strLen).toString('utf8'),
        bytesRead: 2 + strLen,
      };
    }
    default:
      throw new Error(`Unknown type tag in minimal binary: ${tag}`);
  }
}
