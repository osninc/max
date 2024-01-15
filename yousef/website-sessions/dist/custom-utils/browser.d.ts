import { BasicCrawlingContext, Dictionary } from 'crawlee';
import * as playwright from 'playwright-core';
import { GlobalContext } from '../base-utils';
import { IFinalInput, IGlobalContextShared } from './types';
export declare const getBrowser: (crawlingContext: BasicCrawlingContext<Dictionary<any>>, globalContext: GlobalContext<IFinalInput, {}, IGlobalContextShared>, proxyUrl: string) => Promise<playwright.Browser>;
export declare const removeUnusedBrowsers: (crawlingContext: BasicCrawlingContext<Dictionary<any>>, globalContext: GlobalContext<IFinalInput, {}, IGlobalContextShared>) => Promise<void>;
