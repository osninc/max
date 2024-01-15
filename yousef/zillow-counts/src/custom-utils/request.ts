import { alphaNum, getRandomInt, getSearchQuery, IBaseFinalInput, RANDOM_HEADERS } from '../utils'
import { ZILLOW } from '../utils/zillow'

import { DESTINATION } from './consts'

export const getRequestConfig = (destination: string, input: IBaseFinalInput, extraData?: any) => {
    const { searchType } = input

    let requestConfig: any = {}

    // change search terms depending on searchby option
    const query = getSearchQuery(input)

    // Determine regiontype
    let nameForUrl = query
    // const regionType = zillow.regionType[searchType.toLowerCase()]
    if (['city', 'county'].includes(searchType.toLowerCase())) {
        nameForUrl = alphaNum(query).replace(/ /gi, '-').toLowerCase()
    }

    // if (isTest) {
    //     return getTestRegion(searchType)
    // }
    const userData = {
        query
    }
    const baseConfig = {
        // headerGeneratorOptions: { ...randomHeaders },
        headers: {
            referer: 'https://www.zillow.com/',
            'referrer-policy': 'unsafe-url'
        },
        userData
    }

    switch (destination) {
        case DESTINATION.LOCATION_MAP_BOUNDS: {
            const url = ZILLOW.URL.MAP_BOUND.replace('NAME', nameForUrl)
            requestConfig = {
                ...baseConfig,
                url
            }
            requestConfig.userData.requestOptions = { searchParams: { q: query } }
            break
        }
        case DESTINATION.LOCATION_REGION: {
            requestConfig = {
                ...baseConfig,
                url: ZILLOW.URL.REGION
            }
            requestConfig.userData.requestOptions = { responseType: 'json', searchParams: { q: query } }
            break
        }
        case DESTINATION.SEARCH: {
            const { searchUrl, searchParams, status, lot, time } = extraData ?? {}

            const requestId = getRandomInt(20)

            const searchDataUrl = `${ZILLOW.URL.SEARCH}?searchQueryState=${encodeURIComponent(
                JSON.stringify(searchParams.searchQueryState)
            )}&wants=${encodeURIComponent(JSON.stringify(ZILLOW.WANTS))}&requestId=${requestId}`

            requestConfig = {
                ...baseConfig,
                url: searchDataUrl,
                headers: {
                    referer: searchUrl,
                    'referrer-policy': 'unsafe-url'
                },
                userData: {
                    searchType,
                    status,
                    searchUrl,
                    realSearch: searchParams.searchQueryState.usersSearchTerm,
                    lot,
                    time
                }
            }
            requestConfig.userData.requestOptions = {
                responseType: 'json',
                headerGeneratorOptions: { ...RANDOM_HEADERS }
                // searchParams: {
                //     ...searchParams,
                //     requestId
                // }
            }

            break
        }
        default:
            throw new Error(`Unknown destination: ${destination}`)
    }
    return requestConfig
}

export const isRequestBlocked = (statusCode: number, body: any) =>
    statusCode === 403 ||
    (typeof body === 'string' && body?.includes('Request blocked')) ||
    (typeof body === 'object' && body?.blockScript?.includes('captcha'))
