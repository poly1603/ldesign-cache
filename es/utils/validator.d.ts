import type { SetOptions, StorageEngine } from '../types';
export declare class ValidationError extends Error {
    field?: string;
    constructor(message: string, field?: string);
}
export interface ValidationRule<T = any> {
    validate: (value: T) => boolean;
    message: string;
}
export declare class Validator {
    static validateKey(key: unknown): asserts key is string;
    static validateValue(value: unknown): void;
    static validateTTL(ttl: unknown): asserts ttl is number;
    static validateEngine(engine: unknown): asserts engine is StorageEngine;
    static validateSetOptions(options: unknown): asserts options is SetOptions | undefined;
    static validateSetInput<T>(key: unknown, value: T, options?: unknown): void;
    static createValidator<T>(rules: ValidationRule<T>[]): (value: T, fieldName?: string) => void;
    static readonly rules: {
        nonEmptyString: {
            validate: (value: unknown) => value is string;
            message: string;
        };
        positiveInteger: {
            validate: (value: unknown) => value is number;
            message: string;
        };
        nonNegativeNumber: {
            validate: (value: unknown) => value is number;
            message: string;
        };
        boolean: {
            validate: (value: unknown) => value is boolean;
            message: string;
        };
        object: {
            validate: (value: unknown) => value is object;
            message: string;
        };
        array: {
            validate: (value: unknown) => value is unknown[];
            message: string;
        };
    };
    static validateBatch(validations: Array<{
        value: unknown;
        rules: ValidationRule[];
        fieldName?: string;
    }>): void;
}
export declare const validateKey: typeof Validator.validateKey;
export declare const validateValue: typeof Validator.validateValue;
export declare const validateTTL: typeof Validator.validateTTL;
export declare const validateEngine: typeof Validator.validateEngine;
export declare const validateSetOptions: typeof Validator.validateSetOptions;
export declare const validateSetInput: typeof Validator.validateSetInput;
//# sourceMappingURL=validator.d.ts.map