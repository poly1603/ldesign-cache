/* Vitest/JSdom 测试环境通用 Polyfills 与全局配置 */
import { Blob as NodeBlob, Buffer as NodeBuffer } from 'node:buffer';
import { webcrypto as nodeWebcrypto } from 'node:crypto';
import { performance as nodePerformance } from 'node:perf_hooks';
import { TextDecoder as NodeTextDecoder, TextEncoder as NodeTextEncoder } from 'node:util';
// 1) atob / btoa（Node.js 无内置）
if (typeof globalThis.atob === 'undefined') {
    globalThis.atob = (b64) => NodeBuffer.from(b64, 'base64').toString('binary');
}
if (typeof globalThis.btoa === 'undefined') {
    globalThis.btoa = (str) => NodeBuffer.from(str, 'binary').toString('base64');
}
// 2) crypto（Node 18+ 支持 webcrypto）
if (typeof globalThis.crypto === 'undefined') {
    ;
    globalThis.crypto = nodeWebcrypto;
}
// 3) TextEncoder/TextDecoder（Node 18+ 已内置，兜底）
if (typeof globalThis.TextEncoder === 'undefined') {
    ;
    globalThis.TextEncoder = NodeTextEncoder;
}
if (typeof globalThis.TextDecoder === 'undefined') {
    ;
    globalThis.TextDecoder = NodeTextDecoder;
}
// 4) performance（Node 18+ 已内置，兜底）
if (typeof globalThis.performance === 'undefined') {
    ;
    globalThis.performance = nodePerformance;
}
// 5) Blob（Node 18+ 已内置，保守兜底）
if (typeof globalThis.Blob === 'undefined') {
    ;
    globalThis.Blob = NodeBlob;
}
// 6) URL.createObjectURL 可能在 jsdom 下不存在，用安全兜底
if (typeof URL.createObjectURL !== 'function') {
    ;
    URL.createObjectURL = () => '';
}
if (typeof URL.revokeObjectURL !== 'function') {
    ;
    URL.revokeObjectURL = () => { };
}
// 7) 统一定时器：部分代码读取 window.setInterval
if (typeof globalThis.window !== 'undefined') {
    const w = globalThis.window;
    w.setInterval || (w.setInterval = globalThis.setInterval.bind(globalThis));
    w.clearInterval || (w.clearInterval = globalThis.clearInterval.bind(globalThis));
}
//# sourceMappingURL=test-setup.js.map