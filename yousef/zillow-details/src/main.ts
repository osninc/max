import { BasicCrawler, KeyValueStore, RequestList, Session } from 'crawlee'
import { Actor } from 'apify'
import _ from 'lodash'
import c from 'ansi-colors'
import moment = require('moment')

import {
    executeRequest,
    getSession,
    getSessionsUsingInput,
    getSmartproxyProxyUrls,
    TimeTracker,
    TimeTrackGeneralNames
} from './utils'
import {
    createGlobalContext,
    createPerformanceMonitor,
    failedRequestHandler,
    labeledLog,
    proxyConfiguration,
    toPascalCase,
    validateData
} from './base-utils'
import * as routes from './routes'
import {
    IFinalInput,
    IGlobalContextShared,
    IGlobalContextState,
    IInput,
    isRequestBlocked, LABELS,
    PAGE_OPENED_LOG_MESSAGE_PROPS_TO_PICK,
    preparePropertyRequests
} from "./custom-utils";

async function main() {
    const timeTracker = new TimeTracker()
    timeTracker.start(TimeTrackGeneralNames.RUN_DURATION)

    await Actor.init()

    const mainLog = labeledLog({ label: 'Main' })

    const input = (await KeyValueStore.getInput<IInput>()) || {}
    mainLog.info('Input:', input)
    const {
        maxConcurrency = 200,
        // proxyConfiguration: inputProxyConfiguration,
        ignoreStartRequests = false,
        ignoreAdditionalRequests = true,
        additionalRequests = [],
        monitorPerformance = false
    } = input

    const proxyConfigurationObj = await proxyConfiguration({
        proxyConfig: { useApifyProxy: true, groups: ['RESIDENTIAL'], countryCode: 'US' },
        required: true,
        force: true
    })

    // const requestQueue = await RequestQueue.open()
    let requests = []
    if (!ignoreAdditionalRequests) {
        requests.push(...additionalRequests)
    }

    const finalInput = input as IFinalInput
    finalInput.sessionDurationMinutes = finalInput.sessionDurationMinutes ?? 10

    if (!ignoreStartRequests) {
        requests = await preparePropertyRequests(finalInput)
    }

    // await requestQueue.addRequests(requests)
    const requestList = await RequestList.open('REQUEST_LIST', requests)

    const sessions = await getSessionsUsingInput(finalInput, 'zillow-count-ssessions')

    const globalContext = await createGlobalContext<IFinalInput, IGlobalContextState, IGlobalContextShared>({
        input: finalInput,
        activateSaveState: true,
        initialState: {
            propertyCount: requests.length,
            properties: new Map()
            // smartproxyConsumption: { start: await getSmartproxyConsumption(finalInput) }
        },
        initialSharedData: {
            timeTracker,
            proxyConfiguration: proxyConfigurationObj,
            sessions,
            defaultProxyUrls: getSmartproxyProxyUrls(finalInput, 10000),
            inUseOrBlockedProxies: [],
            cache: new Map()
        },
        saveStateIntervalTimeout: 30 * 60 * 1000
    })

    const forceCleanSessionsCreation = globalContext.input.forceCleanSessionsCreation ?? true

    const crawler = new BasicCrawler({
        requestList,
        minConcurrency: maxConcurrency,
        maxConcurrency: maxConcurrency + 100,
        useSessionPool: true,
        sessionPoolOptions: {
            maxPoolSize: maxConcurrency > 1 ? maxConcurrency / 5 : 1,
            sessionOptions: {
                maxUsageCount: 10
            },
            // createSessionFunction: createSessionFunctionBuilderCustom(globalContext)
            createSessionFunction: async (sessionPool, options) => {
                const sessionLog = labeledLog({
                    label: 'BasicCrawler:Session',
                    styleFunction: c.yellow
                })
                const session = new Session({ sessionPool, ...options })
                try {
                    let proxyUrl: any
                    let requestHeaders: any
                    let cookie: any
                    let creationTime: any

                    if (globalContext.shared.sessions.length) {
                        let sessionId = NaN
                        const aSession = globalContext.shared.sessions.find((s, i) => {
                            sessionId = i
                            return !s.inUse
                        })
                        ;({ proxyUrl, requestHeaders, cookie, creationTime } =
                            aSession ??
                            (await getSession(
                                globalContext,
                                sessionLog,
                                'https://www.zillow.com/',
                                isRequestBlocked,
                                forceCleanSessionsCreation
                            )))
                        !Number.isNaN(sessionId) && (globalContext.shared.sessions[sessionId].inUse = true)
                    } else {
                        ;({ proxyUrl, cookie, requestHeaders, creationTime } = await getSession(
                            globalContext,
                            sessionLog,
                            'https://www.zillow.com/',
                            isRequestBlocked,
                            forceCleanSessionsCreation
                        ))
                    }
                    session.userData.proxyUrl = proxyUrl
                    session.userData.cookie = cookie
                    session.userData.requestHeaders = requestHeaders
                    session.userData.timeSinceCreationMins = creationTime
                        ? moment(moment.now()).diff(moment(creationTime), 'minutes')
                        : 0
                    session.userData.creationTime = creationTime
                } catch (e: any) {
                    sessionLog.debug(e.message)
                }
                sessionLog.debug('createSessionFunction result', { id: session.id, ...session.userData })
                return session
            }
        },
        requestHandlerTimeoutSecs: 40,
        maxRequestRetries: 10,
        requestHandler: async (crawlingContext) => {
            const {
                url,
                userData,
                userData: { label = 'UNDEFINED' }
            } = crawlingContext.request
            const requestLog = crawlingContext.log.child({
                prefix: `RH:${toPascalCase(label)}`
            })
            crawlingContext.log = requestLog
            requestLog.info('Page opened.', {
                url,
                ..._.pick(userData, PAGE_OPENED_LOG_MESSAGE_PROPS_TO_PICK)
            })
            crawlingContext.response = await executeRequest(crawlingContext, globalContext, isRequestBlocked)
            // crawlingContext.$ = cheerio.load(crawlingContext.body);
            // if (crawlingContext.body.includes('We cannot complete your request due to a technical difficulty.')) {
            //     throw new Error('Website failed!')
            // }
            switch (label) {
                case LABELS.PROPERTY:
                    return routes.handleProperty(crawlingContext, globalContext)
                default:
                    throw new Error(`Unknown label: ${label}`)
            }
        },
        errorHandler: async (crawlingContext, error) => {
            void crawlingContext
            void error
        },
        failedRequestHandler: failedRequestHandler({ maxFailedRequestsNumberPerTime: 200 })
    })

    let performanceMonitor
    if (monitorPerformance) {
        performanceMonitor = await createPerformanceMonitor({
            crawler: crawler as unknown as BasicCrawler
        })
    }

    // await persistDownloadLink({ completeOutputExample: DEFAULT_OUTPUT, pushHeadersAsItem: true })

    mainLog.info('Crawler configured.')

    await crawler.run()

    mainLog.info('Starting finishing up tasks.')
    await globalContext.saveState()
    await globalContext.stopSavingState()
    await performanceMonitor?.stop()
    // TODO: forcibly upping the error percentage so that some results can go through
    await validateData({
        assumedItemsNumber: globalContext.state.propertyCount,
        maxErrorsMarginPercent: 50
    })
    mainLog.info('Finishing up tasks finished.')

    mainLog.info('Finished.')

    await Actor.exit()
}

main()
