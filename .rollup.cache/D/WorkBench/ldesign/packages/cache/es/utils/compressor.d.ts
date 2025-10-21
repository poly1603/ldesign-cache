/**
 * 压缩算法类型
 */
export type CompressionAlgorithm = 'gzip' | 'deflate' | 'brotli' | 'none';
/**
 * 压缩配置
 */
export interface CompressionOptions {
    /** 是否启用压缩 */
    enabled?: boolean;
    /** 压缩算法 */
    algorithm?: CompressionAlgorithm;
    /** 最小压缩大小（字节），小于此大小不压缩 */
    minSize?: number;
    /** 压缩级别（1-9） */
    level?: number;
    /** 自定义压缩函数 */
    customCompress?: (data: string) => Promise<string>;
    /** 自定义解压函数 */
    customDecompress?: (data: string) => Promise<string>;
}
/**
 * 压缩结果
 */
export interface CompressionResult {
    /** 压缩后的数据 */
    data: string;
    /** 原始大小 */
    originalSize: number;
    /** 压缩后大小 */
    compressedSize: number;
    /** 压缩率 */
    ratio: number;
    /** 使用的算法 */
    algorithm: CompressionAlgorithm;
}
/**
 * 数据压缩器
 *
 * 提供数据压缩和解压功能，减少存储占用
 */
export declare class Compressor {
    private readonly options;
    constructor(options?: CompressionOptions);
    /**
     * 压缩数据
     */
    compress(data: string): Promise<CompressionResult>;
    /**
     * 解压数据
     */
    decompress(data: string, algorithm: CompressionAlgorithm): Promise<string>;
    /**
     * GZIP 压缩（使用 CompressionStream）
     */
    private gzipCompress;
    /**
     * GZIP 解压
     */
    private gzipDecompress;
    /**
     * Deflate 压缩
     */
    private deflateCompress;
    /**
     * Deflate 解压
     */
    private deflateDecompress;
    /**
     * Brotli 压缩（需要浏览器支持）
     */
    private brotliCompress;
    /**
     * Brotli 解压
     */
    private brotliDecompress;
    /**
     * 简单的 LZ 压缩算法（作为后备方案）
     */
    private lzCompress;
    /**
     * 简单的 LZ 解压算法
     */
    private lzDecompress;
    /**
     * ArrayBuffer 转 Base64（优化版本）
     */
    private arrayBufferToBase64;
    /**
     * Base64 转 ArrayBuffer（优化版本）
     */
    private base64ToArrayBuffer;
    /**
     * 检测数据是否已压缩
     */
    isCompressed(data: string): boolean;
    /**
     * 计算数据熵值
     */
    private calculateEntropy;
    /**
     * 获取压缩统计
     */
    getCompressionStats(data: string): {
        originalSize: number;
        potentialSavings: number;
        recommendedAlgorithm: CompressionAlgorithm;
    };
}
/**
 * 创建带压缩的缓存装饰器
 */
export declare function withCompression<T extends {
    set: any;
    get: any;
    has?: any;
    remove?: any;
}>(cache: T, options?: CompressionOptions): T;
