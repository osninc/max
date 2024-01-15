import { BasicCrawlingContext, Dictionary } from 'crawlee';
import { GlobalContext } from './base-utils';
import { IFinalInput, IGlobalContextShared, IGlobalContextState } from './custom-utils';
export declare const handleLocation: (crawlingContext: BasicCrawlingContext<Dictionary<any>>, globalContext: GlobalContext<IFinalInput, IGlobalContextState, IGlobalContextShared>) => Promise<void>;
export declare const handleSearch: (crawlingContext: BasicCrawlingContext<Dictionary<any>>, globalContext: GlobalContext<IFinalInput, IGlobalContextState, any>) => Promise<void>;
