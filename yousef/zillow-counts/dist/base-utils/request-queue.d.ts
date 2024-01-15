import { QueueOperationInfo, Request, RequestOptions, RequestQueue } from 'crawlee';
import { GlobalContext } from './global-context';
/**
 * The more concurrent writes to the RequestQueue,
 * the slower it gets but not exponentially slower, but pretty fast when doing one
 * at a time, that recalculates after each addRequest call
 *
 * Example on increasing concurrentWrites:
 *   1 = 1ms (2ms on addRequest call)
 *   3 = 3ms (6ms)
 *   10 = 10ms (20ms)
 *   20 = 20ms (40ms)
 *   30 = 30ms (60ms)
 *   100 = 200ms (400ms)
 *   1000 = 3000ms (6000ms)
 *
 * @param {RequestQueue} rq
 */
export declare const rateLimitedRQ: (rq: RequestQueue) => {
    currentSleepValue: () => number;
    addRequest: (request: Request | RequestOptions, options?: {
        forefront: boolean;
    }) => Promise<QueueOperationInfo>;
};
export interface IParallelRequestsEnqueueOptions {
    requestQueue: RequestQueue;
    addRequest?: Promise<void>;
    globalContext?: GlobalContext | {
        state: object;
    };
    loggedInfo?: object;
    stateId?: string;
}
export declare class ParallelRequestsEnqueue {
    private addRequest;
    private globalContext;
    private loggedInfo;
    private isLoggingEnqueuedRequests;
    private stateKey;
    private log;
    constructor(options: IParallelRequestsEnqueueOptions);
    getState(): any;
    /**
     *
     * @param requests
     * @returns {Promise<void>}
     */
    enqueue(requests: any[]): Promise<void>;
}
/**
 * Create an instance of PerformanceMonitor and initialize it.
 */
export declare const createParallelRequestsEnqueue: (parallelRequestsEnqueueOptions: IParallelRequestsEnqueueOptions, requests: any[]) => Promise<void>;
