import { BasicCrawler } from 'crawlee';
export interface IPerformanceMonitorOptions {
    crawler: BasicCrawler;
    activate?: boolean;
    intervalTimeout?: number;
    maxLogLevelRepetition?: number;
}
export declare class PerformanceMonitor {
    private crawler;
    private activate;
    private intervalTimeout;
    private checkPerformanceInterval;
    private requestsFinished;
    private logLevelRepetition;
    private maxLogLevelRepetition;
    private isChecking;
    private log;
    constructor(options: IPerformanceMonitorOptions);
    init(): Promise<void>;
    checkPerformance(): Promise<void>;
    stop(): void;
}
/**
 * Create an instance of PerformanceMonitor and initialize it.
 */
export declare const createPerformanceMonitor: (options: IPerformanceMonitorOptions) => Promise<PerformanceMonitor>;
