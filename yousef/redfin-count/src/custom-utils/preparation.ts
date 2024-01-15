import { Log } from 'crawlee'

import { IPreRequest } from '../utils'
import { getValidKey } from '../base-utils'
import { buildSearchUrl, SOLD_TIME_MATRIX, LOT_SIZE, STATUS_MATRIX, FOR_SALE_TIME_MATRIX } from '../utils/redfin'

import { IFinalInput } from './types'
import { DESTINATION, LABELS } from './consts'
import { getRequestConfig } from './request'

export const prepareSearchRequests = async (
    input: IFinalInput,
    log: Log,
    logInfo: any,
    location: { query?: any; region?: any },
    userData?: any
) => {
    const { query, region } = location

    if (!query || !region) {
        log.error('Required data is missing:', { ...logInfo, query, region })
        throw new Error('prepareSearchRequests: Required data is missing!')
    }

    let statusMatrix: string[] = []
    let timeMatrix: string[][] = []
    let lotSize: string[][] = []

    if (input.isTest) {
        statusMatrix = ['For Sale']
        timeMatrix = [['36m', '36 months']]
        lotSize = [['435600', '871200']]
    } else {
        statusMatrix = STATUS_MATRIX
        timeMatrix = FOR_SALE_TIME_MATRIX
        lotSize = LOT_SIZE
    }

    const searches: IPreRequest[] = []
    statusMatrix.forEach((status) => {
        timeMatrix = status === STATUS_MATRIX[0] ? FOR_SALE_TIME_MATRIX : SOLD_TIME_MATRIX
        timeMatrix.forEach((timeArr) => {
            lotSize.forEach((lotArr) => {
                const lot = { min: Number(lotArr[0]), max: Number(lotArr[1]) }
                const searchUrl = buildSearchUrl({ region, status, lot, time: timeArr[0] })
                const extraData = {
                    searchUrl,
                    region,
                    status,
                    lot,
                    time: timeArr[0]
                }

                const requestConfig = getRequestConfig(DESTINATION.SEARCH, input, extraData)
                searches.push({
                    url: requestConfig.userData.searchUrl,
                    requestParams: requestConfig
                })
            })
        })
    })

    const searchRequests = searches.map((search) => {
        const { url = '', requestParams = { url }, name, key = url || name } = search
        return {
            ...requestParams,
            uniqueKey: getValidKey(`${LABELS.SEARCH}_${key}`),
            userData: {
                ...userData,
                label: LABELS.SEARCH,
                search,
                ...search?.requestParams?.userData
            }
        }
    })

    return searchRequests
}
