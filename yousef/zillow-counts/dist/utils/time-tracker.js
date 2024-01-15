"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeTracker = exports.TimeTrackGeneralNames = void 0;
const base_utils_1 = require("../base-utils");
function convertHrtime(hrtime) {
    const nanoseconds = hrtime;
    const number = Number(nanoseconds);
    const milliseconds = number / 1000000;
    const seconds = number / 1000000000;
    return {
        seconds,
        milliseconds,
        nanoseconds
    };
}
function timeSpan() {
    const start = process.hrtime.bigint();
    // @ts-ignore
    const end = (type) => convertHrtime(process.hrtime.bigint() - start)[type];
    const returnValue = () => end('milliseconds');
    returnValue.rounded = () => Math.round(end('milliseconds'));
    returnValue.seconds = () => end('seconds');
    returnValue.nanoseconds = () => end('nanoseconds');
    return returnValue;
}
exports.TimeTrackGeneralNames = {
    RUN_DURATION: 'RUN_DURATION',
    PRE_CONFIGURATION: 'PRE_CONFIGURATION',
    CRAWLER_CONFIGURATION: 'CRAWLER_CONFIGURATION',
    LOCATION_HANDLING: 'LOCATION_HANDLING',
    SEARCH_HANDLING: 'SEARCH_HANDLING',
    SAVING_RESULTS: 'SAVING_RESULTS'
};
class TimeTracker {
    constructor() {
        Object.defineProperty(this, "log", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "timeSpans", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "timeTracking", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.timeSpans = {};
        this.timeTracking = {};
        this.log = (0, base_utils_1.labeledLog)({ label: 'LocationManager' });
    }
    start(key) {
        this.log.debug('Starting time tracking', { key });
        this.timeSpans[key] = timeSpan();
    }
    stop(key) {
        this.log.debug('Stopping time tracking', { key });
        const time = this.timeSpans[key]?.seconds();
        if (!time) {
            this.log.debug('Time tracking not found', { key });
            return 0;
        }
        this.timeTracking[key] = time;
        return time;
    }
}
exports.TimeTracker = TimeTracker;
//# sourceMappingURL=time-tracker.js.map