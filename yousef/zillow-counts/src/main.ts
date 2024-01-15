import { BasicCrawler, KeyValueStore, RequestList, Session } from 'crawlee'
import { Actor } from 'apify'
import _ from 'lodash'
import c from 'ansi-colors'
import moment = require('moment')

import {
    createLocationManager,
    executeRequest,
    getSearchQuery,
    getSession,
    getSessionsUsingInput,
    getSmartproxyProxyUrls,
    getValidKVSRecordKey,
    TimeTracker,
    TimeTrackGeneralNames
} from './utils'
import {
    createGlobalContext,
    createPerformanceMonitor,
    failedRequestHandler,
    getValidKey,
    labeledLog,
    toPascalCase
} from './base-utils'
import * as routes from './routes'
import {
    DESTINATION,
    getRequestConfig,
    IFinalInput,
    IGlobalContextShared,
    IGlobalContextState,
    IInput,
    isRequestBlocked,
    LABELS,
    PAGE_OPENED_LOG_MESSAGE_PROPS_TO_PICK,
    prepareSearchRequests,
    saveData
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

    const locationManager = await createLocationManager({
        activateCaching: input.activateLocationCaching ?? true,
        kvsName: 'zillow-locations'
    })

    // const requestQueue = await RequestQueue.open()
    let requests = []
    if (!ignoreAdditionalRequests) {
        requests.push(...additionalRequests)
    }

    const finalInput = input as IFinalInput
    finalInput.sessionDurationMinutes = finalInput.sessionDurationMinutes ?? 5

    if (!ignoreStartRequests) {
        const query = getSearchQuery(finalInput)
        const location = await locationManager.loadLocation(getValidKVSRecordKey(query))
        if (location) {
            requests = await prepareSearchRequests(finalInput, mainLog, { query }, location)
        } else {
            let requestConfig = getRequestConfig(DESTINATION.LOCATION_MAP_BOUNDS, finalInput)
            const userData = requestConfig.userData
            requests.push({
                ..._.omit(requestConfig, ['userData']),
                userData: {
                    label: LABELS.LOCATION_MAP_BOUNDS,
                    ...userData
                }
            })

            requestConfig = getRequestConfig(DESTINATION.LOCATION_REGION, finalInput)
            requests.push({
                ..._.omit(requestConfig, ['userData']),
                uniqueKey: getValidKey(`${LABELS.LOCATION_REGION}_${requestConfig.url}`),
                userData: {
                    ...userData,
                    label: LABELS.LOCATION_REGION,
                    ...requestConfig.userData
                }
            })
        }
    }

    // await requestQueue.addRequests(requests)
    const requestList = await RequestList.open('REQUEST_LIST', requests)

    const sessions = await getSessionsUsingInput(finalInput)

    const globalContext = await createGlobalContext<IFinalInput, IGlobalContextState, IGlobalContextShared>({
        input: finalInput,
        activateSaveState: false,
        initialState: {
            searchCount: 0,
            searchResults: []
            // smartproxyConsumption: { start: await getSmartproxyConsumption(finalInput) }
        },
        initialSharedData: {
            timeTracker,
            locationManager,
            sessions,
            defaultProxyUrls: getSmartproxyProxyUrls(finalInput),
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
                    let cookie: any
                    let creationTime: any
                    if (globalContext.shared.sessions.length) {
                        let sessionId = NaN
                        const aSession = globalContext.shared.sessions.find((s, i) => {
                            sessionId = i
                            return !s.inUse
                        })
                        ;({ proxyUrl, requestHeaders, cookie, creationTime } = aSession ?? {})
                        !Number.isNaN(sessionId) && (globalContext.shared.sessions[sessionId].inUse = true)
                    }
                    if (!proxyUrl) {
                        ;({ proxyUrl, cookie, requestHeaders, creationTime } = await getSession(
                            globalContext,
                            sessionLog,
                            'https://www.zillow.com/homes/',
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
        requestHandlerTimeoutSecs: 45,
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
                case LABELS.LOCATION_MAP_BOUNDS:
                    return routes.handleLocationMapBounds(crawlingContext, globalContext)
                case LABELS.LOCATION_REGION:
                    return routes.handleLocationRegion(crawlingContext, globalContext)
                case LABELS.SEARCH:
                    return routes.handleSearch(crawlingContext, globalContext)
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
    // globalContext.state.smartproxyConsumption.stop = await getSmartproxyConsumption(finalInput)
    !Actor.isAtHome() && (await globalContext.saveState())
    await globalContext.stopSavingState()
    await performanceMonitor?.stop()

    // await validateData({
    //     assumedItemsNumber: globalContext.state.searchCount - 1
    // })

    await saveData(globalContext)

    mainLog.info('Finishing up tasks finished.')

    mainLog.info('Finished.')

    await Actor.exit()
}

main()
