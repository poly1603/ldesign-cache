/*!
 * ***********************************
 * @ldesign/cache v0.1.1           *
 * Built with rollup               *
 * Build time: 2024-10-21 14:32:03 *
 * Build mode: production          *
 * Minified: No                    *
 * ***********************************
 */
'use strict';

var node_buffer = require('node:buffer');
var node_crypto = require('node:crypto');
var node_perf_hooks = require('node:perf_hooks');
var node_util = require('node:util');

if (typeof globalThis.atob === "undefined") {
  globalThis.atob = (b64) => node_buffer.Buffer.from(b64, "base64").toString("binary");
}
if (typeof globalThis.btoa === "undefined") {
  globalThis.btoa = (str) => node_buffer.Buffer.from(str, "binary").toString("base64");
}
if (typeof globalThis.crypto === "undefined") {
  globalThis.crypto = node_crypto.webcrypto;
}
if (typeof globalThis.TextEncoder === "undefined") {
  globalThis.TextEncoder = node_util.TextEncoder;
}
if (typeof globalThis.TextDecoder === "undefined") {
  globalThis.TextDecoder = node_util.TextDecoder;
}
if (typeof globalThis.performance === "undefined") {
  globalThis.performance = node_perf_hooks.performance;
}
if (typeof globalThis.Blob === "undefined") {
  globalThis.Blob = node_buffer.Blob;
}
if (typeof URL.createObjectURL !== "function") {
  URL.createObjectURL = () => "";
}
if (typeof URL.revokeObjectURL !== "function") {
  URL.revokeObjectURL = () => {
  };
}
if (typeof globalThis.window !== "undefined") {
  const w = globalThis.window;
  w.setInterval || (w.setInterval = globalThis.setInterval.bind(globalThis));
  w.clearInterval || (w.clearInterval = globalThis.clearInterval.bind(globalThis));
}
/*! End of @ldesign/cache | Powered by @ldesign/builder */
//# sourceMappingURL=test-setup.cjs.map
