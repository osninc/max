"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createParallelRequestsEnqueue = exports.ParallelRequestsEnqueue = exports.rateLimitedRQ = void 0;
const crawlee_1 = require("crawlee");
const ow_1 = __importDefault(require("ow"));
const general_1 = require("./general");
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
const rateLimitedRQ = (rq) => {
    let concurrentWrites = 0;
    /**
     * Gets the current interval sleep value in ms
     */
    const currentSleepValue = () => (concurrentWrites || 1) * (Math.round(Math.log10(concurrentWrites || 1)) || 1);
    const addRequest = async (request, options) => {
        // racing conditions may happen
        if (concurrentWrites < 0) {
            concurrentWrites = 0;
        }
        concurrentWrites++;
        await (0, crawlee_1.sleep)(currentSleepValue());
        const added = await rq.addRequest(request, options);
        concurrentWrites--;
        await (0, crawlee_1.sleep)(currentSleepValue());
        if (concurrentWrites < 0) {
            concurrentWrites = 0;
        }
        return added;
    };
    return {
        currentSleepValue,
        addRequest
    };
};
exports.rateLimitedRQ = rateLimitedRQ;
class ParallelRequestsEnqueue {
    constructor(options) {
        Object.defineProperty(this, "addRequest", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "globalContext", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "loggedInfo", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "isLoggingEnqueuedRequests", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "stateKey", {
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
        const { requestQueue, addRequest, globalContext, loggedInfo = {}, stateId = `${Math.random()}` } = options;
        this.addRequest = addRequest || (0, exports.rateLimitedRQ)(requestQueue).addRequest;
        this.globalContext = globalContext ?? { state: {} };
        this.loggedInfo = loggedInfo;
        this.isLoggingEnqueuedRequests = false;
        this.stateKey = `PRE-${stateId}`;
        // @ts-ignore
        this.globalContext.state[this.stateKey] = this.globalContext.state[this.stateKey] || {
            enqueuedProductUrls: []
        };
        this.log = (0, general_1.labeledLog)({ label: 'ParallelRequestsEnqueue' });
    }
    getState() {
        // @ts-ignore
        return this.globalContext.state[this.stateKey];
    }
    /**
     *
     * @param requests
     * @returns {Promise<void>}
     */
    async enqueue(requests) {
        (0, ow_1.default)(requests, ow_1.default.array.minLength(1));
        const state = this.getState();
        const requestChunksPromises = [];
        const currentRequestChunk = [];
        const chunkSize = Math.ceil(requests.length / 20);
        for (let i = 1; i <= requests.length; i++) {
            const request = requests[i - 1];
            currentRequestChunk.push({
                index: i - 1,
                request
            });
            if (i % chunkSize === 0 || i === requests.length) {
                // eslint-disable-next-line no-async-promise-executor
                requestChunksPromises.push(
                // eslint-disable-next-line no-async-promise-executor
                new Promise(async (resolve, reject) => {
                    const requestChunk = Array.from(currentRequestChunk);
                    // eslint-disable-next-line no-restricted-syntax
                    for (const requestEl of requestChunk) {
                        if (state.enqueuedProductUrls.indexOf(requestEl.index) === -1) {
                            try {
                                await this.addRequest(requestEl.request);
                            }
                            catch (error) {
                                reject(error);
                                return;
                            }
                            state.enqueuedProductUrls.push(requestEl.index);
                        }
                        if (!this.isLoggingEnqueuedRequests &&
                            (state.enqueuedProductUrls.length % 100 === 0 || i + 1 === requests.length)) {
                            this.isLoggingEnqueuedRequests = true;
                            this.log.info('Enqueuing requests to the RQ statistics:', {
                                count: state.enqueuedProductUrls.length,
                                ...this.loggedInfo
                            });
                            this.isLoggingEnqueuedRequests = false;
                        }
                    }
                    resolve();
                }));
                currentRequestChunk.length = 0;
            }
        }
        await Promise.all(requestChunksPromises);
        state.enqueuedProductUrlCount = state.enqueuedProductUrls.length;
        state.enqueuedProductUrls.length = 0;
        this.log.info('Enqueuing requests to the RQ finished:', {
            count: state.enqueuedProductUrlCount,
            ...this.loggedInfo
        });
    }
}
exports.ParallelRequestsEnqueue = ParallelRequestsEnqueue;
/**
 * Create an instance of PerformanceMonitor and initialize it.
 */
const createParallelRequestsEnqueue = async (parallelRequestsEnqueueOptions, requests) => {
    const parallelRequestsEnqueueInstance = new ParallelRequestsEnqueue(parallelRequestsEnqueueOptions);
    return parallelRequestsEnqueueInstance.enqueue(requests);
};
exports.createParallelRequestsEnqueue = createParallelRequestsEnqueue;
//# sourceMappingURL=request-queue.js.map