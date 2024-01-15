"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeRequest = void 0;
const axios_https_proxy_fix_1 = __importDefault(require("axios-https-proxy-fix"));
const lodash_1 = __importDefault(require("lodash"));
const consts_1 = require("./consts");
const headers_1 = require("./headers");
const proxy_1 = require("./proxy");
const executeRequest = async (crawlingContext, globalContext, isRequestBlocked, transformHeaders) => {
    const { request, sendRequest, session, log } = crawlingContext;
    const { /* proxyType, */ scraper } = globalContext.input;
    const cacheKey = { type: 'executeRequest', requestId: request.id ?? request.uniqueKey };
    const cacheValue = globalContext.shared.cache.get(cacheKey);
    if (cacheValue?.isRequestSucceeded) {
        return cacheValue?.data;
    }
    const sessionIsBlocked = session?.isBlocked() || !session?.userData?.proxyUrl;
    const proxyUrl = sessionIsBlocked && globalContext.input.proxyType !== proxy_1.PROXY_TYPE.NONE
        ? (0, proxy_1.getProxyUrl)(globalContext)
        : session?.userData?.proxyUrl;
    // @ts-ignore
    const requestHeaders = sessionIsBlocked
        ? {}
        : lodash_1.default.omit(session?.userData?.requestHeaders, [
            'sec-ch-ua',
            'sec-ch-ua-mobile',
            'sec-ch-ua-platform',
            'sec-fetch-dest',
            'sec-fetch-mode',
            'sec-fetch-site',
            'user-agent'
        ]);
    const cookie = sessionIsBlocked ? '' : session?.userData?.cookie;
    // if (proxyType !== 'none' /* && request.retryCount !== 0 */) {
    //     switch (request.retryCount) {
    //         /* case 0: {
    //             proxyUrl =
    //                 (await globalContext.shared.proxyConfiguration?.newUrl(`${Math.round(Math.random() * 10000)}`))
    //                 ??
    //                 ''
    //             break
    //         } */
    //         default: {
    //             proxyUrl = pickNonBlockedProxyUrl(globalContext.shared.proxyUrls,
    //             globalContext.shared.blockedProxies)
    //             crawlingContext.request.userData.proxyUrl = proxyUrl
    //             break
    //         }
    //     }
    // }
    let response;
    let statusCode;
    let body;
    if (scraper === consts_1.REQUEST_HANDLER.AXIOS) {
        const AXIOS_DEFAULTS = {
            timeout: 30000
        };
        const { headers } = request;
        const { searchParams, searchData, responseType } = request.userData.requestOptions ?? {};
        const finalConfig = {
            ...AXIOS_DEFAULTS,
            headers: {
                ...headers_1.SEARCH_HEADERS,
                ...headers,
                ...requestHeaders
            },
            ...(responseType
                ? {
                    responseType
                }
                : {}),
            params: searchParams,
            data: searchData,
            ...(proxyUrl
                ? {
                    rejectUnauthorized: false,
                    proxy: (0, proxy_1.parseProxyUrl)(proxyUrl)
                }
                : {}),
            validateStatus: () => true
        };
        if (cookie) {
            finalConfig.headers = {
                ...finalConfig.headers,
                cookie
            };
        }
        if (transformHeaders) {
            finalConfig.headers = transformHeaders(finalConfig.headers);
        }
        response = await axios_https_proxy_fix_1.default.get(request.url, finalConfig);
        statusCode = response.status;
        body = response.data;
    }
    else {
        // Build the request
        const finalRequest = {
            url: request.url,
            method: request.method,
            body: request.payload,
            headers: { ...headers_1.SEARCH_HEADERS, ...request.headers /* ...requestHeaders */ },
            ...request.userData.requestOptions,
            // headerGeneratorOptions: { ...randomHeaders }
            timeout: { connect: 5000, request: 30000 }
        };
        if (proxyUrl) {
            finalRequest.proxyUrl = proxyUrl;
        }
        if (cookie) {
            finalRequest.headers = {
                ...finalRequest.headers,
                cookie
            };
        }
        delete finalRequest.headerGeneratorOptions;
        response = await sendRequest(finalRequest);
        statusCode = response.statusCode;
        body = response.body;
    }
    if (isRequestBlocked(statusCode, body)) {
        proxyUrl && globalContext.shared.inUseOrBlockedProxies.push(proxyUrl);
        session?.retire();
        log.debug('Request blocked!', { proxyUrl });
        throw new Error('Request blocked!');
    }
    globalContext.shared.cache.set(cacheKey, { isRequestSucceeded: true, data: { statusCode, body } });
    return { statusCode, body };
};
exports.executeRequest = executeRequest;
//# sourceMappingURL=request.js.map