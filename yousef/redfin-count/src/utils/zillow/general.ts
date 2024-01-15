import { createSessionFunctionBuilder, GlobalContext } from '../../base-utils'
import { lotSizeToString, sqft2acre } from '../atom'
import { getSmartproxyProxyUrl } from '../proxy'

import { LOT_SIZE, STATUS_MATRIX, TIME_MATRIX } from './consts'

export const createSessionFunctionBuilderCustom = (globalContext: GlobalContext<any, any, any>) => {
    return createSessionFunctionBuilder({
        websiteUrl: 'https://www.zillow.com/',
        // withProxyInfo: true
        extraRequestOptions: {
            headers: {
                Referer: 'https://www.zillow.com/',
                'Referrer-Policy': 'unsafe-url'
            }
        },
        proxyUrlBuilder: () => {
            let foundProxyUrl = false
            let proxyUrl: string | undefined

            while (!foundProxyUrl) {
                proxyUrl = getSmartproxyProxyUrl(globalContext.input)
                if (!globalContext.shared.inUseOrBlockedProxies.includes(proxyUrl)) {
                    foundProxyUrl = true
                }
            }
            return proxyUrl
        }
    })
}

export const orderSearchResults = (searchResults: any[]): any[] => {
    const searchResultsMap = new Map()
    // eslint-disable-next-line no-restricted-syntax
    for (const searchResult of searchResults) {
        const key = `${searchResult.status} - ${searchResult.daysOnZillow ?? searchResult.soldInLast} - ${
            searchResult.acreage
        }`
        searchResultsMap.set(key, searchResult)
    }
    const orderedSearchResults: any[] = []
    STATUS_MATRIX.forEach((status) => {
        TIME_MATRIX.forEach((t) => {
            LOT_SIZE.forEach((lot) => {
                const lotStr = `${lotSizeToString(sqft2acre(lot[0]), sqft2acre(lot[1]))}`
                const key = `${status} - ${t} - ${lotStr}`
                const searchResult = searchResultsMap.get(key)
                if (searchResult) orderedSearchResults.push(searchResult)
            })
        })
    })

    return orderedSearchResults
}
