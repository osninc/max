import { launchPlaywright, ProxyConfiguration, Session, SessionOptions, SessionPool } from 'crawlee'
import { gotScraping, OptionsInit } from 'got-scraping'
import { firefox as firefoxLauncher, Response } from 'playwright-core'

import { labeledLog } from './general'

export const getProxyInfo = async (proxyUrl: string) => {
    // @ts-ignore
    const { statusCode, body } = await gotScraping({
        URL: 'https://api.apify.com/v2/browser-info',
        proxyUrl,
        responseType: 'json'
    } as OptionsInit)
    if (statusCode !== 200) {
        throw new Error(`Wrong response status code ${statusCode}`)
    }
    return body
}

type GotoOptions = {
    referer?: string
    timeout?: number
    waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' | 'commit'
}
type CustomNavigationFunction = (p: {
    page: any
    websiteUrl: string
    gotoOptions: GotoOptions
}) => Promise<null | Response>
type PostNavigationFunction = (p: { session: Session; response: any; page: any }) => Promise<void> | void
type PostCreationFunction = (p: { session: Session; response: any }) => Promise<void> | void

export interface ICreateSessionFunctionBuilderOptions {
    proxyConfiguration?: ProxyConfiguration | undefined
    proxyUrlBuilder?: () => string | undefined
    websiteUrl: string
    cookiesTargetDomains?: string[]
    extraRequestOptions?: object
    extraLaunchContextOptions?: object
    extraLaunchOptions?: object
    gotoOptions?: object
    expectedResponseStatusCode?: number
    useBrowser?: boolean
    withProxyInfo?: boolean
    customNavigationFunction?: CustomNavigationFunction
    postCreationFunction?: PostCreationFunction
    postNavigationFunction?: PostNavigationFunction
}

export const createSessionFunctionBuilder = (
    createSessionFunctionBuilderOptions: ICreateSessionFunctionBuilderOptions
) => {
    const {
        proxyConfiguration,
        proxyUrlBuilder,
        websiteUrl,
        cookiesTargetDomains = [],
        extraRequestOptions = {},
        extraLaunchContextOptions = {},
        extraLaunchOptions = {},
        gotoOptions = {},
        expectedResponseStatusCode = 200,
        useBrowser = false,
        withProxyInfo = false,
        postCreationFunction = async () => {
            void 0
        },
        customNavigationFunction,
        postNavigationFunction = async () => {
            void 0
        }
    } = createSessionFunctionBuilderOptions
    return async (sessionPool: SessionPool, options?: { sessionOptions?: SessionOptions }) => {
        const log = labeledLog({ label: 'Session' })
        log.debug('Creating a session...')
        const { maxAgeSecs = 3000, maxErrorScore = 3, maxUsageCount = 10 } = options?.sessionOptions ?? {}
        const session = new Session({
            sessionPool,
            maxAgeSecs,
            maxErrorScore,
            maxUsageCount
        })
        // get session id without prefix "session_"
        const sessionId = session.id.replace('session_', '')
        let proxyUrl: string | undefined = proxyUrlBuilder ? proxyUrlBuilder() : undefined
        if (!proxyUrl) {
            proxyUrl = proxyConfiguration ? await proxyConfiguration.newUrl(sessionId) : undefined
        }
        session.userData = {
            sessionId,
            proxyUrl
        }
        let browser
        try {
            if (withProxyInfo && proxyUrl) {
                session.userData.proxyInfo = await getProxyInfo(proxyUrl)
            }

            let response
            if (websiteUrl) {
                if (!cookiesTargetDomains.length) {
                    const cookiesUrl = `https://${websiteUrl.split('//')[1]?.split('/')[0]}`
                    cookiesTargetDomains.push(cookiesUrl)
                }
                if (!useBrowser) {
                    const gotScrapingFinalOptions = {
                        url: websiteUrl,
                        ...extraRequestOptions,
                        proxyUrl,
                        timeout: {
                            request: 60000
                        }
                    }
                    response = await gotScraping(gotScrapingFinalOptions)
                    if (response.statusCode !== expectedResponseStatusCode) {
                        throw new Error(
                            `Invalid response at get cookies request! response status code "${response.statusCode}"`
                        )
                    }
                    session.setCookiesFromResponse(response)
                } else {
                    browser = await launchPlaywright({
                        launcher: firefoxLauncher as any,
                        proxyUrl,
                        ...extraLaunchContextOptions,
                        launchOptions: {
                            headless: true,
                            ...extraLaunchOptions
                        }
                    })
                    const page = await browser.newPage()

                    const finalGotoOptions: GotoOptions = {
                        timeout: 60 * 1000,
                        waitUntil: 'domcontentloaded',
                        ...gotoOptions
                    }
                    response =
                        typeof customNavigationFunction !== 'undefined'
                            ? await customNavigationFunction({
                                  page,
                                  websiteUrl,
                                  gotoOptions: finalGotoOptions
                              })
                            : await page.goto(websiteUrl, finalGotoOptions)

                    const statusCode = response?.status()
                    if (statusCode !== expectedResponseStatusCode) {
                        throw new Error(`Invalid response at get cookies request! response status code "${statusCode}"`)
                    }
                    await postNavigationFunction({
                        session,
                        response,
                        page
                    })

                    const cookies = await page.context().cookies()
                    for (let i = 0; i < cookiesTargetDomains.length; i++) {
                        const cookiesTargetDomain = cookiesTargetDomains[i]
                        cookiesTargetDomain && session.setCookies(cookies, cookiesTargetDomain)
                    }
                }
            }

            await postCreationFunction({ session, response })
        } catch (error) {
            session.retire()
            log.exception(error as Error, 'Failed at session creation:')
        } finally {
            if (browser) {
                await browser.close()
            }
        }
        log.debug('A new session created:', {
            id: session.id,
            data: session.userData
        })
        return session
    }
}
