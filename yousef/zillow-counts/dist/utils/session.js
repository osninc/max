"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSession = exports.getBaseSession = exports.getSessionsUsingInput = exports.DEFAULT_SESSIONS_KVS_NAME = void 0;
const apify_1 = require("apify");
const lodash_1 = __importDefault(require("lodash"));
const crawlee_1 = require("crawlee");
const axios_https_proxy_fix_1 = __importDefault(require("axios-https-proxy-fix"));
const header_generator_1 = require("header-generator");
const base_utils_1 = require("../base-utils");
const proxy_1 = require("./proxy");
const headers_1 = require("./headers");
exports.DEFAULT_SESSIONS_KVS_NAME = 'land-stats-count-sessions';
const getSessionsUsingInput = async (input, defaultKvsName) => {
    const label = 'getSessions';
    const log = (0, base_utils_1.labeledLog)({ label });
    const { sessionsKvsName = defaultKvsName ?? exports.DEFAULT_SESSIONS_KVS_NAME, sessions: inputSessions = [] } = input;
    const keyValueStore = await apify_1.Actor.apifyClient.keyValueStores().getOrCreate(sessionsKvsName);
    const kvsClient = apify_1.Actor.apifyClient.keyValueStore(keyValueStore.id);
    // const sessionsKvsKeysResult = await kvsClient.listKeys({ limit: 1 })
    const kvsRecordName = 'SESSIONS';
    const logInfo = { sessionsKvsName, kvsRecordName, inputSessions };
    if (inputSessions && !Array.isArray(inputSessions)) {
        log.error('Passed data is not valid:', { ...logInfo });
        throw new Error(`${label}: Passed data is not valid!`);
    }
    let finalSessions = [];
    if (Array.isArray(inputSessions) && inputSessions.length) {
        finalSessions = inputSessions;
    }
    else {
        const kvsRecordResult = await kvsClient.getRecord(kvsRecordName);
        if (kvsRecordResult) {
            const kvsRecordValue = kvsRecordResult?.value;
            if (!kvsRecordValue) {
                log.error('Required data is missing:', { kvsRecordValue, kvsRecordResult, ...logInfo });
                throw new Error(`${label}: Required data is missing!`);
            }
            finalSessions = lodash_1.default.uniqBy(kvsRecordValue, 'proxyUrl');
        }
    }
    return finalSessions;
};
exports.getSessionsUsingInput = getSessionsUsingInput;
const getBaseSession = async (globalContext, log) => {
    const result = {
        creationTime: new Date().getTime()
    };
    const proxyUrl = await (0, proxy_1.getProxyUrl)(globalContext);
    result.proxyUrl = proxyUrl;
    const generatedHeaders = new header_generator_1.HeaderGenerator().getHeaders({
        devices: ['desktop'],
        operatingSystems: ['macos'],
        locales: ['en-US'],
        browsers: [
            {
                name: 'chrome',
                minVersion: 87,
                maxVersion: 89
            },
            // { name: 'edge' },
            // { name: 'firefox' },
            { name: 'safari' }
        ]
    });
    const requestHeaders = {
        ...headers_1.HOMES_PAGE_HEADERS,
        ...lodash_1.default.pick(generatedHeaders, ['user-agent'])
    };
    result.requestHeaders = requestHeaders;
    result.creationTime = new Date().getTime();
    globalContext.shared.inUseOrBlockedProxies.push(proxyUrl);
    log.debug('getBaseSession result', result);
    return result;
};
exports.getBaseSession = getBaseSession;
const getSession = async (globalContext, log, websiteUrl, isRequestBlocked, forceClean = true) => {
    const result = {
        creationTime: new Date().getTime()
    };
    let retries = 0;
    const url = websiteUrl;
    while (!result.proxyUrl) {
        const proxyUrl = await (0, proxy_1.getProxyUrl)(globalContext);
        if (!forceClean && retries > 0) {
            result.proxyUrl = proxyUrl;
            break;
        }
        const generatedHeaders = new header_generator_1.HeaderGenerator().getHeaders({
            devices: ['desktop'],
            operatingSystems: ['macos'],
            locales: ['en-US'],
            browsers: [
                {
                    name: 'chrome',
                    minVersion: 87,
                    maxVersion: 89
                },
                // { name: 'edge' },
                // { name: 'firefox' },
                { name: 'safari' }
            ]
        });
        const requestHeaders = {
            ...headers_1.HOMES_PAGE_HEADERS,
            ...lodash_1.default.pick(generatedHeaders, ['user-agent']),
            Referer: url,
            'Referrer-Policy': 'unsafe-url'
        };
        const finalConfig = {
            url,
            headers: requestHeaders,
            timeout: apify_1.Actor.isAtHome() ? 4000 : 30000,
            proxy: (0, proxy_1.parseProxyUrl)(proxyUrl),
            validateStatus: () => true
        };
        try {
            const response = await axios_https_proxy_fix_1.default.get(url, finalConfig);
            const statusCode = response.status;
            const body = response.data;
            if (!isRequestBlocked(statusCode, body)) {
                result.proxyUrl = proxyUrl;
                const cookies = (0, crawlee_1.getCookiesFromResponse)(response);
                result.requestHeaders = requestHeaders;
                result.cookie = cookies.map((cookie) => `${cookie.key}=${cookie.value}`).join(';');
                result.creationTime = new Date().getTime();
            }
        }
        catch (e) {
            void e;
        }
        globalContext.shared.inUseOrBlockedProxies.push(proxyUrl);
        retries++;
        if (retries > 3) {
            break;
        }
    }
    log.debug('getSession result', result);
    return result;
};
exports.getSession = getSession;
//# sourceMappingURL=session.js.map