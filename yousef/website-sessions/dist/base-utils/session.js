"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSessionFunctionBuilder = exports.getProxyInfo = void 0;
const crawlee_1 = require("crawlee");
const got_scraping_1 = require("got-scraping");
const playwright_core_1 = require("playwright-core");
const general_1 = require("./general");
const getProxyInfo = async (proxyUrl) => {
    // @ts-ignore
    const { statusCode, body } = await (0, got_scraping_1.gotScraping)({
        url: 'https://api.apify.com/v2/browser-info',
        proxyUrl,
        responseType: 'json'
    });
    if (statusCode !== 200) {
        throw new Error(`Wrong response status code ${statusCode}`);
    }
    return body;
};
exports.getProxyInfo = getProxyInfo;
const createSessionFunctionBuilder = (createSessionFunctionBuilderOptions) => {
    const { proxyConfiguration, websiteUrl, cookiesTargetDomains = [], extraRequestOptions = {}, extraLaunchContextOptions = {}, extraLaunchOptions = {}, gotoOptions = {}, expectedResponseStatusCode = 200, useBrowser = false, withProxyInfo = false, postCreationFunction = async () => {
        void 0;
    }, customNavigationFunction, postNavigationFunction = async () => {
        void 0;
    } } = createSessionFunctionBuilderOptions;
    return async (sessionPool, options) => {
        const log = (0, general_1.labeledLog)({ label: 'Session' });
        log.debug('Creating a session...');
        const { maxAgeSecs = 3000, maxErrorScore = 3, maxUsageCount = 10 } = options?.sessionOptions ?? {};
        const session = new crawlee_1.Session({
            sessionPool,
            maxAgeSecs,
            maxErrorScore,
            maxUsageCount
        });
        // get session id without prefix "session_"
        const sessionId = session.id.replace('session_', '');
        const proxyUrl = proxyConfiguration ? await proxyConfiguration.newUrl(sessionId) : undefined;
        session.userData = {
            sessionId,
            proxyUrl
        };
        let browser;
        try {
            if (withProxyInfo && proxyUrl) {
                session.userData.proxyInfo = await (0, exports.getProxyInfo)(proxyUrl);
            }
            let response;
            if (websiteUrl) {
                if (!cookiesTargetDomains.length) {
                    const cookiesUrl = `https://${websiteUrl.split('//')[1]?.split('/')[0]}`;
                    cookiesTargetDomains.push(cookiesUrl);
                }
                if (!useBrowser) {
                    const gotScrapingFinalOptions = {
                        url: websiteUrl,
                        ...extraRequestOptions,
                        proxyUrl,
                        timeout: {
                            request: 60000
                        }
                    };
                    response = await (0, got_scraping_1.gotScraping)(gotScrapingFinalOptions);
                    if (response.statusCode !== expectedResponseStatusCode) {
                        throw new Error(`Invalid response at get cookies request! response status code "${response.statusCode}"`);
                    }
                    session.setCookiesFromResponse(response);
                }
                else {
                    browser = await (0, crawlee_1.launchPlaywright)({
                        launcher: playwright_core_1.firefox,
                        proxyUrl,
                        ...extraLaunchContextOptions,
                        launchOptions: {
                            headless: true,
                            ...extraLaunchOptions
                        }
                    });
                    const page = await browser.newPage();
                    const finalGotoOptions = {
                        timeout: 60 * 1000,
                        waitUntil: 'domcontentloaded',
                        ...gotoOptions
                    };
                    response =
                        typeof customNavigationFunction !== 'undefined'
                            ? await customNavigationFunction({
                                page,
                                websiteUrl,
                                gotoOptions: finalGotoOptions
                            })
                            : await page.goto(websiteUrl, finalGotoOptions);
                    const statusCode = response?.status();
                    if (statusCode !== expectedResponseStatusCode) {
                        throw new Error(`Invalid response at get cookies request! response status code "${statusCode}"`);
                    }
                    await postNavigationFunction({
                        session,
                        response,
                        page
                    });
                    const cookies = await page.context().cookies();
                    for (let i = 0; i < cookiesTargetDomains.length; i++) {
                        const cookiesTargetDomain = cookiesTargetDomains[i];
                        cookiesTargetDomain && session.setCookies(cookies, cookiesTargetDomain);
                    }
                }
            }
            await postCreationFunction({ session, response });
        }
        catch (error) {
            session.retire();
            log.exception(error, 'Failed at session creation:');
        }
        finally {
            if (browser) {
                await browser.close();
            }
        }
        log.debug('A new session created:', {
            id: session.id,
            data: session.userData
        });
        return session;
    };
};
exports.createSessionFunctionBuilder = createSessionFunctionBuilder;
//# sourceMappingURL=session.js.map