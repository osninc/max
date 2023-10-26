import { BasicCrawler, Dataset, KeyValueStore, RequestQueue } from 'crawlee'
import { Actor } from 'apify'
import _ from 'lodash'

import { LABELS, PAGE_OPENED_LOG_MESSAGE_PROPS_TO_PICK } from './consts'
import { IFinalInput, IGlobalContextShared, IGlobalContextState, IInput } from './types'
import {
    createGlobalContext,
    createPerformanceMonitor,
    failedRequestHandler,
    labeledLog,
    RequestObjectArray,
    toPascalCase,
    validateData
} from './base-utils'
import * as routes from './routes'
import {
    executeRequest,
    getSmartproxyConsumption,
    getSmartproxyProxyUrls,
    prepareStartSessionRequests,
    validateInput
} from './utils'

async function main() {
    await Actor.init()

    const mainLog = labeledLog({ label: 'Main' })

    const input = (await KeyValueStore.getInput<IInput>()) || ({} as IInput)
    mainLog.info('Input:', input)

    validateInput(input)

    const {
        maxConcurrency = 3,
        ignoreStartRequests = false,
        ignoreAdditionalRequests = true,
        additionalRequests = [],
        monitorPerformance = true
    } = input

    const finalInput = input as IFinalInput

    const requestQueue = await RequestQueue.open()
    let requests: RequestObjectArray = []
    if (!ignoreAdditionalRequests) {
        requests.push(...additionalRequests)
    }

    if (!ignoreStartRequests) {
        requests = prepareStartSessionRequests(finalInput)
    }

    await requestQueue.addRequests(requests)

    const globalContext = await createGlobalContext<IFinalInput, IGlobalContextState, IGlobalContextShared>({
        input: finalInput,
        activateSaveState: true,
        initialState: {
            sessionCount: requests.length,
            smartproxyConsumption: { start: await getSmartproxyConsumption(finalInput) }
        },
        initialSharedData: {
            defaultProxyUrls: getSmartproxyProxyUrls(finalInput),
            inUseOrBlockedProxies: [],
            browsers: {}
        },
        saveStateIntervalTimeout: 30 * 60 * 1000
    })

    const crawler = new BasicCrawler({
        requestQueue,
        maxConcurrency: Actor.isAtHome() ? maxConcurrency : 2,
        useSessionPool: true,
        sessionPoolOptions: {
            maxPoolSize: maxConcurrency > 1 ? maxConcurrency * 2 : 1,
            sessionOptions: { maxUsageCount: 1 }
        },
        requestHandlerTimeoutSecs: 3 * 60,
        maxRequestRetries: 10,
        requestHandler: async (crawlingContext) => {
            const {
                url,
                userData,
                userData: { label = 'UNDEFINED' }
            } = crawlingContext.request
            const rhLog = crawlingContext.log.child({
                prefix: `RH:${toPascalCase(label)}`
            })
            crawlingContext.log = rhLog
            rhLog.info('Page opened.', {
                url,
                ..._.pick(userData, PAGE_OPENED_LOG_MESSAGE_PROPS_TO_PICK)
            })

            const response = await executeRequest(crawlingContext, globalContext)

            // if ($(CSS_SELECTORS.SERVER_ERROR).length) {
            //     throw new Error('Page not loaded (server error). Retrying...')
            // }

            switch (label) {
                case LABELS.SESSION:
                    return routes.handleSession(crawlingContext, globalContext, { response })
                default:
                    throw new Error(`Unknown label: ${label}`)
            }
        },
        errorHandler: async (crawlingContext, error) => {
            void crawlingContext
            void error
        },
        failedRequestHandler: failedRequestHandler({ withSnapshot: false })
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
    globalContext.state.smartproxyConsumption.stop = await getSmartproxyConsumption(finalInput)
    await globalContext.saveState()
    await globalContext.stopSavingState()
    await performanceMonitor?.stop()
    const { sessionsKvsName } = input
    if (sessionsKvsName) {
        const keyValueStore = await Actor.apifyClient.keyValueStores().getOrCreate(sessionsKvsName)
        const kvsClient = Actor.apifyClient.keyValueStore(keyValueStore.id)
        let { defaultDatasetId } = Actor.getEnv()
        if (!defaultDatasetId) {
            defaultDatasetId = `${Math.round(Math.random() * 100000)}`
        }
        const data = await Dataset.getData({ clean: true }).then((d) => d.items)
        await kvsClient.setRecord({
            key: 'SESSIONS',
            value: data
        })
        await kvsClient.setRecord({
            key: defaultDatasetId,
            value: data
        })
        const { start: smartproxyConsumptionStart, stop: smartproxyConsumptionStop } =
            globalContext.state.smartproxyConsumption
        const smartproxyConsumption =
            smartproxyConsumptionStart && smartproxyConsumptionStop
                ? `${smartproxyConsumptionStop - smartproxyConsumptionStart} GB`
                : ''
        if (smartproxyConsumption) {
            await KeyValueStore.setValue('SMARTPROXY_CONSUMPTION', smartproxyConsumption)
        }
    }

    await validateData({
        assumedItemsNumber: globalContext.state.sessionCount,
        maxErrorsMarginPercent: globalContext.input.failedSessionsPercent
    })
    mainLog.info('Finishing up tasks finished.')

    await mainLog.info('Finished.')

    await Actor.exit()
}

main()
