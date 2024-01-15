import { ProxyConfiguration, Session, SessionOptions, SessionPool } from 'crawlee';
import { Response } from 'playwright-core';
export declare const getProxyInfo: (proxyUrl: string) => Promise<any>;
type GotoOptions = {
    referer?: string;
    timeout?: number;
    waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' | 'commit';
};
type CustomNavigationFunction = (p: {
    page: any;
    websiteUrl: string;
    gotoOptions: GotoOptions;
}) => Promise<null | Response>;
type PostNavigationFunction = (p: {
    session: Session;
    response: any;
    page: any;
}) => Promise<void> | void;
type PostCreationFunction = (p: {
    session: Session;
    response: any;
}) => Promise<void> | void;
export interface ICreateSessionFunctionBuilderOptions {
    proxyConfiguration?: ProxyConfiguration | undefined;
    proxyUrlBuilder?: () => string | undefined;
    websiteUrl: string;
    cookiesTargetDomains?: string[];
    extraRequestOptions?: object;
    extraLaunchContextOptions?: object;
    extraLaunchOptions?: object;
    gotoOptions?: object;
    expectedResponseStatusCode?: number;
    useBrowser?: boolean;
    withProxyInfo?: boolean;
    customNavigationFunction?: CustomNavigationFunction;
    postCreationFunction?: PostCreationFunction;
    postNavigationFunction?: PostNavigationFunction;
}
export declare const createSessionFunctionBuilder: (createSessionFunctionBuilderOptions: ICreateSessionFunctionBuilderOptions) => (sessionPool: SessionPool, options?: {
    sessionOptions?: SessionOptions;
}) => Promise<Session>;
export {};
