import { Log } from 'crawlee'

import { getValidKey } from '../base-utils'
import { IPreRequest } from '../utils'

import { IFinalInput, Inventory } from './types'
import { DESTINATION, LABELS } from './consts'
import { getRequestConfig } from './request'

export const prepareCsvDownloadRequests = async (
    input: IFinalInput,
    inventories: Inventory[],
    _log: Log,
    _logInfo?: any,
    userData?: any
) => {
    const items: IPreRequest[] = []
    inventories.forEach((inventory) => {
        if (/* inventory.geoType === 'Zip' && */ inventory.kind === 'Historical') {
            return
        }
        const requestConfig = getRequestConfig(DESTINATION.CSV_DOWNLOAD, input, inventory)
        items.push({
            url: requestConfig.userData.inventory.csvUrl,
            requestParams: requestConfig
        })
    })

    const itemRequests = items.map((item) => {
        const { url = '', requestParams = { url }, name, key = url || name } = item
        return {
            ...requestParams,
            uniqueKey: getValidKey(`${LABELS.CSV_DOWNLOAD}_${key}`),
            userData: {
                ...userData,
                label: LABELS.CSV_DOWNLOAD,
                csvUrlItem: item,
                ...item?.requestParams?.userData
            }
        }
    })

    return itemRequests
}
