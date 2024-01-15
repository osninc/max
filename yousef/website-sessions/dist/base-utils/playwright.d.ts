import { Page } from 'playwright-core';
export interface IBlockRequestsOptions {
    resources?: string[];
}
export declare const blockRequests: (page: Page, options?: IBlockRequestsOptions) => Promise<void>;
