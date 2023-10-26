import { Log } from 'crawlee'

import { labeledLog } from '../base-utils'

// eslint-disable-next-line @typescript-eslint/naming-convention
interface TimeEndFunction {
    /**
     @returns Elapsed milliseconds.
     */
    (): number

    /**
     @returns Elapsed milliseconds rounded.
     */
    rounded(): number

    /**
     @returns Elapsed seconds.
     */
    seconds(): number

    /**
     @returns Elapsed nanoseconds.
     */
    nanoseconds(): bigint
}

function convertHrtime(hrtime: any) {
    const nanoseconds = hrtime
    const number = Number(nanoseconds)
    const milliseconds = number / 1000000
    const seconds = number / 1000000000

    return {
        seconds,
        milliseconds,
        nanoseconds
    }
}

function timeSpan() {
    const start = process.hrtime.bigint()
    // @ts-ignore
    const end = (type: string) => convertHrtime(process.hrtime.bigint() - start)[type]

    const returnValue = () => end('milliseconds')
    returnValue.rounded = () => Math.round(end('milliseconds'))
    returnValue.seconds = () => end('seconds')
    returnValue.nanoseconds = () => end('nanoseconds')

    return returnValue
}
export const TimeTrackGeneralNames = {
    RUN_DURATION: 'RUN_DURATION',
    PRE_CONFIGURATION: 'PRE_CONFIGURATION',
    CRAWLER_CONFIGURATION: 'CRAWLER_CONFIGURATION',
    LOCATION_HANDLING: 'LOCATION_HANDLING',
    SEARCH_HANDLING: 'SEARCH_HANDLING',
    SAVING_RESULTS: 'SAVING_RESULTS'
}

export class TimeTracker {
    private log: Log

    private timeSpans: { [key: string]: TimeEndFunction }

    private timeTracking: { [key: string]: number }

    constructor() {
        this.timeSpans = {}
        this.timeTracking = {}
        this.log = labeledLog({ label: 'LocationManager' })
    }

    start(key: string) {
        this.log.debug('Starting time tracking', { key })
        this.timeSpans[key] = timeSpan()
    }

    stop(key: string) {
        this.log.debug('Stopping time tracking', { key })
        const time = this.timeSpans[key]?.seconds()
        if (!time) {
            this.log.debug('Time tracking not found', { key })
            return 0
        }
        this.timeTracking[key] = time
        return time
    }
}
