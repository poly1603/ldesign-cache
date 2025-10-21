import type { EncryptionConfig } from '../types';
export declare class AESCrypto {
    private config;
    private cryptoKey;
    constructor(config: EncryptionConfig);
    isAvailable(): boolean;
    private initializeKey;
    encrypt(data: string): Promise<string>;
    decrypt(data: string): Promise<string>;
    private encryptAES;
    private decryptAES;
    private encodeBase64;
    private decodeBase64;
    private arrayBufferToBase64;
    private base64ToArrayBuffer;
    updateConfig(config: Partial<EncryptionConfig>): void;
    getConfig(): EncryptionConfig;
}
//# sourceMappingURL=aes-crypto.d.ts.map