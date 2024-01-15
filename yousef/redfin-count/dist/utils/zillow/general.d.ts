import { GlobalContext } from '../../base-utils';
export declare const createSessionFunctionBuilderCustom: (globalContext: GlobalContext<any, any, any>) => (sessionPool: import("crawlee").SessionPool, options?: {
    sessionOptions?: import("crawlee").SessionOptions | undefined;
} | undefined) => Promise<import("crawlee").Session>;
export declare const orderSearchResults: (searchResults: any[]) => any[];
