import { BasicCrawler, KeyValueStore, RequestList, Session } from 'crawlee'
import { Actor } from 'apify'
import _ from 'lodash'
import c from 'ansi-colors'

import { LABELS } from './consts'
import {
    DESTINATION,
    executeRequest,
    getSession,
    getExternalProxyUrls,
    getRequestConfig,
    IFinalInput,
    IGlobalContextShared,
    IGlobalContextState,
    IInput,
    PAGE_OPENED_LOG_MESSAGE_PROPS_TO_PICK,
    getSearchQuery,
    prepareSearchRequests,
    createLocationManager
} from './utils'
import {
    createGlobalContext,
    createPerformanceMonitor,
    failedRequestHandler,
    getValidKey,
    labeledLog,
    proxyConfiguration,
    toPascalCase
} from './base-utils'
import * as routes from './routes'

async function main() {
    const runStartTime = performance.now()

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

    const locationManager = await createLocationManager()

    // const requestQueue = await RequestQueue.open()
    let requests = []
    if (!ignoreAdditionalRequests) {
        requests.push(...additionalRequests)
    }

    const finalInput = input as IFinalInput
    const query = getSearchQuery(finalInput)
    if (!ignoreStartRequests) {
        const location = await locationManager.loadLocation(getValidKey(query))
        if (location) {
            requests = await prepareSearchRequests(finalInput, mainLog, { query }, location)
        } else {
            const requestConfig = getRequestConfig(DESTINATION.LOCATION, finalInput)
            const userData = requestConfig.userData
            requests.push({
                ..._.omit(requestConfig, ['userData']),
                userData: {
                    label: LABELS.LOCATION,
                    ...userData
                }
            })
        }
    }

    // await requestQueue.addRequests(requests)
    const requestList = await RequestList.open('REQUEST_LIST', requests)

    const globalContext = await createGlobalContext<IFinalInput, IGlobalContextState, IGlobalContextShared>({
        input: finalInput,
        activateSaveState: false,
        initialState: {
            searchCount: 0,
            searchResults: []
        },
        initialSharedData: {
            runStartTime,
            proxyConfiguration: proxyConfigurationObj,
            locationManager,
            proxyUrls: getExternalProxyUrls(),
            inUseOrBlockedProxies: []
        },
        saveStateIntervalTimeout: 30 * 60 * 1000
    })

    const crawler = new BasicCrawler({
        requestList,
        minConcurrency: maxConcurrency,
        maxConcurrency: maxConcurrency + 100,
        useSessionPool: true,
        sessionPoolOptions: {
            maxPoolSize: maxConcurrency > 1 ? Math.round(maxConcurrency / 5) : 1,
            sessionOptions: {
                maxUsageCount: 3
            },
            // createSessionFunction: createSessionFunctionBuilderCustom(globalContext)
            createSessionFunction: async (sessionPool, options) => {
                const sessionLog = labeledLog({
                    label: 'BasicCrawler:Session',
                    styleFunction: c.yellow
                })
                const session = new Session({ sessionPool, ...options })
                try {
                    const { proxyUrl, cookie } = await getSession(globalContext, sessionLog, 'https://www.redfin.com/')
                    session.userData.proxyUrl = proxyUrl
                    session.userData.cookie = cookie
                } catch (e: any) {
                    sessionLog.debug(e.message)
                }
                return session
            }
        },
        requestHandlerTimeoutSecs: 60,
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
            crawlingContext.response = await executeRequest(crawlingContext, globalContext)
            // crawlingContext.$ = cheerio.load(crawlingContext.body);
            // if (crawlingContext.body.includes('We cannot complete your request due to a technical difficulty.')) {
            //     throw new Error('Website failed!')
            // }
            switch (label) {
                case LABELS.LOCATION:
                    return routes.handleLocation(crawlingContext, globalContext)
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
    if (!Actor.isAtHome()) await globalContext.saveState()
    // await globalContext.stopSavingState()
    await performanceMonitor?.stop()
    mainLog.info('Finishing up tasks finished.')

    // await validateData({
    //     assumedItemsNumber: globalContext.state.searchCount - 1
    // })

    // Count N/A vs. count
    const { searchCount, searchResults } = globalContext.state
    const totalResults = searchResults.length
    const totalNA =
        searchCount !== searchResults.length
            ? searchCount - searchResults.length
            : searchResults.filter((data) => data.count === 'N/A').length
    // @ts-ignore
    const failureRate = totalResults ? `${(totalNA / totalResults).toFixed(2) * 100} %` : '100 %'
    globalContext.shared.runStopTime = performance.now()
    let secDiff: number
    let estimatedCost: number
    if (Actor.isAtHome()) {
        const { actorRunId } = Actor.getEnv()
        const actorRun = await Actor.apifyClient.run(actorRunId ?? '').get()
        if (actorRun) {
            secDiff = actorRun.stats.runTimeSecs
            estimatedCost = actorRun.stats.computeUnits
        } else {
            secDiff = 0
            estimatedCost = 0
        }
    } else {
        secDiff = (globalContext.shared.runStopTime - globalContext.shared.runStartTime) / 1000
        const howMany10Seconds = parseInt(`${secDiff / 10}`, 10)
        estimatedCost = (howMany10Seconds === 0 ? 1 : howMany10Seconds) * 0.001
    }
    secDiff += 4
    estimatedCost += 4
    const estimatedCostStr = `$${estimatedCost?.toFixed(3)}`
    const totalRunTime = `${secDiff.toFixed(2)} seconds`
    await Actor.pushData([
        {
            proxy: finalInput.proxy,
            scraper: finalInput.scraper,
            area: query,
            total: totalResults,
            totalFailed: totalNA,
            failureRate,
            estimatedCost: estimatedCostStr,
            totalRunTime
        },
        ..._.orderBy(searchResults, ['status', 'soldInLast', 'daysOnRedfin', 'acreage'], ['asc', 'asc', 'asc', 'asc'])
        // ...orderSearchResults(searchResults)
    ])

    mainLog.info('Finished.')

    await Actor.exit()
}

main()
