import { Actor } from 'apify'
import _ from 'lodash'

import { getSearchQuery, TimeTrackGeneralNames } from '../utils'
import { GlobalContext, labeledLog } from '../base-utils'
import { DATA_SAVING_STORE_TYPE, getDatasetName } from '../utils/output'

import { IFinalInput, IGlobalContextShared, IGlobalContextState } from './types'
import { WEBSITE_NAME } from './consts'

export const saveData = async (
    globalContext: GlobalContext<IFinalInput, IGlobalContextState, IGlobalContextShared>
) => {
    const log = labeledLog({ label: 'saveData' })
    const { timeTracker } = globalContext.shared
    const { dataSavingStoreType } = globalContext.input
    const logInfo = { dataSavingStoreType }

    log.info('Saving started', logInfo)
    const { searchCount, searchResults } = globalContext.state
    const totalResults = searchResults.length
    const totalNA =
        searchCount !== searchResults.length
            ? searchCount - searchResults.length
            : searchResults.filter((data: any) => data.count === 'N/A').length
    // @ts-ignore
    const failureRate = totalResults ? `${(totalNA / totalResults).toFixed(2) * 100} %` : '100 %'
    let secDiff: number
    let estimatedCost: number
    let datasetId = null
    if (Actor.isAtHome()) {
        const { actorRunId, defaultDatasetId } = Actor.getEnv()
        datasetId = defaultDatasetId
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
    const { start: smartproxyConsumptionStart, stop: smartproxyConsumptionStop } =
        globalContext.state.smartproxyConsumption ?? {}
    const smartproxyConsumption =
        smartproxyConsumptionStart && smartproxyConsumptionStop
            ? `${smartproxyConsumptionStop - smartproxyConsumptionStart} GB`
            : ''
    const outputData = [
        {
            proxyType: globalContext.input.proxyType,
            scraper: globalContext.input.scraper,
            area: getSearchQuery(globalContext.input),
            total: totalResults,
            totalFailed: totalNA,
            failureRate,
            estimatedCost: estimatedCostStr,
            totalRunTime,
            smartproxyConsumption,
            datasetId
        },
        ..._.orderBy(searchResults, ['status', 'soldInLast', 'daysOnZillow', 'acreage'], ['asc', 'asc', 'asc', 'asc'])
    ]
    if (dataSavingStoreType === DATA_SAVING_STORE_TYPE.KVS) {
        await Actor.setValue('OUTPUT', outputData)
    } else {
        await Actor.pushData([
            ...outputData
            // ...orderSearchResults(searchResults)
        ])
    }

    if (Actor.isAtHome() && dataSavingStoreType === DATA_SAVING_STORE_TYPE.DATASET) {
        const { defaultDatasetId } = Actor.getEnv()
        if (defaultDatasetId) {
            const datasetName = getDatasetName(globalContext.input, WEBSITE_NAME)
            log.info('Updating dataset name', { ...logInfo, datasetName })
            await Actor.apifyClient.dataset(defaultDatasetId).update({
                name: datasetName
            })
        }
    }

    log.info('Saving finished', { ...logInfo, itemCount: outputData.length })
}
