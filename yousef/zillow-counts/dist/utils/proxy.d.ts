import { GlobalContext } from '../base-utils';
import { IBaseFinalInput, IBaseGlobalContextShared } from './types';
export declare const PROXY_TYPE: {
    APIFY_RESIDENTIAL: string;
    SMARTPROXY_RESIDENTIAL: string;
    APIFY_DATACENTER: string;
    SMARTPROXY_DATACENTER: string;
    NONE: string;
};
export declare const getSmartproxyProxyUrl: (input: IBaseFinalInput) => string;
export declare const getSmartproxyProxyUrls: (input: IBaseFinalInput, maxProxyCount?: number) => string[];
export declare const pickProxyUrl: (proxies: string[], blackedProxies: string[]) => string;
export declare const parseProxyUrl: (proxyUrl: string) => {
    protocol: string;
    host: string;
    port: string;
    auth: {
        username: string;
        password: string;
    };
};
export declare const getProxyUrl: (globalContext: GlobalContext<any, any, IBaseGlobalContextShared>) => Promise<string>;
export declare const getSmartproxyConsumption: (input: IBaseFinalInput) => Promise<number>;
