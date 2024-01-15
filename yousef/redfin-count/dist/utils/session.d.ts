import { Log } from 'crawlee';
import { GlobalContext } from '../base-utils';
import { IBaseFinalInput, IBaseGlobalContextShared } from './types';
export declare const DEFAULT_SESSIONS_KVS_NAME = "land-stats-count-sessions";
export declare const getSessionsUsingInput: (input: IBaseFinalInput, defaultKvsName?: string) => Promise<any[]>;
type SessionResult = {
    proxyUrl?: string;
    cookie?: string;
    requestHeaders?: any;
    creationTime?: number;
};
export declare const getBaseSession: (globalContext: GlobalContext<any, any, IBaseGlobalContextShared>, log: Log) => Promise<SessionResult>;
export declare const getSession: (globalContext: GlobalContext<any, any, IBaseGlobalContextShared>, log: Log, websiteUrl: string, isRequestBlocked: Function, forceClean?: boolean) => Promise<SessionResult>;
export {};
