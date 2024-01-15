"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crawlee_1 = require("crawlee");
const apify_1 = require("apify");
const lodash_1 = __importDefault(require("lodash"));
const custom_utils_1 = require("./custom-utils");
const base_utils_1 = require("./base-utils");
const routes = __importStar(require("./routes"));
const utils_1 = require("./utils");
async function main() {
    await apify_1.Actor.init();
    const mainLog = (0, base_utils_1.labeledLog)({ label: 'Main' });
    const input = (await crawlee_1.KeyValueStore.getInput()) || {};
    mainLog.info('Input:', input);
    (0, custom_utils_1.validateInput)(input);
    const { maxConcurrency = 3, ignoreStartRequests = false, ignoreAdditionalRequests = true, additionalRequests = [], monitorPerformance = true } = input;
    const finalInput = input;
    const requestQueue = await crawlee_1.RequestQueue.open();
    let requests = [];
    if (!ignoreAdditionalRequests) {
        requests.push(...additionalRequests);
    }
    if (!ignoreStartRequests) {
        requests = (0, custom_utils_1.prepareStartSessionRequests)(finalInput);
    }
    await requestQueue.addRequests(requests);
    const globalContext = await (0, base_utils_1.createGlobalContext)({
        input: finalInput,
        activateSaveState: true,
        initialState: {
            sessionCount: requests.length,
            smartproxyConsumption: { start: await (0, utils_1.getSmartproxyConsumption)(finalInput) }
        },
        initialSharedData: {
            defaultProxyUrls: (0, utils_1.getSmartproxyProxyUrls)(finalInput),
            inUseOrBlockedProxies: [],
            browsers: {}
        },
        saveStateIntervalTimeout: 30 * 60 * 1000
    });
    const crawler = new crawlee_1.BasicCrawler({
        requestQueue,
        maxConcurrency: apify_1.Actor.isAtHome() ? maxConcurrency : 2,
        useSessionPool: true,
        sessionPoolOptions: {
            maxPoolSize: maxConcurrency > 1 ? maxConcurrency * 2 : 1,
            sessionOptions: { maxUsageCount: 1 }
        },
        requestHandlerTimeoutSecs: 3 * 60,
        maxRequestRetries: 10,
        requestHandler: async (crawlingContext) => {
            const { url, userData, userData: { label = 'UNDEFINED' } } = crawlingContext.request;
            const rhLog = crawlingContext.log.child({
                prefix: `RH:${(0, base_utils_1.toPascalCase)(label)}`
            });
            crawlingContext.log = rhLog;
            rhLog.info('Page opened.', {
                url,
                ...lodash_1.default.pick(userData, custom_utils_1.PAGE_OPENED_LOG_MESSAGE_PROPS_TO_PICK)
            });
            const response = await (0, custom_utils_1.executeRequest)(crawlingContext, globalContext);
            // if ($(CSS_SELECTORS.SERVER_ERROR).length) {
            //     throw new Error('Page not loaded (server error). Retrying...')
            // }
            switch (label) {
                case custom_utils_1.LABELS.SESSION:
                    return routes.handleSession(crawlingContext, globalContext, { response });
                default:
                    throw new Error(`Unknown label: ${label}`);
            }
        },
        errorHandler: async (crawlingContext, error) => {
            void crawlingContext;
            void error;
        },
        failedRequestHandler: (0, base_utils_1.failedRequestHandler)({ withSnapshot: false })
    });
    let performanceMonitor;
    if (monitorPerformance) {
        performanceMonitor = await (0, base_utils_1.createPerformanceMonitor)({
            crawler: crawler
        });
    }
    // await persistDownloadLink({ completeOutputExample: DEFAULT_OUTPUT, pushHeadersAsItem: true })
    mainLog.info('Crawler configured.');
    await crawler.run();
    mainLog.info('Starting finishing up tasks.');
    globalContext.state.smartproxyConsumption.stop = await (0, utils_1.getSmartproxyConsumption)(finalInput);
    await globalContext.saveState();
    await globalContext.stopSavingState();
    await performanceMonitor?.stop();
    const { sessionsKvsName } = input;
    if (sessionsKvsName) {
        const keyValueStore = await apify_1.Actor.apifyClient.keyValueStores().getOrCreate(sessionsKvsName);
        const kvsClient = apify_1.Actor.apifyClient.keyValueStore(keyValueStore.id);
        let { defaultDatasetId } = apify_1.Actor.getEnv();
        if (!defaultDatasetId) {
            defaultDatasetId = `${Math.round(Math.random() * 100000)}`;
        }
        const data = await crawlee_1.Dataset.getData({ clean: true }).then((d) => d.items);
        await kvsClient.setRecord({
            key: 'SESSIONS',
            value: data
        });
        await kvsClient.setRecord({
            key: defaultDatasetId,
            value: data
        });
        const { start: smartproxyConsumptionStart, stop: smartproxyConsumptionStop } = globalContext.state.smartproxyConsumption;
        const smartproxyConsumption = smartproxyConsumptionStart && smartproxyConsumptionStop
            ? `${smartproxyConsumptionStop - smartproxyConsumptionStart} GB`
            : '';
        if (smartproxyConsumption) {
            await crawlee_1.KeyValueStore.setValue('SMARTPROXY_CONSUMPTION', smartproxyConsumption);
        }
    }
    await (0, base_utils_1.validateData)({
        assumedItemsNumber: globalContext.state.sessionCount,
        maxErrorsMarginPercent: globalContext.input.failedSessionsPercent
    });
    mainLog.info('Finishing up tasks finished.');
    await mainLog.info('Finished.');
    await apify_1.Actor.exit();
}
main();
//# sourceMappingURL=main.js.map