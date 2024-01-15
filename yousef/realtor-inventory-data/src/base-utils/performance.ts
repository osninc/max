import { Actor } from 'apify'
import { BasicCrawler, Log, log, sleep } from 'crawlee'

import { labeledLog } from './general'

const RESTART_RUN_ACTOR_ID = 'u586FSwK4ave5Z2lA'

export interface IPerformanceMonitorOptions {
    crawler: BasicCrawler
    activate?: boolean
    intervalTimeout?: number
    maxLogLevelRepetition?: number
}

export class PerformanceMonitor {
    private crawler: BasicCrawler

    private activate: boolean

    private intervalTimeout: number

    private checkPerformanceInterval: NodeJS.Timer | undefined

    private requestsFinished: number

    private logLevelRepetition: number

    private maxLogLevelRepetition: number

    private isChecking: boolean

    private log: Log

    constructor(options: IPerformanceMonitorOptions) {
        const { crawler, activate = true, intervalTimeout = 3 * 60 * 1000, maxLogLevelRepetition = 3 } = options

        this.crawler = crawler
        this.activate = activate
        this.intervalTimeout = intervalTimeout
        this.requestsFinished = 0
        this.logLevelRepetition = 0
        this.maxLogLevelRepetition = maxLogLevelRepetition
        this.checkPerformance = this.checkPerformance.bind(this)
        this.isChecking = false
        this.log = labeledLog({ label: 'PerformanceMonitor' })
    }

    async init() {
        if (this.activate) {
            this.checkPerformanceInterval = setInterval(this.checkPerformance, this.intervalTimeout)
        }
    }

    async checkPerformance() {
        if (this.isChecking) {
            this.log.info('Already started performance check.')
            return
        }
        this.isChecking = true
        this.log.info('Check performance started.')

        const level =
            this.crawler.stats.state.requestsFinished === this.requestsFinished ? log.LEVELS.PERF : log.LEVELS.INFO

        this.log.info(
            // eslint-disable-next-line max-len
            `Statistics: newRequestsFinished => ${this.crawler.stats.state.requestsFinished}, requestsFinished => ${this.requestsFinished}`
        )

        if (level !== log.getLevel()) {
            this.log.info(`Changing log level to ${log.LEVELS[level]}`)
            // @ts-ignore
            this.crawler.log.setLevel(level)
            log.setLevel(level)
            this.logLevelRepetition = 0
        } else {
            this.logLevelRepetition++
        }
        if (this.logLevelRepetition > this.maxLogLevelRepetition && level === log.LEVELS.PERF) {
            if (Actor.isAtHome()) {
                this.log.info('Actor stuck. Calling "restart-run" actor to resurrect the run (allow 60s).')
                const { actorRunId, memoryMbytes } = Actor.getEnv()
                await Actor.call(
                    RESTART_RUN_ACTOR_ID,
                    {
                        runId: actorRunId,
                        memory: memoryMbytes
                    },
                    { memory: 128 }
                )
                this.log.info('Waiting for 60 seconds...')
                await sleep(60000)
            } else {
                this.log.info('Actor stuck. Notify other components about that (allow 60s). Please, resurrect the run.')
                Actor.getDefaultInstance().eventManager.emit('aborting')
                this.log.info('Waiting for 60 seconds...')
                await sleep(60000)
                this.log.info('Process will exit and the run will resurrect after that.')
            }
            process.exit(-1)
        }
        this.log.info(`Log level: ${log.LEVELS[log.getLevel()]}`)
        this.requestsFinished = this.crawler.stats.state.requestsFinished

        this.log.info('Check performance finished.')
        this.isChecking = false
    }

    stop() {
        if (this.checkPerformanceInterval) {
            clearInterval(this.checkPerformanceInterval)
        }
    }
}

/**
 * Create an instance of PerformanceMonitor and initialize it.
 */
export const createPerformanceMonitor = async (options: IPerformanceMonitorOptions) => {
    const performanceMonitor = new PerformanceMonitor(options)
    await performanceMonitor.init()
    return performanceMonitor
}
