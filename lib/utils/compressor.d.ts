export type CompressionAlgorithm = 'gzip' | 'deflate' | 'brotli' | 'none';
export interface CompressionOptions {
    enabled?: boolean;
    algorithm?: CompressionAlgorithm;
    minSize?: number;
    level?: number;
    customCompress?: (data: string) => Promise<string>;
    customDecompress?: (data: string) => Promise<string>;
}
export interface CompressionResult {
    data: string;
    originalSize: number;
    compressedSize: number;
    ratio: number;
    algorithm: CompressionAlgorithm;
}
export declare class Compressor {
    private readonly options;
    constructor(options?: CompressionOptions);
    compress(data: string): Promise<CompressionResult>;
    decompress(data: string, algorithm: CompressionAlgorithm): Promise<string>;
    private gzipCompress;
    private gzipDecompress;
    private deflateCompress;
    private deflateDecompress;
    private brotliCompress;
    private brotliDecompress;
    private lzCompress;
    private lzDecompress;
    private arrayBufferToBase64;
    private base64ToArrayBuffer;
    isCompressed(data: string): boolean;
    private calculateEntropy;
    getCompressionStats(data: string): {
        originalSize: number;
        potentialSavings: number;
        recommendedAlgorithm: CompressionAlgorithm;
    };
}
export declare function withCompression<T extends {
    set: any;
    get: any;
    has?: any;
    remove?: any;
}>(cache: T, options?: CompressionOptions): T;
//# sourceMappingURL=compressor.d.ts.map