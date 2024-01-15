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
exports.persistHeavyResponseDataIntoRequest = exports.persistResponseDataIntoRequest = exports.convertJsonpResponseToJson = exports.getJsonpResponseContent = exports.createRandomJqueryJsonpCallbackFunctionName = exports.queryParametersToString = exports.formatAndCleanText = exports.failedRequestHandler = exports.savePageSnapshot = exports.savePageMhtml = exports.savePageHtml = exports.savePageScreenshot = exports.labeledLog = exports.labelMessage = exports.toPascalCase = exports.parseHrtimeToSeconds = exports.getValidKey = exports.getMinNumber = void 0;
const crypto = __importStar(require("crypto"));
const apify_1 = require("apify");
const ansi_colors_1 = __importDefault(require("ansi-colors"));
const crawlee_1 = require("crawlee");
const lodash_1 = __importDefault(require("lodash"));
const getMinNumber = (defaultNumber, ...numbers) => Math.min(...numbers, defaultNumber) || defaultNumber;
exports.getMinNumber = getMinNumber;
const getValidKey = (str, hashKey = false) => {
    if (!hashKey) {
        // return str.replace(/[^[a-zA-Z0-9!\-_.'()]/g, '');
        return str.replace(/([+/=])/g, '');
    }
    return crypto
        .createHash('sha256')
        .update(str)
        .digest('base64')
        .replace(/([+/=])/g, '')
        .substr(0, 255);
};
exports.getValidKey = getValidKey;
const parseHrtimeToSeconds = (hrtime) => {
    return +(hrtime[0] + hrtime[1] / 1e9).toFixed(3);
};
exports.parseHrtimeToSeconds = parseHrtimeToSeconds;
const toPascalCase = (str) => {
    return lodash_1.default.startCase(lodash_1.default.camelCase(str)).replace(/ /g, '');
};
exports.toPascalCase = toPascalCase;
const labelMessage = (options) => {
    const { label, message, isToPascalCase = true, styleFunction = ansi_colors_1.default.blueBright } = options;
    const finalLabel = isToPascalCase ? (0, exports.toPascalCase)(label) : label;
    return `${styleFunction(finalLabel)}: ${message}`;
};
exports.labelMessage = labelMessage;
const labeledLog = (options) => {
    const { label, isToPascalCase = true, styleFunction = ansi_colors_1.default.blueBright } = options;
    const logInstance = crawlee_1.log.child({});
    ['info', 'warning', 'softFail', 'error', 'debug', 'perf', 'exception'].forEach((func) => {
        // @ts-ignore
        const funcValue = logInstance[func].bind(logInstance);
        // @ts-ignore
        logInstance[func] = (...funcOptions) => {
            const firstParam = funcOptions.shift();
            const originalMessage = func === 'exception' ? funcOptions.shift() : firstParam;
            const labeledMessage = (0, exports.labelMessage)({
                label,
                isToPascalCase,
                styleFunction,
                message: originalMessage
            });
            const finalOptions = func === 'exception' ? [firstParam, labeledMessage, ...funcOptions] : [labeledMessage, ...funcOptions];
            funcValue(...finalOptions);
        };
    });
    return logInstance;
};
exports.labeledLog = labeledLog;
async function saveScreenshot(page, key = 'KEY') {
    const ss = await page.screenshot({ fullPage: true });
    await crawlee_1.KeyValueStore.setValue(key, ss, { contentType: 'image/png' });
}
const savePageScreenshot = async (page, key = 'LOGIN_ERROR', disableLog = false) => {
    await saveScreenshot(page, key);
    if (!disableLog) {
        crawlee_1.log.error(`A screenshot of the page is saved in run's default key value store under key "${key}"`);
    }
};
exports.savePageScreenshot = savePageScreenshot;
const savePageHtml = async (page, key = 'HTML', disableLog = false) => {
    const html = await page.content();
    await crawlee_1.KeyValueStore.setValue(key, html, { contentType: 'text/html' });
    if (!disableLog) {
        crawlee_1.log.error(`HTML of the page is saved in run's default key value store under key "${key}"`);
    }
};
exports.savePageHtml = savePageHtml;
const getMhtml = async (aPage) => {
    const session = await aPage.context().newCDPSession(aPage);
    await session.send('Page.enable');
    const { data } = await session.send('Page.captureSnapshot');
    return data;
};
const savePageMhtml = async (page, key = 'MHTML', disableLog = false) => {
    const mhtml = await getMhtml(page);
    await crawlee_1.KeyValueStore.setValue(key, mhtml, { contentType: 'multipart/related' });
    if (!disableLog) {
        crawlee_1.log.error(`MHTML of the page is saved in run's default key value store under key "${key}"`);
    }
};
exports.savePageMhtml = savePageMhtml;
const savePageSnapshot = async (crawlingContext, keyPrefix = 'SNAPSHOT', extraData = {}) => {
    const { page } = crawlingContext;
    const screenshotKey = `${keyPrefix}_SCREENSHOT.png`;
    const htmlKey = `${keyPrefix}_HTML.html`;
    const mhtmlKey = `${keyPrefix}_MHTML.mht`;
    await (0, exports.savePageScreenshot)(page, screenshotKey, true);
    await (0, exports.savePageHtml)(page, htmlKey, true);
    const isSaveMhtml = crawlingContext.crawler.launchContext.launcher._serverLauncher._browserName === 'chromium';
    if (isSaveMhtml) {
        await (0, exports.savePageMhtml)(page, mhtmlKey, true);
    }
    const keyValueStore = await apify_1.Actor.openKeyValueStore();
    const snapshotData = {
        screenshot: keyValueStore.getPublicUrl(screenshotKey),
        html: keyValueStore.getPublicUrl(htmlKey),
        mhtml: isSaveMhtml ? keyValueStore.getPublicUrl(mhtmlKey) : null,
        url: page.url(),
        cookies: await page.context().cookies(),
        ...extraData
    };
    await crawlee_1.KeyValueStore.setValue(keyPrefix, snapshotData);
    crawlee_1.log.info(`SNAPSHOT of the page is saved in run's default key value store under key "${keyPrefix}"`);
};
exports.savePageSnapshot = savePageSnapshot;
let failedRequestsNumber = 0;
let lastCheckTime = process.hrtime();
let isStopping = false;
const failedRequestHandler = (options = {}) => async (crawlingContext) => {
    const { postHandlingFunction, withSnapshot = false, failedRequestsTrackingTimeSecs = 60, maxFailedRequestsNumberPerTime = 10 } = options;
    const { request, request: { url, uniqueKey, userData, headers, payload } } = crawlingContext;
    const error = crawlingContext.error;
    const { label = 'UNDEFINED' } = userData;
    const failedRequestHandlerLog = (0, exports.labeledLog)({
        label: 'FAILED_REQUEST_HANDLER'
    });
    const requestLog = failedRequestHandlerLog.child({
        prefix: `FRH:${(0, exports.toPascalCase)(label)}`
    });
    const errorMessage = error.message;
    requestLog.error(`Request failed completely: ${url}, error: ${errorMessage}`);
    const debugData = {
        ...(0, crawlee_1.createRequestDebugInfo)(request),
        headers,
        payload,
        uniqueKey,
        userData
    };
    if (withSnapshot) {
        const snapshotId = `ERROR_${request.id}`;
        await (0, exports.savePageSnapshot)(crawlingContext, snapshotId);
        debugData.snapshot = snapshotId;
    }
    await crawlee_1.Dataset.pushData({
        '#debug': debugData
    });
    if (postHandlingFunction) {
        await postHandlingFunction();
    }
    const currentTime = process.hrtime(lastCheckTime);
    const elapsedTimeSeconds = (0, exports.parseHrtimeToSeconds)(currentTime);
    if (elapsedTimeSeconds > failedRequestsTrackingTimeSecs) {
        lastCheckTime = process.hrtime();
        failedRequestsNumber = 0;
    }
    failedRequestsNumber++;
    if (failedRequestsNumber > maxFailedRequestsNumberPerTime && !isStopping) {
        isStopping = true;
        failedRequestHandlerLog.error('Multiple requests failed in a short time. Actor will stop.');
        apify_1.Actor.getDefaultInstance().eventManager.emit('aborting');
        failedRequestHandlerLog.info('Waiting for 30 seconds...');
        await (0, crawlee_1.sleep)(30000);
        failedRequestHandlerLog.info('Process will exit. Please, check that everything is working correctly.');
        process.exit(-1);
    }
};
exports.failedRequestHandler = failedRequestHandler;
const formatAndCleanText = (str, options) => {
    const { replaceMultipleNewLineChar = false, replaceMultipleSpaceChar = false, removeCarriageReturnChar = false } = options;
    let resultStr = str;
    if (replaceMultipleNewLineChar) {
        resultStr = resultStr.replace(/\n+/g, ' ');
    }
    if (replaceMultipleSpaceChar) {
        resultStr = resultStr.replace(/[^\S\n\r]+/g, ' ');
    }
    if (removeCarriageReturnChar) {
        resultStr = resultStr.replace(/\r/g, '');
    }
    return resultStr;
};
exports.formatAndCleanText = formatAndCleanText;
const queryParametersToString = (options) => {
    const { queryParameters, encodeKey = true, encodeValue = true } = options;
    return Array.from(Object.keys(queryParameters))
        .map((key) => {
        let qpKey = key;
        if (encodeKey) {
            qpKey = encodeURIComponent(qpKey);
        }
        let qpValue = queryParameters[key];
        if (typeof qpValue === 'object') {
            qpValue = JSON.stringify(qpValue);
        }
        if (encodeValue) {
            qpValue = encodeURIComponent(qpValue);
        }
        return `${qpKey}=${qpValue}`;
    })
        .join('&');
};
exports.queryParametersToString = queryParametersToString;
const createRandomJqueryJsonpCallbackFunctionName = () => {
    const twentyDigitsNumber = `${Math.floor(1000000000 + Math.random() * 9000000000)}${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    return `jQuery${twentyDigitsNumber}_${Date.now()}`;
};
exports.createRandomJqueryJsonpCallbackFunctionName = createRandomJqueryJsonpCallbackFunctionName;
const getJsonpResponseContent = (responseBody, callbackFunctionName) => {
    const responseBodyText = responseBody.toString();
    const jsonpContent = responseBodyText.substring(callbackFunctionName.length + 1, responseBodyText.length - 1);
    return jsonpContent;
};
exports.getJsonpResponseContent = getJsonpResponseContent;
const convertJsonpResponseToJson = (responseBody, callbackFunctionName) => {
    const jsonpContent = (0, exports.getJsonpResponseContent)(responseBody, callbackFunctionName);
    return JSON.parse(jsonpContent);
};
exports.convertJsonpResponseToJson = convertJsonpResponseToJson;
const getResponseData = (options) => {
    const { crawlingContext, response } = options;
    const availableResponse = response || crawlingContext.response;
    const { statusCode = 200, headers = {} } = availableResponse;
    let { body = '' } = availableResponse;
    if (Buffer.isBuffer(body)) {
        body = body.toString();
    }
    const responseData = {
        statusCode,
        headers,
        body
    };
    return responseData;
};
const saveResponseDataToRequest = (options) => {
    const { crawlingContext, responseData } = options;
    const { responses = [] } = crawlingContext.request.userData;
    responses.push(responseData);
    crawlingContext.request.userData.responses = responses;
};
const persistResponseDataIntoRequest = (options) => {
    const { crawlingContext, response } = options;
    const responseData = getResponseData({ crawlingContext, response });
    saveResponseDataToRequest({ crawlingContext, responseData });
};
exports.persistResponseDataIntoRequest = persistResponseDataIntoRequest;
const persistHeavyResponseDataIntoRequest = async (options) => {
    const { crawlingContext, response } = options;
    const responseData = getResponseData({ crawlingContext, response });
    const { page } = crawlingContext;
    const { id = `${Math.random()}`.replace('0.', '') } = crawlingContext.request;
    const { label = 'UNDEFINED', responses = [] } = crawlingContext.request.userData;
    const responseKey = `${id}_${label}_R${responses.length + 1}`;
    await crawlee_1.KeyValueStore.setValue(responseKey, responseData);
    if (page) {
        await crawlee_1.KeyValueStore.setValue(`${responseKey}_SS`, await page.screenshot(), { contentType: 'image/png' });
    }
    saveResponseDataToRequest({ crawlingContext, responseData });
};
exports.persistHeavyResponseDataIntoRequest = persistHeavyResponseDataIntoRequest;
//# sourceMappingURL=general.js.map