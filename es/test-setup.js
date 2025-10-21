/*!
 * ***********************************
 * @ldesign/cache v0.1.1           *
 * Built with rollup               *
 * Build time: 2024-10-21 14:32:03 *
 * Build mode: production          *
 * Minified: No                    *
 * ***********************************
 */
import { Buffer, Blob } from 'node:buffer';
import { webcrypto } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { TextEncoder, TextDecoder } from 'node:util';

if (typeof globalThis.atob === "undefined") {
  globalThis.atob = (b64) => Buffer.from(b64, "base64").toString("binary");
}
if (typeof globalThis.btoa === "undefined") {
  globalThis.btoa = (str) => Buffer.from(str, "binary").toString("base64");
}
if (typeof globalThis.crypto === "undefined") {
  globalThis.crypto = webcrypto;
}
if (typeof globalThis.TextEncoder === "undefined") {
  globalThis.TextEncoder = TextEncoder;
}
if (typeof globalThis.TextDecoder === "undefined") {
  globalThis.TextDecoder = TextDecoder;
}
if (typeof globalThis.performance === "undefined") {
  globalThis.performance = performance;
}
if (typeof globalThis.Blob === "undefined") {
  globalThis.Blob = Blob;
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
//# sourceMappingURL=test-setup.js.map
