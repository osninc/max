import { Log } from 'crawlee';
import { IFinalInput } from './types';
export declare const prepareSearchRequests: (input: IFinalInput, log: Log, logInfo: any, location: {
    query?: any;
    region?: any;
}, userData?: any) => Promise<({
    uniqueKey: string;
    userData: any;
    id?: string | undefined;
    url: string;
    loadedUrl?: string | undefined;
    method: import("@crawlee/core/typedefs").AllowedHttpMethods;
    payload?: string | undefined;
    noRetry: boolean;
    retryCount: number;
    errorMessages: string[];
    headers?: Record<string, string> | undefined;
    handledAt?: string | undefined;
} | {
    uniqueKey: string;
    userData: any;
    url: string;
    method?: "get" | "post" | "put" | "patch" | "head" | "delete" | "options" | "trace" | import("@crawlee/core/typedefs").AllowedHttpMethods | "connect" | undefined;
    payload?: string | undefined;
    headers?: Record<string, string> | undefined;
    label?: string | undefined;
    keepUrlFragment?: boolean | undefined;
    useExtendedUniqueKey?: boolean | undefined;
    noRetry?: boolean | undefined;
    skipNavigation?: boolean | undefined;
    id?: string | undefined;
    handledAt?: string | undefined;
})[]>;
