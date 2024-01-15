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
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeUnusedBrowsers = exports.getBrowser = void 0;
const crawlee_1 = require("crawlee");
const playwright = __importStar(require("playwright-core"));
const getBrowser = async (crawlingContext, globalContext, proxyUrl) => {
    const browserId = crawlingContext.session?.id ?? `${Math.random()}`.replace('0.', '');
    let browser = globalContext.shared.browsers[browserId];
    if (browser) {
        return browser;
    }
    const args = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--no-first-run',
        '--disable-blink-features=AutomationControlled'
    ];
    browser = (await (0, crawlee_1.launchPlaywright)({
        launchOptions: {
            headless: !globalContext.input.headfull,
            args,
            slowMo: 200,
            ignoreDefaultArgs: ['--enable-automation']
        },
        // userDataDir: './userdata/',
        launcher: playwright.chromium,
        useChrome: true,
        useIncognitoPages: true,
        proxyUrl
    }));
    // @ts-ignore
    browser.proxyUrl = proxyUrl;
    globalContext.shared.browsers[browserId] = browser;
    return browser;
};
exports.getBrowser = getBrowser;
let removeUnusedBrowsersCycleCallTimes = 0;
const removeUnusedBrowsers = async (crawlingContext, globalContext) => {
    const { sessionPool } = crawlingContext.crawler;
    if (!sessionPool) {
        return;
    }
    removeUnusedBrowsersCycleCallTimes++;
    if (removeUnusedBrowsersCycleCallTimes < 2) {
        return;
    }
    removeUnusedBrowsersCycleCallTimes = 0;
    const sessions = sessionPool
        .getState()
        .sessions.filter((s) => !s.errorScore)
        .map((s) => s.id);
    const browserIds = Object.keys(globalContext.shared.browsers);
    for (let i = 0; i < browserIds.length; i++) {
        const browserId = browserIds[i];
        if (!browserId || sessions.includes(browserId)) {
            continue;
        }
        const browser = globalContext.shared.browsers[browserId];
        try {
            await browser?.close();
            // eslint-disable-next-line no-empty
        }
        catch (e) { }
        delete globalContext.shared.browsers[browserId];
    }
};
exports.removeUnusedBrowsers = removeUnusedBrowsers;
//# sourceMappingURL=browser.js.map