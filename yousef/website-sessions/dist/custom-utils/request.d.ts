import { BasicCrawlingContext, Dictionary } from 'crawlee';
import { GlobalContext } from '../base-utils';
import { IExecuteRequestResponse, IFinalInput, IGlobalContextShared, IGlobalContextState } from './types';
export declare const Medium: {
    CRAWLEE_SEND_REQUEST: string;
    AXIOS: string;
    BROWSER: string;
};
export declare const executeRequest: (crawlingContext: BasicCrawlingContext<Dictionary<any>>, globalContext: GlobalContext<IFinalInput, IGlobalContextState, IGlobalContextShared>) => Promise<IExecuteRequestResponse>;
