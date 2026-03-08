// Patches buffer-equal-constant-time to remove usage of SlowBuffer,
// which was removed in Node.js v22+.
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../node_modules/buffer-equal-constant-time/index.js');

if (!fs.existsSync(filePath)) {
  process.exit(0);
}

const original = fs.readFileSync(filePath, 'utf8');

if (!original.includes("require('buffer').SlowBuffer;")) {
  // Already patched or different version
  process.exit(0);
}

const patched = `/*jshint node:true */
'use strict';
var Buffer = require('buffer').Buffer; // browserify
var SlowBuffer = require('buffer').SlowBuffer || null;

module.exports = bufferEq;

function bufferEq(a, b) {

  // shortcutting on type is necessary for correctness
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    return false;
  }

  // buffer sizes should be well-known information, so despite this
  // shortcutting, it doesn't leak any information about the *contents* of the
  // buffers.
  if (a.length !== b.length) {
    return false;
  }

  var c = 0;
  for (var i = 0; i < a.length; i++) {
    /*jshint bitwise:false */
    c |= a[i] ^ b[i]; // XOR
  }
  return c === 0;
}

bufferEq.install = function() {
  Buffer.prototype.equal = function equal(that) {
    return bufferEq(this, that);
  };
  if (SlowBuffer) SlowBuffer.prototype.equal = Buffer.prototype.equal;
};

var origBufEqual = Buffer.prototype.equal;
var origSlowBufEqual = SlowBuffer ? SlowBuffer.prototype.equal : undefined;
bufferEq.restore = function() {
  Buffer.prototype.equal = origBufEqual;
  if (SlowBuffer) SlowBuffer.prototype.equal = origSlowBufEqual;
};
`;

fs.writeFileSync(filePath, patched, 'utf8');
console.log('Patched buffer-equal-constant-time for Node.js v22+ compatibility.');
