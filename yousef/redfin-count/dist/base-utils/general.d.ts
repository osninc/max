import { Page } from 'playwright-core';
export declare const getMinNumber: (defaultNumber: number, ...numbers: number[]) => number;
export declare const getValidKey: (str: string, hashKey?: boolean) => string;
export declare const parseHrtimeToSeconds: (hrtime: [number, number]) => number;
export declare const toPascalCase: (str: string) => string;
export declare const labelMessage: (options: {
    label: string;
    message: string;
    isToPascalCase?: boolean;
    styleFunction?: any;
}) => string;
export declare const labeledLog: (options: {
    label: string;
    isToPascalCase?: boolean;
    styleFunction?: any;
}) => import("apify").Log;
export declare const savePageScreenshot: (page: Page, key?: string, disableLog?: boolean) => Promise<void>;
export declare const savePageHtml: (page: Page, key?: string, disableLog?: boolean) => Promise<void>;
export declare const savePageMhtml: (page: Page, key?: string, disableLog?: boolean) => Promise<void>;
export declare const savePageSnapshot: (crawlingContext: any, keyPrefix?: string, extraData?: {}) => Promise<void>;
interface IFRHOptions {
    postHandlingFunction?: () => Promise<void>;
    withSnapshot?: boolean;
    failedRequestsTrackingTimeSecs?: number;
    maxFailedRequestsNumberPerTime?: number;
}
export declare const failedRequestHandler: (options?: IFRHOptions) => (crawlingContext: any) => Promise<void>;
export declare const formatAndCleanText: (str: string, options: {
    replaceMultipleNewLineChar?: boolean;
    replaceMultipleSpaceChar?: boolean;
    removeCarriageReturnChar?: boolean;
}) => string;
export declare const queryParametersToString: (options: {
    queryParameters: {
        [index: string]: any;
    };
    encodeKey?: boolean | undefined;
    encodeValue?: boolean | undefined;
}) => string;
export declare const createRandomJqueryJsonpCallbackFunctionName: () => string;
export declare const getJsonpResponseContent: (responseBody: string, callbackFunctionName: string) => string;
export declare const convertJsonpResponseToJson: (responseBody: string, callbackFunctionName: string) => any;
export declare const persistResponseDataIntoRequest: (options: {
    crawlingContext: any;
    response?: {
        statusCode?: number;
        headers?: any;
        body?: string;
    };
}) => void;
export declare const persistHeavyResponseDataIntoRequest: (options: {
    crawlingContext: any;
    response?: {
        statusCode?: number;
        headers?: any;
        body?: string;
    };
}) => Promise<void>;
export {};
