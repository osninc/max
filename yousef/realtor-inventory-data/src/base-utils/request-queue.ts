import { Log, QueueOperationInfo, Request, RequestOptions, RequestQueue, sleep } from 'crawlee'
import ow from 'ow'

import { GlobalContext } from './global-context'
import { labeledLog } from './general'

/**
 * The more concurrent writes to the RequestQueue,
 * the slower it gets but not exponentially slower, but pretty fast when doing one
 * at a time, that recalculates after each addRequest call
 *
 * Example on increasing concurrentWrites:
 *   1 = 1ms (2ms on addRequest call)
 *   3 = 3ms (6ms)
 *   10 = 10ms (20ms)
 *   20 = 20ms (40ms)
 *   30 = 30ms (60ms)
 *   100 = 200ms (400ms)
 *   1000 = 3000ms (6000ms)
 *
 * @param {RequestQueue} rq
 */
export const rateLimitedRQ = (rq: RequestQueue) => {
    let concurrentWrites = 0
    /**
     * Gets the current interval sleep value in ms
     */
    const currentSleepValue = () => (concurrentWrites || 1) * (Math.round(Math.log10(concurrentWrites || 1)) || 1)
    const addRequest = async (
        request: Request | RequestOptions,
        options?: { forefront: boolean }
    ): Promise<QueueOperationInfo> => {
        // racing conditions may happen
        if (concurrentWrites < 0) {
            concurrentWrites = 0
        }
        concurrentWrites++

        await sleep(currentSleepValue())
        const added = await rq.addRequest(request, options)

        concurrentWrites--
        await sleep(currentSleepValue())

        if (concurrentWrites < 0) {
            concurrentWrites = 0
        }

        return added
    }
    return {
        currentSleepValue,
        addRequest
    }
}

export interface IParallelRequestsEnqueueOptions {
    requestQueue: RequestQueue
    addRequest?: Promise<void>
    globalContext?: GlobalContext | { state: object }
    loggedInfo?: object
    stateId?: string
}

export class ParallelRequestsEnqueue {
    private addRequest: any

    private globalContext: GlobalContext | { state: object }

    private loggedInfo: object

    private isLoggingEnqueuedRequests: boolean

    private stateKey: string

    private log: Log

    constructor(options: IParallelRequestsEnqueueOptions) {
        const { requestQueue, addRequest, globalContext, loggedInfo = {}, stateId = `${Math.random()}` } = options
        this.addRequest = addRequest || rateLimitedRQ(requestQueue).addRequest
        this.globalContext = globalContext ?? { state: {} }
        this.loggedInfo = loggedInfo

        this.isLoggingEnqueuedRequests = false

        this.stateKey = `PRE-${stateId}`
        // @ts-ignore
        this.globalContext.state[this.stateKey] = this.globalContext.state[this.stateKey] || {
            enqueuedProductUrls: []
        }
        this.log = labeledLog({ label: 'ParallelRequestsEnqueue' })
    }

    getState() {
        // @ts-ignore
        return this.globalContext.state[this.stateKey]
    }

    /**
     *
     * @param requests
     * @returns {Promise<void>}
     */
    async enqueue(requests: any[]) {
        ow(requests, ow.array.minLength(1))
        const state = this.getState()
        const requestChunksPromises = []
        const currentRequestChunk: any[] = []
        const chunkSize = Math.ceil(requests.length / 20)
        for (let i = 1; i <= requests.length; i++) {
            const request = requests[i - 1]
            currentRequestChunk.push({
                index: i - 1,
                request
            })
            if (i % chunkSize === 0 || i === requests.length) {
                // eslint-disable-next-line no-async-promise-executor
                requestChunksPromises.push(
                    // eslint-disable-next-line no-async-promise-executor
                    new Promise<void>(async (resolve, reject) => {
                        const requestChunk = Array.from(currentRequestChunk)
                        // eslint-disable-next-line no-restricted-syntax
                        for (const requestEl of requestChunk) {
                            if (state.enqueuedProductUrls.indexOf(requestEl.index) === -1) {
                                try {
                                    await this.addRequest(requestEl.request)
                                } catch (error) {
                                    reject(error)
                                    return
                                }
                                state.enqueuedProductUrls.push(requestEl.index)
                            }
                            if (
                                !this.isLoggingEnqueuedRequests &&
                                (state.enqueuedProductUrls.length % 100 === 0 || i + 1 === requests.length)
                            ) {
                                this.isLoggingEnqueuedRequests = true
                                this.log.info('Enqueuing requests to the RQ statistics:', {
                                    count: state.enqueuedProductUrls.length,
                                    ...this.loggedInfo
                                })
                                this.isLoggingEnqueuedRequests = false
                            }
                        }
                        resolve()
                    })
                )
                currentRequestChunk.length = 0
            }
        }

        await Promise.all(requestChunksPromises)
        state.enqueuedProductUrlCount = state.enqueuedProductUrls.length
        state.enqueuedProductUrls.length = 0
        this.log.info('Enqueuing requests to the RQ finished:', {
            count: state.enqueuedProductUrlCount,
            ...this.loggedInfo
        })
    }
}

/**
 * Create an instance of PerformanceMonitor and initialize it.
 */
export const createParallelRequestsEnqueue = async (
    parallelRequestsEnqueueOptions: IParallelRequestsEnqueueOptions,
    requests: any[]
) => {
    const parallelRequestsEnqueueInstance = new ParallelRequestsEnqueue(parallelRequestsEnqueueOptions)
    return parallelRequestsEnqueueInstance.enqueue(requests)
}
