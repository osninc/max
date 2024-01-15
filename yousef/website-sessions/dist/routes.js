"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleSession = exports.isRequestBlocked = void 0;
const crawlee_1 = require("crawlee");
const base_utils_1 = require("./base-utils");
const custom_utils_1 = require("./custom-utils");
const isRequestBlocked = (statusCode, body, extraBlockFunc) => {
    return statusCode === 403 || (extraBlockFunc && extraBlockFunc(statusCode, body));
};
exports.isRequestBlocked = isRequestBlocked;
const handleSession = async (crawlingContext, globalContext, extraData) => {
    const { request, log, session } = crawlingContext;
    const { requestHeaders, statusCode, body, cookie, proxyUrl } = extraData?.response ?? {};
    const { extraBlockFunc: extraBlockFuncStr } = globalContext.input;
    const extraBlockFunc = extraBlockFuncStr ? eval(extraBlockFuncStr) : undefined;
    const { id, websiteUrl, medium, proxyType } = request.userData;
    const requestInfo = {
        url: request.loadedUrl,
        id,
        medium,
        proxyType,
        proxyUrl,
        statusCode,
        websiteUrl,
        body
    };
    if (statusCode === 404) {
        globalContext.state.sessionCount--;
        log.info(`Page not found (404): ${request.url}`);
        return;
    }
    if ((0, exports.isRequestBlocked)(statusCode, body, extraBlockFunc)) {
        session?.retire();
        log.debug('Request blocked!', requestInfo);
        throw new Error('Request blocked!');
    }
    if (!proxyUrl) {
        (0, base_utils_1.persistResponseDataIntoRequest)({ crawlingContext });
        log.error('Page has no proxyUrl', {
            requestInfo
        });
        crawlingContext.request.noRetry = true;
        throw new Error(`Page has no proxyUrl: ${request.url}`);
    }
    log.debug('Saving session', requestInfo);
    await crawlee_1.Dataset.pushData({
        ...custom_utils_1.DEFAULT_OUTPUT,
        [custom_utils_1.OUTPUT_FIELDS.ID]: id,
        [custom_utils_1.OUTPUT_FIELDS.MEDIUM]: medium,
        [custom_utils_1.OUTPUT_FIELDS.PROXY_TYPE]: proxyType,
        [custom_utils_1.OUTPUT_FIELDS.PROXY_URL]: proxyUrl,
        [custom_utils_1.OUTPUT_FIELDS.COOKIE]: cookie,
        [custom_utils_1.OUTPUT_FIELDS.REQUEST_HEADERS]: requestHeaders,
        [custom_utils_1.OUTPUT_FIELDS.CREATION_TIME]: new Date().getTime(),
        [custom_utils_1.OUTPUT_FIELDS.WEBSITE_URL]: websiteUrl,
        '#requestInfo': requestInfo
    });
};
exports.handleSession = handleSession;
//# sourceMappingURL=routes.js.map