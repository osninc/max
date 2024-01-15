import { alphaNumWithoutSpace, getSearchQuery, RANDOM_HEADERS } from '../utils'
import { FOR_SALE_TIME_MATRIX, REDFIN, SOLD_TIME_MATRIX, STATUS_MATRIX } from '../utils/redfin'
import { queryParametersToString } from '../base-utils'

import { IFinalInput } from './types'
import { DESTINATION } from './consts'

export const getRequestConfig = (destination: string, input: IFinalInput, extraData?: any) => {
    const { searchType } = input

    let requestConfig: any = {}

    // change search terms depending on searchby option
    const query = getSearchQuery(input)

    // if (isTest) {
    //     return getTestRegion(searchBy)
    // }
    const userData = {
        query
    }

    const baseConfig = {
        // headerGeneratorOptions: { ...randomHeaders },
        headers: {
            accept: '*/*',
            'accept-language': 'en-US,en;q=0.9',
            Referer: 'https://www.redfin.com/',
            'Referrer-Policy': 'strict-origin-when-cross-origin'
        },
        userData
    }

    switch (destination) {
        case DESTINATION.LOCATION: {
            const url = REDFIN.URL.LOCATION.replace('QUERY', encodeURIComponent(query.toLowerCase().split(',')[0]))
            requestConfig = {
                ...baseConfig,
                url
            }
            // requestConfig.userData.requestOptions = { searchParams: { q: query } }
            break
        }
        case DESTINATION.SEARCH: {
            const { searchUrl, region, status, lot, time } = extraData ?? {}
            const queryParameters = {
                al: 1,
                include_nearby_homes: true,
                market: alphaNumWithoutSpace(query.toLowerCase()),
                ...(lot.max ? { max_parcel_size: lot.max } : {}),
                ...(lot.min ? { min_parcel_size: lot.min } : {}),
                num_homes: 5000,
                ord: 'days-on-redfin-asc',
                page_number: 1,
                region_id: region.id,
                region_type: region.type,
                ...(status === STATUS_MATRIX[0] ? { sf: '1,2,3,5,6,7' } : { sold_within_days: time }),
                start: 0,
                status: 9,
                ...(status === STATUS_MATRIX[0] ? { time_on_market_range: time } : {}),
                uipt: 5,
                v: 8
            }
            const searchDataUrl = `https://www.redfin.com/stingray/api/gis?${queryParametersToString({
                queryParameters,
                encodeKey: false,
                encodeValue: false
            })}`

            requestConfig = {
                ...baseConfig,
                url: searchDataUrl,
                headers: {
                    ...baseConfig.headers,
                    Referer: searchUrl,
                    'Referrer-Policy': 'strict-origin-when-cross-origin'
                },
                userData: {
                    searchType,
                    searchUrl,
                    status,
                    lot,
                    time:
                        (status === STATUS_MATRIX[0] ? FOR_SALE_TIME_MATRIX : SOLD_TIME_MATRIX).find(
                            (t) => t[0] === time
                        )?.[1] ?? time
                }
            }
            requestConfig.userData.requestOptions = {
                // responseType: 'json',
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
