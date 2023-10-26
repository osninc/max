import { Dataset, sleep } from 'crawlee'
import { DatasetInfo } from '@crawlee/types'

import { labeledLog } from './general'

interface IDatasetInfoExtended extends DatasetInfo {
    cleanItemCount?: number
}

export const validateData = async (params: {
    assumedItemsNumber: number
    minAssumedItemsNumber?: number
    maxErrorsMarginPercent?: number
}) => {
    const { assumedItemsNumber, minAssumedItemsNumber = 0, maxErrorsMarginPercent = 10 } = params
    const log = labeledLog({ label: 'DataValidation' })

    if (assumedItemsNumber < minAssumedItemsNumber) {
        throw new Error(
            // eslint-disable-next-line max-len
            `Parameter "assumedItemsNumber" must be greater than ${minAssumedItemsNumber}. Provided value was: ${assumedItemsNumber}`
        )
    }

    await sleep(10 * 1000)

    const dataset = await Dataset.open()
    const datasetInfo: IDatasetInfoExtended | undefined = await dataset.getInfo()
    const cleanItemsCount = datasetInfo ? datasetInfo.cleanItemCount || datasetInfo.itemCount : 0

    const cleanItemsPercent = +((cleanItemsCount * 100) / assumedItemsNumber).toFixed(2)
    const errorsMarginPercent = 100 - cleanItemsPercent

    const statistics = {
        assumedItemsNumber,
        cleanItemsCount,
        cleanItemsPercent,
        errorsMarginPercent,
        maxErrorsMarginPercent
    }
    log.info('Statistics:', statistics)

    if (errorsMarginPercent > maxErrorsMarginPercent) {
        throw new Error(`We didn't get all the assumed items ${JSON.stringify(statistics)})`)
    }
}
