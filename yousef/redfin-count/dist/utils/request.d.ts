import { BasicCrawlingContext, Dictionary } from 'crawlee';
import { GlobalContext } from '../base-utils';
import { IBaseFinalInput, IBaseGlobalContextShared, IBaseGlobalContextState, IRequestResponse } from './types';
export declare const executeRequest: (crawlingContext: BasicCrawlingContext<Dictionary<any>>, globalContext: GlobalContext<IBaseFinalInput, IBaseGlobalContextState, IBaseGlobalContextShared>, isRequestBlocked: Function, transformHeaders?: Function) => Promise<IRequestResponse>;
