"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPerformanceMonitor = exports.PerformanceMonitor = void 0;
const apify_1 = require("apify");
const crawlee_1 = require("crawlee");
const general_1 = require("./general");
const RESTART_RUN_ACTOR_ID = 'u586FSwK4ave5Z2lA';
class PerformanceMonitor {
    constructor(options) {
        Object.defineProperty(this, "crawler", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "activate", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "intervalTimeout", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "checkPerformanceInterval", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "requestsFinished", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "logLevelRepetition", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "maxLogLevelRepetition", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "isChecking", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "log", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        const { crawler, activate = true, intervalTimeout = 3 * 60 * 1000, maxLogLevelRepetition = 3 } = options;
        this.crawler = crawler;
        this.activate = activate;
        this.intervalTimeout = intervalTimeout;
        this.requestsFinished = 0;
        this.logLevelRepetition = 0;
        this.maxLogLevelRepetition = maxLogLevelRepetition;
        this.checkPerformance = this.checkPerformance.bind(this);
        this.isChecking = false;
        this.log = (0, general_1.labeledLog)({ label: 'PerformanceMonitor' });
    }
    async init() {
        if (this.activate) {
            this.checkPerformanceInterval = setInterval(this.checkPerformance, this.intervalTimeout);
        }
    }
    async checkPerformance() {
        if (this.isChecking) {
            this.log.info('Already started performance check.');
            return;
        }
        this.isChecking = true;
        this.log.info('Check performance started.');
        const level = this.crawler.stats.state.requestsFinished === this.requestsFinished ? crawlee_1.log.LEVELS.PERF : crawlee_1.log.LEVELS.INFO;
        this.log.info(
        // eslint-disable-next-line max-len
        `Statistics: newRequestsFinished => ${this.crawler.stats.state.requestsFinished}, requestsFinished => ${this.requestsFinished}`);
        if (level !== crawlee_1.log.getLevel()) {
            this.log.info(`Changing log level to ${crawlee_1.log.LEVELS[level]}`);
            // @ts-ignore
            this.crawler.log.setLevel(level);
            crawlee_1.log.setLevel(level);
            this.logLevelRepetition = 0;
        }
        else {
            this.logLevelRepetition++;
        }
        if (this.logLevelRepetition > this.maxLogLevelRepetition && level === crawlee_1.log.LEVELS.PERF) {
            if (apify_1.Actor.isAtHome()) {
                this.log.info('Actor stuck. Calling "restart-run" actor to resurrect the run (allow 60s).');
                const { actorRunId, memoryMbytes } = apify_1.Actor.getEnv();
                await apify_1.Actor.call(RESTART_RUN_ACTOR_ID, {
                    runId: actorRunId,
                    memory: memoryMbytes
                }, { memory: 128 });
                this.log.info('Waiting for 60 seconds...');
                await (0, crawlee_1.sleep)(60000);
            }
            else {
                this.log.info('Actor stuck. Notify other components about that (allow 60s). Please, resurrect the run.');
                apify_1.Actor.getDefaultInstance().eventManager.emit('aborting');
                this.log.info('Waiting for 60 seconds...');
                await (0, crawlee_1.sleep)(60000);
                this.log.info('Process will exit and the run will resurrect after that.');
            }
            process.exit(-1);
        }
        this.log.info(`Log level: ${crawlee_1.log.LEVELS[crawlee_1.log.getLevel()]}`);
        this.requestsFinished = this.crawler.stats.state.requestsFinished;
        this.log.info('Check performance finished.');
        this.isChecking = false;
    }
    stop() {
        if (this.checkPerformanceInterval) {
            clearInterval(this.checkPerformanceInterval);
        }
    }
}
exports.PerformanceMonitor = PerformanceMonitor;
/**
 * Create an instance of PerformanceMonitor and initialize it.
 */
const createPerformanceMonitor = async (options) => {
    const performanceMonitor = new PerformanceMonitor(options);
    await performanceMonitor.init();
    return performanceMonitor;
};
exports.createPerformanceMonitor = createPerformanceMonitor;
//# sourceMappingURL=performance.js.map