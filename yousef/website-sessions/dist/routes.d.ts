import { Dictionary, PlaywrightCrawlingContext } from 'crawlee';
import { GlobalContext } from './base-utils';
import { IFinalInput, IGlobalContextState } from './custom-utils';
export declare const isRequestBlocked: (statusCode: number, body: any, extraBlockFunc?: Function) => any;
export declare const handleSession: (crawlingContext: PlaywrightCrawlingContext<Dictionary<any>>, globalContext: GlobalContext<IFinalInput, IGlobalContextState>, extraData: any) => Promise<void>;
