export declare const TimeTrackGeneralNames: {
    RUN_DURATION: string;
    PRE_CONFIGURATION: string;
    CRAWLER_CONFIGURATION: string;
    LOCATION_HANDLING: string;
    SEARCH_HANDLING: string;
    SAVING_RESULTS: string;
};
export declare class TimeTracker {
    private log;
    private timeSpans;
    private timeTracking;
    constructor();
    start(key: string): void;
    stop(key: string): number;
}
