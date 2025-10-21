import type { ObfuscationConfig } from '../types';
export declare class KeyObfuscator {
    private config;
    private keyMap;
    private reverseKeyMap;
    constructor(config: ObfuscationConfig);
    isAvailable(): boolean;
    obfuscate(key: string): Promise<string>;
    deobfuscate(obfuscatedKey: string): Promise<string>;
    private hashObfuscate;
    private base64Obfuscate;
    private simpleHash;
    clearCache(): void;
    getStats(): {
        totalMappings: number;
        cacheHitRate: number;
    };
    exportKeyMappings(): Record<string, string>;
    importKeyMappings(mappings: Record<string, string>): void;
    updateConfig(config: Partial<ObfuscationConfig>): void;
    getConfig(): ObfuscationConfig;
}
//# sourceMappingURL=key-obfuscator.d.ts.map