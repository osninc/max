import { Actor } from 'apify'
import { Dataset, KeyValueStore } from 'crawlee'

import { labeledLog } from './general'

export const persistDownloadLink = async ({
    completeOutputExample,
    pushHeadersAsItem = false,
    forceCreation = false,
    fileFormat = 'xlsx'
}: {
    completeOutputExample: {
        [index: string]: any
    }
    pushHeadersAsItem?: boolean
    forceCreation?: boolean
    fileFormat?: string
}) => {
    const log = labeledLog({ label: 'Output' })
    let dataFileUrl = `local.${fileFormat}`
    if (Actor.isAtHome()) {
        const { defaultDatasetId } = Actor.getEnv()
        const fields = Object.keys(completeOutputExample).join(',')
        // eslint-disable-next-line max-len
        dataFileUrl = `https://api.apify.com/v2/datasets/${defaultDatasetId}/items?attachment=true&clean=true&format=${fileFormat}&fields=${encodeURIComponent(
            fields
        )}`
        log.info(`You can download the dataset data file here: ${dataFileUrl}`)
    }
    if (!(await KeyValueStore.getValue('DOWNLOAD_LINK')) || forceCreation) {
        await KeyValueStore.setValue('DOWNLOAD_LINK', { dataFileUrl })
        if (pushHeadersAsItem) {
            const headers: { [index: string]: any } = {}
            Object.keys(completeOutputExample).forEach((key) => {
                headers[key] = key
            })
            await Dataset.pushData([headers])
        }
    }
}
