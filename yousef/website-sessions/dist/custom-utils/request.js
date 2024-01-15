"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeRequest = exports.Medium = void 0;
const crawlee_1 = require("crawlee");
const fingerprint_injector_1 = require("fingerprint-injector");
const utils_1 = require("../utils");
const browser_1 = require("./browser");
exports.Medium = {
    CRAWLEE_SEND_REQUEST: 'CRAWLEE_SEND_REQUEST',
    AXIOS: 'AXIOS',
    BROWSER: 'BROWSER'
};
const getChallengeFrame = async (page) => {
    const frames = page.frames();
    const frameTitles = [];
    let challengeFrame;
    // eslint-disable-next-line no-restricted-syntax
    for (const frame of frames) {
        // if (f.isDetached()) {
        //     return false
        // }
        const title = await frame.title();
        frameTitles.push(title);
        if (title === 'Human verification challenge') {
            const frameElementHandle = await frame.frameElement();
            const style = await frameElementHandle.getAttribute('style');
            if (style?.includes('display: block;')) {
                challengeFrame = frame;
                break;
            }
        }
    }
    return challengeFrame;
};
const solveChallenge = async (page) => {
    let response = null;
    try {
        // await page.waitForSelector('iframe[title="Human verification challenge"][style*="display: block;"]')
        await (0, crawlee_1.sleep)(10000);
        const challengeFrame = await getChallengeFrame(page);
        if (challengeFrame) {
            const buttonLocator = challengeFrame.locator('p:has-text("Press & Hold")');
            const clickPosition = { x: (0, utils_1.randomXToY)(4, 7), y: (0, utils_1.randomXToY)(11, 17) };
            await buttonLocator.hover({ position: clickPosition });
            [, response] = await Promise.all([
                buttonLocator.click({
                    button: 'right',
                    position: clickPosition,
                    delay: 20000
                }),
                page.waitForNavigation({ timeout: 60000 })
            ]);
        }
        const isChallenge = !!(await getChallengeFrame(page));
        if (isChallenge) {
            return { solved: false, error: new Error('Unknown error when solving the challenge!'), response };
        }
        return { solved: true, response };
    }
    catch (e) {
        return { solved: false, error: e, response };
    }
};
const executeRequest = async (crawlingContext, globalContext) => {
    const { request, log } = crawlingContext;
    const { /* id, */ medium } = request.userData;
    /*    const requestInfo = {
        url: request.loadedUrl,
        id
    } */
    let result;
    const proxyUrl = await (0, utils_1.getProxyUrl)(globalContext);
    globalContext.shared.inUseOrBlockedProxies.push(proxyUrl);
    switch (medium) {
        case exports.Medium.BROWSER: {
            await (0, browser_1.removeUnusedBrowsers)(crawlingContext, globalContext);
            const browser = await (0, browser_1.getBrowser)(crawlingContext, globalContext, proxyUrl);
            const context = await (0, fingerprint_injector_1.newInjectedContext)(browser, {
                // Constraints for the generated fingerprint (optional)
                fingerprintOptions: {
                    devices: ['desktop'],
                    operatingSystems: ['macos']
                }
                // Playwright's newContext() options (optional, random example for illustration)
                // newContextOptions: {
                // geolocation: {
                //     latitude: 51.50853,
                //     longitude: -0.12574
                // }
                // }
            });
            const page = await context.newPage();
            const blockedExtensions = ['.png', '.css', '.jpg', '.jpeg', '.pdf', '.svg'];
            // await page.route(`**/*{${blockedExtensions.join(',')}}`, async (route) => route.abort())
            const blockedRessourceTypes = ['image', 'media', 'stylesheet', 'font'];
            await page.route('**/*', (route) => {
                if (blockedRessourceTypes.includes(route.request().resourceType())) {
                    return route.abort();
                }
                if (blockedExtensions.some((be) => route.request().url().includes(be))) {
                    return route.abort();
                }
                return route.continue();
            });
            // await page.route(/.+sapi.com\/web.+/g, async (route) => {
            //     return route.abort()
            // })
            // await page.goto(request.url, { timeout: 60000 })
            // await page.waitForSelector('.cl-command-buttons > .cl-exec-search')
            // let body = await page.content()
            // const $ = cheerio.load(body)
            let response = await page.goto(request.url, { timeout: 120000 /* , waitUntil: 'networkidle' */ });
            if (response && response.status() === 403 && globalContext.input.solveChallenge) {
                log.info('Solving the challenge...');
                const { solved, error, response: solveChallengeResponse } = await solveChallenge(page);
                if (solved) {
                    log.info('Solving the challenge succeeded');
                    response = solveChallengeResponse;
                }
                else {
                    log.exception(error, 'Error occurred while solving the challenge');
                }
            }
            const requestHeaders = (await response?.request()?.allHeaders()) ?? {};
            const statusCode = response?.status() ?? 0;
            const body = (await response?.body()?.then((b) => b.toString())) ?? '';
            const cookies = (await page?.context()?.cookies()) ?? [];
            const cookie = cookies?.map((cookieItem) => `${cookieItem.name}=${cookieItem.value}`).join(';') ?? '';
            await browser.close();
            result = { requestHeaders, statusCode, body, cookie, proxyUrl };
            break;
        }
        default: {
            const response = await crawlingContext.sendRequest({ proxyUrl });
            const { statusCode, body } = response;
            const requestHeaders = response.request.options.headers;
            const cookies = (0, crawlee_1.getCookiesFromResponse)(response);
            const cookie = cookies?.map((cookieItem) => `${cookieItem.key}=${cookieItem.value}`).join(';') ?? '';
            result = { requestHeaders, statusCode, body, cookie, proxyUrl };
            break;
        }
    }
    return result;
};
exports.executeRequest = executeRequest;
//# sourceMappingURL=request.js.map