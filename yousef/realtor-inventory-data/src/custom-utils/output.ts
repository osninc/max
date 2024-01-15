import { Actor } from 'apify'
import _ from 'lodash'

import { TimeTrackGeneralNames } from '../utils'
import { GlobalContext, labeledLog } from '../base-utils'

import { IFinalInput, IGlobalContextShared, IGlobalContextState } from './types'

export const saveData = async (
    globalContext: GlobalContext<IFinalInput, IGlobalContextState, IGlobalContextShared>
) => {
    const log = labeledLog({ label: 'saveData' })
    const { timeTracker } = globalContext.shared
    const logInfo = {}

    log.info('Saving started', logInfo)
    const { inventoryCount, inventoryResults } = globalContext.state
    const totalResults = inventoryResults.length
    const totalNA =
        inventoryCount !== inventoryResults.length
            ? inventoryCount - inventoryResults.length
            : inventoryResults.filter((data: any) => data.count === 'N/A').length
    // @ts-ignore
    const failureRate = totalResults ? `${(totalNA / totalResults).toFixed(2) * 100} %` : '100 %'
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
        secDiff = timeTracker.stop(TimeTrackGeneralNames.RUN_DURATION)
        const howMany10Seconds = parseInt(`${secDiff / 10}`, 10)
        estimatedCost = (howMany10Seconds === 0 ? 1 : howMany10Seconds) * 0.001
    }
    secDiff += 4
    estimatedCost += 4
    const estimatedCostStr = `$${estimatedCost?.toFixed(3)}`
    const totalRunTime = `${secDiff.toFixed(2)} seconds`
    // const { start: smartproxyConsumptionStart, stop: smartproxyConsumptionStop } =
    //     globalContext.state.smartproxyConsumption ?? {}
    // const smartproxyConsumption =
    //     smartproxyConsumptionStart && smartproxyConsumptionStop
    //         ? `${smartproxyConsumptionStop - smartproxyConsumptionStart} GB`
    //         : ''
    const outputData = [
        {
            proxyType: globalContext.input.proxyType,
            scraper: globalContext.input.scraper,
            total: totalResults,
            totalFailed: totalNA,
            failureRate,
            estimatedCost: estimatedCostStr,
            totalRunTime
            // smartproxyConsumption
        },
        ..._.orderBy(inventoryResults, ['geoType', 'kind'], ['asc', 'asc'])
    ]
    await Actor.pushData([
        ...outputData
        // ...orderSearchResults(searchResults)
    ])
    log.info('Saving finished', { ...logInfo, itemCount: outputData.length })
}
