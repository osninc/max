import { BasicCrawlingContext, Dictionary, launchPlaywright } from 'crawlee'
import * as playwright from 'playwright-core'
import { Browser } from 'playwright-core'

import { GlobalContext } from '../base-utils'

import { IFinalInput, IGlobalContextShared } from './types'

export const getBrowser = async (
    crawlingContext: BasicCrawlingContext<Dictionary<any>>,
    globalContext: GlobalContext<IFinalInput, {}, IGlobalContextShared>,
    proxyUrl: string
) => {
    const browserId = crawlingContext.session?.id ?? `${Math.random()}`.replace('0.', '')
    let browser = globalContext.shared.browsers[browserId]
    if (browser) {
        return browser
    }

    const args = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--no-first-run',
        '--disable-blink-features=AutomationControlled'
    ]

    browser = (await launchPlaywright({
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
    })) as Browser
    // @ts-ignore
    browser.proxyUrl = proxyUrl
    globalContext.shared.browsers[browserId] = browser

    return browser
}

let removeUnusedBrowsersCycleCallTimes = 0
export const removeUnusedBrowsers = async (
    crawlingContext: BasicCrawlingContext<Dictionary<any>>,
    globalContext: GlobalContext<IFinalInput, {}, IGlobalContextShared>
) => {
    const { sessionPool } = crawlingContext.crawler
    if (!sessionPool) {
        return
    }

    removeUnusedBrowsersCycleCallTimes++
    if (removeUnusedBrowsersCycleCallTimes < 2) {
        return
    }
    removeUnusedBrowsersCycleCallTimes = 0

    const sessions = sessionPool
        .getState()
        .sessions.filter((s) => !s.errorScore)
        .map((s) => s.id)
    const browserIds = Object.keys(globalContext.shared.browsers)
    for (let i = 0; i < browserIds.length; i++) {
        const browserId = browserIds[i]
        if (!browserId || sessions.includes(browserId)) {
            continue
        }
        const browser = globalContext.shared.browsers[browserId]
        try {
            await browser?.close()
            // eslint-disable-next-line no-empty
        } catch (e) {}
        delete globalContext.shared.browsers[browserId]
    }
}
