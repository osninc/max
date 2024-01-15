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
const ansi_colors_1 = __importDefault(require("ansi-colors"));
const moment = require("moment");
const utils_1 = require("./utils");
const base_utils_1 = require("./base-utils");
const routes = __importStar(require("./routes"));
const custom_utils_1 = require("./custom-utils");
async function main() {
    const timeTracker = new utils_1.TimeTracker();
    timeTracker.start(utils_1.TimeTrackGeneralNames.RUN_DURATION);
    await apify_1.Actor.init();
    const mainLog = (0, base_utils_1.labeledLog)({ label: 'Main' });
    const input = (await crawlee_1.KeyValueStore.getInput()) || {};
    mainLog.info('Input:', input);
    const { maxConcurrency = 200, 
    // proxyConfiguration: inputProxyConfiguration,
    ignoreStartRequests = false, ignoreAdditionalRequests = true, additionalRequests = [], monitorPerformance = false } = input;
    const locationManager = await (0, utils_1.createLocationManager)({
        activateCaching: input.activateLocationCaching ?? true,
        kvsName: 'zillow-locations'
    });
    // const requestQueue = await RequestQueue.open()
    let requests = [];
    if (!ignoreAdditionalRequests) {
        requests.push(...additionalRequests);
    }
    const finalInput = input;
    finalInput.sessionDurationMinutes = finalInput.sessionDurationMinutes ?? 5;
    if (!ignoreStartRequests) {
        const query = (0, utils_1.getSearchQuery)(finalInput);
        const location = await locationManager.loadLocation((0, utils_1.getValidKVSRecordKey)(query));
        if (location) {
            requests = await (0, custom_utils_1.prepareSearchRequests)(finalInput, mainLog, { query }, location);
        }
        else {
            let requestConfig = (0, custom_utils_1.getRequestConfig)(custom_utils_1.DESTINATION.LOCATION_MAP_BOUNDS, finalInput);
            const userData = requestConfig.userData;
            requests.push({
                ...lodash_1.default.omit(requestConfig, ['userData']),
                userData: {
                    label: custom_utils_1.LABELS.LOCATION_MAP_BOUNDS,
                    ...userData
                }
            });
            requestConfig = (0, custom_utils_1.getRequestConfig)(custom_utils_1.DESTINATION.LOCATION_REGION, finalInput);
            requests.push({
                ...lodash_1.default.omit(requestConfig, ['userData']),
                uniqueKey: (0, base_utils_1.getValidKey)(`${custom_utils_1.LABELS.LOCATION_REGION}_${requestConfig.url}`),
                userData: {
                    ...userData,
                    label: custom_utils_1.LABELS.LOCATION_REGION,
                    ...requestConfig.userData
                }
            });
        }
    }
    // await requestQueue.addRequests(requests)
    const requestList = await crawlee_1.RequestList.open('REQUEST_LIST', requests);
    const sessions = await (0, utils_1.getSessionsUsingInput)(finalInput);
    const globalContext = await (0, base_utils_1.createGlobalContext)({
        input: finalInput,
        activateSaveState: false,
        initialState: {
            searchCount: 0,
            searchResults: []
            // smartproxyConsumption: { start: await getSmartproxyConsumption(finalInput) }
        },
        initialSharedData: {
            timeTracker,
            locationManager,
            sessions,
            defaultProxyUrls: (0, utils_1.getSmartproxyProxyUrls)(finalInput),
            inUseOrBlockedProxies: [],
            cache: new Map()
        },
        saveStateIntervalTimeout: 30 * 60 * 1000
    });
    const forceCleanSessionsCreation = globalContext.input.forceCleanSessionsCreation ?? true;
    const crawler = new crawlee_1.BasicCrawler({
        requestList,
        minConcurrency: maxConcurrency,
        maxConcurrency: maxConcurrency + 100,
        useSessionPool: true,
        sessionPoolOptions: {
            maxPoolSize: maxConcurrency > 1 ? 20 : 1,
            sessionOptions: {
                maxUsageCount: 5
            },
            // createSessionFunction: createSessionFunctionBuilderCustom(globalContext)
            createSessionFunction: async (sessionPool, options) => {
                const sessionLog = (0, base_utils_1.labeledLog)({
                    label: 'BasicCrawler:Session',
                    styleFunction: ansi_colors_1.default.yellow
                });
                const session = new crawlee_1.Session({ sessionPool, ...options });
                try {
                    let proxyUrl;
                    let requestHeaders;
                    let cookie;
                    let creationTime;
                    if (globalContext.shared.sessions.length) {
                        let sessionId = NaN;
                        const aSession = globalContext.shared.sessions.find((s, i) => {
                            sessionId = i;
                            return !s.inUse;
                        });
                        ({ proxyUrl, requestHeaders, cookie, creationTime } = aSession ?? {});
                        !Number.isNaN(sessionId) && (globalContext.shared.sessions[sessionId].inUse = true);
                    }
                    if (!proxyUrl) {
                        ;
                        ({ proxyUrl, cookie, requestHeaders, creationTime } = await (0, utils_1.getSession)(globalContext, sessionLog, 'https://www.zillow.com/homes/', custom_utils_1.isRequestBlocked, forceCleanSessionsCreation));
                    }
                    session.userData.proxyUrl = proxyUrl;
                    session.userData.cookie = cookie;
                    session.userData.requestHeaders = requestHeaders;
                    session.userData.timeSinceCreationMins = creationTime
                        ? moment(moment.now()).diff(moment(creationTime), 'minutes')
                        : 0;
                    session.userData.creationTime = creationTime;
                }
                catch (e) {
                    sessionLog.debug(e.message);
                }
                sessionLog.debug('createSessionFunction result', { id: session.id, ...session.userData });
                return session;
            }
        },
        requestHandlerTimeoutSecs: 45,
        maxRequestRetries: 10,
        requestHandler: async (crawlingContext) => {
            const { url, userData, userData: { label = 'UNDEFINED' } } = crawlingContext.request;
            const requestLog = crawlingContext.log.child({
                prefix: `RH:${(0, base_utils_1.toPascalCase)(label)}`
            });
            crawlingContext.log = requestLog;
            requestLog.info('Page opened.', {
                url,
                ...lodash_1.default.pick(userData, custom_utils_1.PAGE_OPENED_LOG_MESSAGE_PROPS_TO_PICK)
            });
            crawlingContext.response = await (0, utils_1.executeRequest)(crawlingContext, globalContext, custom_utils_1.isRequestBlocked);
            // crawlingContext.$ = cheerio.load(crawlingContext.body);
            // if (crawlingContext.body.includes('We cannot complete your request due to a technical difficulty.')) {
            //     throw new Error('Website failed!')
            // }
            switch (label) {
                case custom_utils_1.LABELS.LOCATION_MAP_BOUNDS:
                    return routes.handleLocationMapBounds(crawlingContext, globalContext);
                case custom_utils_1.LABELS.LOCATION_REGION:
                    return routes.handleLocationRegion(crawlingContext, globalContext);
                case custom_utils_1.LABELS.SEARCH:
                    return routes.handleSearch(crawlingContext, globalContext);
                default:
                    throw new Error(`Unknown label: ${label}`);
            }
        },
        errorHandler: async (crawlingContext, error) => {
            void crawlingContext;
            void error;
        },
        failedRequestHandler: (0, base_utils_1.failedRequestHandler)({ maxFailedRequestsNumberPerTime: 100 })
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
    // globalContext.state.smartproxyConsumption.stop = await getSmartproxyConsumption(finalInput)
    !apify_1.Actor.isAtHome() && (await globalContext.saveState());
    await globalContext.stopSavingState();
    await performanceMonitor?.stop();
    // await validateData({
    //     assumedItemsNumber: globalContext.state.searchCount - 1
    // })
    await (0, custom_utils_1.saveData)(globalContext);
    mainLog.info('Finishing up tasks finished.');
    mainLog.info('Finished.');
    await apify_1.Actor.exit();
}
main();
//# sourceMappingURL=main.js.map