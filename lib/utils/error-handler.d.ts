export interface ErrorHandlerOptions {
    logError?: boolean;
    logPrefix?: string;
    rethrow?: boolean;
    defaultValue?: any;
    errorTransform?: (error: unknown) => Error;
}
export interface AsyncResult<T> {
    success: boolean;
    data?: T;
    error?: Error;
}
export declare class ErrorHandler {
    static safeAsync<T>(operation: () => Promise<T>, options?: ErrorHandlerOptions): Promise<AsyncResult<T>>;
    static safeSync<T>(operation: () => T, options?: ErrorHandlerOptions): T | undefined;
    static withRetry<T>(operation: () => Promise<T>, maxRetries?: number, delay?: number, options?: ErrorHandlerOptions): Promise<AsyncResult<T>>;
    static normalizeError(error: unknown, context?: string): Error;
    static isErrorType(error: unknown, ...patterns: (string | RegExp)[]): boolean;
    static createDecorator(options?: ErrorHandlerOptions): <T extends (...args: any[]) => any>(target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<T>) => TypedPropertyDescriptor<T>;
}
export declare function handleErrors(options?: ErrorHandlerOptions): <T extends (...args: any[]) => any>(target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<T>) => TypedPropertyDescriptor<T>;
export declare const safeAsync: typeof ErrorHandler.safeAsync;
export declare const safeSync: typeof ErrorHandler.safeSync;
export declare const normalizeError: typeof ErrorHandler.normalizeError;
export declare const isErrorType: typeof ErrorHandler.isErrorType;
//# sourceMappingURL=error-handler.d.ts.map