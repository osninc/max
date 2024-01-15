import { BasicCrawler, KeyValueStore, RequestList, Session } from 'crawlee'
import { Actor } from 'apify'
import _ from 'lodash'
import c from 'ansi-colors'
import moment = require('moment')

import {
    executeRequest,
    getBaseSession,
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
    toPascalCase
} from './base-utils'
import * as routes from './routes'
import {
    DEFAULT_INVENTORIES,
    DESTINATION,
    getRequestConfig,
    IFinalInput,
    IGlobalContextShared,
    IGlobalContextState,
    IInput,
    isRequestBlocked,
    LABELS,
    PAGE_OPENED_LOG_MESSAGE_PROPS_TO_PICK,
    prepareCsvDownloadRequests,
    saveData,
    updateSchedule
} from './custom-utils'

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
    finalInput.sessionDurationMinutes = finalInput.sessionDurationMinutes ?? 5

    if (!ignoreStartRequests) {
        if (finalInput.ignoreScrapingCsvUrls) {
            requests = await prepareCsvDownloadRequests(finalInput, DEFAULT_INVENTORIES, mainLog)
        } else {
            const requestConfig = getRequestConfig(DESTINATION.CSV_LISTING, finalInput)
            const userData = requestConfig.userData
            requests.push({
                ..._.omit(requestConfig, ['userData']),
                userData: {
                    label: LABELS.CSV_LISTING,
                    ...userData
                }
            })
        }
    }

    // await requestQueue.addRequests(requests)
    const requestList = await RequestList.open('REQUEST_LIST', requests)

    const sessions = await getSessionsUsingInput(finalInput, 'realtor-inventory-data-sessions')

    const globalContext = await createGlobalContext<IFinalInput, IGlobalContextState, IGlobalContextShared>({
        input: finalInput,
        activateSaveState: false,
        initialState: {
            inventoryCount: 0,
            inventoryResults: []
        },
        initialSharedData: {
            timeTracker,
            proxyConfiguration: proxyConfigurationObj,
            sessions,
            defaultProxyUrls: getSmartproxyProxyUrls(finalInput),
            inUseOrBlockedProxies: [],
            cache: new Map()
        },
        saveStateIntervalTimeout: 30 * 60 * 1000
    })

    const crawler = new BasicCrawler({
        requestList,
        maxConcurrency,
        useSessionPool: true,
        sessionPoolOptions: {
            maxPoolSize: maxConcurrency > 1 ? 20 : 1,
            sessionOptions: {
                maxUsageCount: 5
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
                    let creationTime: any

                    if (globalContext.shared.sessions.length) {
                        let sessionId = NaN
                        const aSession = globalContext.shared.sessions.find((s, i) => {
                            sessionId = i
                            return !s.inUse
                        })
                        ;({ proxyUrl, requestHeaders, creationTime } =
                            aSession ?? (await getBaseSession(globalContext, sessionLog)))
                        !Number.isNaN(sessionId) && (globalContext.shared.sessions[sessionId].inUse = true)
                    } else {
                        ;({ proxyUrl, requestHeaders, creationTime } = await getBaseSession(globalContext, sessionLog))
                    }
                    session.userData.proxyUrl = proxyUrl
                    delete session.userData.proxyUrl
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
        requestHandlerTimeoutSecs: 25 * 60,
        maxRequestRetries: 5,
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
            crawlingContext.response = await executeRequest(
                crawlingContext,
                globalContext,
                isRequestBlocked,
                (headers: any) => {
                    if (label === LABELS.CSV_DOWNLOAD) {
                        return _.pick(headers, [
                            'sec-ch-ua',
                            'sec-ch-ua-mobile',
                            'sec-ch-ua-platform',
                            'upgrade-insecure-requests'
                        ])
                    }

                    return _.pick(headers, [
                        'accept',
                        'accept-language',
                        'sec-ch-ua',
                        'sec-ch-ua-mobile',
                        'sec-ch-ua-platform',
                        'sec-fetch-dest',
                        'sec-fetch-mode',
                        'sec-fetch-site',
                        'sec-fetch-user',
                        'upgrade-insecure-requests'
                    ])
                }
            )
            // crawlingContext.$ = cheerio.load(crawlingContext.body);
            // if (crawlingContext.body.includes('We cannot complete your request due to a technical difficulty.')) {
            //     throw new Error('Website failed!')
            // }
            switch (label) {
                case LABELS.CSV_LISTING:
                    return routes.handleCsvListing(crawlingContext, globalContext)
                case LABELS.CSV_DOWNLOAD:
                    return routes.handleCsvDownload(crawlingContext, globalContext)
                default:
                    throw new Error(`Unknown label: ${label}`)
            }
        },
        errorHandler: async (crawlingContext, error) => {
            void crawlingContext
            void error
        },
        failedRequestHandler: failedRequestHandler({ maxFailedRequestsNumberPerTime: 100 })
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

    await saveData(globalContext)
    await updateSchedule(globalContext)

    mainLog.info('Finishing up tasks finished.')

    // await validateData({
    //     assumedItemsNumber: globalContext.state.searchCount - 1
    // })

    mainLog.info('Finished.')

    await Actor.exit()
}

main()
