import type { SecurityConfig } from '../types';
export declare class SecurityManager {
    private encryption;
    private obfuscation;
    private config;
    constructor(config?: Partial<SecurityConfig>);
    encrypt(data: string): Promise<string>;
    decrypt(data: string): Promise<string>;
    obfuscateKey(key: string): Promise<string>;
    deobfuscateKey(key: string): Promise<string>;
    shouldEncrypt(data: any, options?: {
        encrypt?: boolean;
    }): boolean;
    shouldObfuscateKey(options?: {
        obfuscateKey?: boolean;
    }): boolean;
    generateSecureKey(length?: number): string;
    verifyIntegrity(originalData: string, storedData: string): Promise<boolean>;
    getConfig(): SecurityConfig;
    updateConfig(config: Partial<SecurityConfig>): void;
    isSecurityAvailable(): {
        encryption: boolean;
        obfuscation: boolean;
        webCrypto: boolean;
    };
}
//# sourceMappingURL=security-manager.d.ts.map